import * as PIXI from "pixi.js";
import { DAWConfig } from '../../../config/DAWConfig';
import { EventManager } from '../../../utils/EventManager';
import { Timeline } from '../timeline/Timeline';
import { TrackList } from '../track/TrackList';
import { TopBar } from '../transport/TopBar';
import { Playhead } from '../timeline/Playhead';
import { ContextMenu } from '../context/ContextMenu';
import { ITimeline, IClip, ITrack } from '../../../types/daw';
import { DAWEventPayload } from '../../../types/events';

export class DAWManager {
    // 常量定義
    private static readonly BEATS_PER_BAR = 4;
    private static readonly SECONDS_PER_MINUTE = 60;
    private static readonly GRIDS_PER_BEAT = 1;
    
    // 核心組件
    private eventManager: EventManager;
    private timeline: Timeline;
    private trackList: TrackList;
    private topBar: TopBar;
    private playhead: Playhead;
    private contextMenu: ContextMenu;
    private background: PIXI.Graphics;
    private trackContainer: PIXI.Container;
    
    // 狀態管理
    private timelineState: ITimeline;
    private isPlaying: boolean = false;
    private lastTimestamp: number = 0;
    private animationFrameId: number | null = null;
    private bpm: number = DAWConfig.transport.defaultBPM;
    private clipboardData: IClip | null = null;

    constructor(private app: PIXI.Application) {
        console.log("DAWManager constructor called");
        this.eventManager = EventManager.getInstance();
        
        // 設置舞台為可排序
        this.app.stage.sortableChildren = true;
        
        // 創建容器
        this.trackContainer = new PIXI.Container();
        
        // 初始化時間軸狀態
        this.timelineState = {
            position: 0,
            zoom: 1,
            gridSize: 50,
            isPlaying: false,
            bpm: 60
        };

        // 創建組件
        this.background = new PIXI.Graphics();
        this.topBar = new TopBar(this.app.screen.width);
        this.timeline = new Timeline(this.app, this.timelineState);
        this.playhead = new Playhead(this.app.screen.height - TopBar.HEIGHT - DAWConfig.dimensions.timelineHeight, this.timelineState.gridSize);
        this.trackList = new TrackList(this.app);
        this.contextMenu = new ContextMenu();

        // 設置組件位置
        this.topBar.getContainer().position.y = 0;
        this.timeline.getContainer().position.y = TopBar.HEIGHT;
        this.trackContainer.position.y = TopBar.HEIGHT + DAWConfig.dimensions.timelineHeight;
        this.playhead.getContainer().position.y = TopBar.HEIGHT + DAWConfig.dimensions.timelineHeight;

        // 設置組件的 zIndex
        this.background.zIndex = 0;
        this.topBar.getContainer().zIndex = 1;
        this.timeline.getContainer().zIndex = 2;
        this.trackContainer.zIndex = 3;
        this.playhead.getContainer().zIndex = 10; // 確保 playhead 在最上層
        this.contextMenu.getContainer().zIndex = 100; // context menu 永遠在最上

        // 添加組件到舞台
        this.app.stage.addChild(this.background);
        this.app.stage.addChild(this.topBar.getContainer());
        this.app.stage.addChild(this.timeline.getContainer());
        this.app.stage.addChild(this.trackContainer);
        this.app.stage.addChild(this.playhead.getContainer());
        this.app.stage.addChild(this.contextMenu.getContainer());

        // 將 TrackList 添加到 trackContainer
        this.trackContainer.addChild(this.trackList.getContainer());

        // 初始化
        this.init();
        this.setupTrackEvents();
        this.setupTransportEvents();
        this.setupPlayheadEvents();
        this.setupContextMenuEvents();
        
        // 設置初始 BPM
        this.setBPM(this.timelineState.bpm);
    }

    private init(): void {
        this.timeline.update();
        this.trackList.update();
        this.playhead.setTimePosition(0);
    }

    private handleResize = () => {
        // 更新背景
        this.background
            .clear()
            .fill({ color: 0x1a1a1a })
            .rect(0, TopBar.HEIGHT, this.app.screen.width, this.app.screen.height - TopBar.HEIGHT);

        // 更新組件
        this.topBar.update(this.app.screen.width);
        this.timeline.update();

        // 更新位置
        this.timeline.getContainer().position.y = TopBar.HEIGHT;
        this.trackContainer.position.y = TopBar.HEIGHT + DAWConfig.dimensions.timelineHeight;
        this.playhead.getContainer().position.y = TopBar.HEIGHT + DAWConfig.dimensions.timelineHeight;

        // 更新 playhead 高度
        this.playhead.setHeight(this.app.screen.height - TopBar.HEIGHT - DAWConfig.dimensions.timelineHeight);

        // 更新軌道列表
        this.trackList.update();
    }

    private setupTransportEvents(): void {
        this.eventManager.on('daw:transport', (data: DAWEventPayload['daw:transport']) => {
            switch (data.action) {
                case 'play':
                    this.play();
                    break;
                case 'pause':
                    this.pause();
                    break;
                case 'stop':
                    this.stop();
                    break;
            }
        });

        this.eventManager.on('daw:playhead', (data: DAWEventPayload['daw:playhead']) => {
            this.seek(data.position);
        });
    }

    private setupTrackEvents(): void {
        this.eventManager.on('daw:track:reorder', ({ trackId, newIndex }) => {
            this.trackList.moveTrack(trackId, newIndex);
        });

        this.eventManager.on('track:rename', ({ trackId, name }) => {
            const track = this.trackList.getTrack(trackId);
            if (track) {
                track.setName(name);
            }
        });
    }

    private setupPlayheadEvents(): void {
        this.eventManager.on('daw:playhead:move', () => {
            this.updateTimeFromPlayhead();
        });
    }

    private play(): void {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.lastTimestamp = performance.now();
        this.animate();
    }

    private pause(): void {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    private stop(): void {
        this.isPlaying = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.playhead.setTimePosition(0);
        this.updateTimeFromPlayhead();
    }

    private seek(position: number): void {
        this.playhead.setTimePosition(position);
        this.updateTimeFromPlayhead();
    }

    private updateTimeFromPlayhead(): void {
        const position = this.playhead.getPosition();
        this.topBar.setBeat(position);
    }

    private animate = () => {
        if (!this.isPlaying) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTimestamp) / 1000;
        this.lastTimestamp = currentTime;

        const beatsPerSecond = this.timelineState.bpm / DAWConfig.transport.secondsPerMinute;
        const beatDelta = deltaTime * beatsPerSecond;

        const currentPosition = this.playhead.getPosition();
        const newPosition = currentPosition + beatDelta;
        
        this.playhead.setTimePosition(newPosition);
        this.updateTimeFromPlayhead();

        this.animationFrameId = requestAnimationFrame(this.animate);
    }

    public destroy(): void {
        this.timeline.destroy();
        this.trackList.destroy();
        this.topBar.destroy();
        this.playhead.destroy();
    }

    // 添加右鍵選單相關方法
    private setupContextMenuEvents(): void {
        this.app.stage.eventMode = 'static';
        this.app.stage.hitArea = this.app.screen;
        
        this.app.stage.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            if (event.button === 2) return;
            this.contextMenu.hide();
        });

        this.eventManager.on('daw:track:contextmenu', (data) => {
            this.contextMenu.hide();
            this.contextMenu.show([
                {
                    label: '重命名',
                    action: () => this.renameTrack(data.trackId),
                    shortcut: 'F2'
                },
                {
                    label: '刪除',
                    action: () => this.deleteTrack(data.trackId),
                    shortcut: 'Del'
                },
                {
                    label: '複製',
                    action: () => this.duplicateTrack(data.trackId),
                    shortcut: 'Ctrl+D'
                },
                {
                    label: '靜音',
                    action: () => this.muteTrack(data.trackId),
                    shortcut: 'M'
                }
            ], data.x, data.y);
        });

        this.eventManager.on('daw:clip:contextmenu', (data) => {
            this.contextMenu.hide();
            this.contextMenu.show([
                {
                    label: '剪切',
                    action: () => this.cutClip(data.clipId),
                    shortcut: 'Ctrl+X'
                },
                {
                    label: '複製',
                    action: () => this.copyClip(data.clipId),
                    shortcut: 'Ctrl+C'
                },
                {
                    label: '刪除',
                    action: () => this.deleteClip(data.clipId),
                    shortcut: 'Del'
                },
                {
                    label: '分割',
                    action: () => this.splitClip(data.clipId),
                    shortcut: 'S'
                }
            ], data.x, data.y);
        });
    }

    private renameTrack(trackId: string): void {
        const track = this.trackList.getTrack(trackId);
        if (track) {
            // TODO: 實現重命名邏輯
            console.log('Rename track:', trackId);
        }
    }

    private deleteTrack(trackId: string): void {
        const track = this.trackList.getTrack(trackId);
        if (track) {
            this.trackList.removeTrack(trackId);
            this.eventManager.emit('track:removed', { trackId });
        }
    }

    private duplicateTrack(trackId: string): void {
        const track = this.trackList.getTrack(trackId);
        if (track) {
            // TODO: 實現複製軌道邏輯
            console.log('Duplicate track:', trackId);
        }
    }

    private muteTrack(trackId: string): void {
        const track = this.trackList.getTrack(trackId);
        if (track) {
            // TODO: 實現靜音邏輯
            console.log('Mute track:', trackId);
        }
    }

    private cutClip(clipId: string): void {
        const clip = this.findClip(clipId);
        if (!clip) return;
        this.clipboardData = { ...clip };
        this.deleteClip(clipId);
    }

    private copyClip(clipId: string): void {
        const clip = this.findClip(clipId);
        if (!clip) return;
        this.clipboardData = { ...clip };
    }

    private deleteClip(clipId: string): void {
        const tracks = this.trackList.getTracks();
        if (tracks) {
            tracks.forEach(track => track.removeClip(clipId));
        }
        this.eventManager.emit('daw:clip:removed', { clipId });
    }

    private splitClip(clipId: string): void {
        const clip = this.findClip(clipId);
        if (!clip) return;

        const playheadPosition = this.playhead.getPosition();
        const clipStartTime = clip.startTime;
        const clipDuration = clip.duration;

        if (playheadPosition > clipStartTime && 
            playheadPosition < clipStartTime + clipDuration) {
            
            const leftClip: IClip = {
                ...clip,
                id: `${clip.id}_left`,
                duration: playheadPosition - clipStartTime
            };

            const rightClip: IClip = {
                ...clip,
                id: `${clip.id}_right`,
                startTime: playheadPosition,
                duration: clipDuration - (playheadPosition - clipStartTime)
            };

            this.deleteClip(clipId);
            this.addClip(leftClip);
            this.addClip(rightClip);
        }
    }

    private findClip(clipId: string): IClip | null {
        const tracks = this.trackList.getTracks();
        if (!tracks) return null;
        
        for (const track of tracks) {
            const clip = track.getClip(clipId);
            if (clip) {
                return clip;
            }
        }
        return null;
    }

    public addClip(clipData: IClip): void {
        const track = this.trackList.getTrack(clipData.trackId);
        if (!track) return;
        
        track.addClip(clipData);
        this.eventManager.emit('clip:added', { clip: clipData });
    }

    public addTrack(track: ITrack): void {
        try {
            console.log('Adding track:', track);
            this.trackList.addTrack(track);
            this.eventManager.emit('daw:track:added', { track });
        } catch (error) {
            console.error('Failed to add track:', error);
            throw error;
        }
    }

    private setBPM(bpm: number): void {
        this.timelineState.bpm = bpm;
        this.timeline.update();
    }
} 