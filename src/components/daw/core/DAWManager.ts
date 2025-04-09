import * as PIXI from "pixi.js";
import { DAWConfig } from '../../../config/DAWConfig';
import { EventManager } from '../../../events/EventManager';
import { Timeline } from '../timeline/Timeline';
import { TrackList } from '../track/TrackList';
import { TopBar } from '../transport/TopBar';
import { TransportBar } from '../transport/TransportBar';
import { Playhead } from '../timeline/Playhead';
import { ContextMenu } from '../context/ContextMenu';
import { Toolbar } from '../toolbar/Toolbar';
import { AudioEngine } from '../../../audio/AudioEngine';
import { ITimeline, IClip, ITrack } from '../../../types/daw';
import { DAWEventPayload } from '../../../types/events';
import TrackArea from '../track/TrackArea';
import { MIDIEditor } from "../midi/MIDIEditor";

export class DAWManager {
    // 常量定義
    private static readonly BEATS_PER_BAR = 4;
    private static readonly SECONDS_PER_MINUTE = 60;
    private static readonly GRIDS_PER_BEAT = 1;
    
    // 核心組件
    private eventManager: EventManager;
    private timeline: Timeline;
    private topBar: TopBar;
    private transportBar: TransportBar;
    private playhead: Playhead;
    private contextMenu: ContextMenu;
    private background: PIXI.Graphics;
    private toolbar: Toolbar;
    private audioEngine: AudioEngine;
    private trackArea: TrackArea;
    
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
        
        // 初始化音頻引擎
        this.audioEngine = new AudioEngine();
        
        // 初始化時間軸狀態
        this.timelineState = {
            position: 0,
            zoom: 1,
            gridSize: 50,
            isPlaying: false,
            bpm: 60
        };

        // 創建背景
        this.background = new PIXI.Graphics();
        this.background.zIndex = 0;
        this.app.stage.addChild(this.background);

        // 創建並添加 TopBar
        this.topBar = new TopBar(this.app.screen.width);
        this.topBar.getContainer().position.y = 0;
        this.topBar.getContainer().zIndex = 1;
        this.app.stage.addChild(this.topBar.getContainer());

        // 創建並添加 TransportBar
        this.transportBar = new TransportBar(this.app.screen.width);
        this.transportBar.getContainer().position.y = TopBar.HEIGHT;
        this.transportBar.getContainer().zIndex = 2;
        this.app.stage.addChild(this.transportBar.getContainer());

        // 創建並添加 Timeline
        this.timeline = new Timeline(this.app, this.timelineState);
        this.timeline.getContainer().position.y = TopBar.HEIGHT + TransportBar.HEIGHT;
        this.timeline.getContainer().zIndex = 3;
        this.app.stage.addChild(this.timeline.getContainer());

        // 創建並添加 TrackArea
        this.trackArea = new TrackArea(this.app);
        this.trackArea.getContainer().position.y = TopBar.HEIGHT + TransportBar.HEIGHT + DAWConfig.dimensions.timelineHeight;
        this.trackArea.getContainer().zIndex = 4;
        this.app.stage.addChild(this.trackArea.getContainer());

        // 創建並添加 Playhead
        this.playhead = new Playhead(this.app.screen.height - TopBar.HEIGHT - TransportBar.HEIGHT - DAWConfig.dimensions.timelineHeight, this.timelineState.gridSize);
        this.playhead.getContainer().position.y = TopBar.HEIGHT + TransportBar.HEIGHT + DAWConfig.dimensions.timelineHeight;
        this.playhead.getContainer().zIndex = 10;
        this.app.stage.addChild(this.playhead.getContainer());

        // 創建並添加 ContextMenu
        this.contextMenu = new ContextMenu();
        this.contextMenu.getContainer().zIndex = 100;
        this.app.stage.addChild(this.contextMenu.getContainer());

        // 創建並添加 Toolbar
        this.toolbar = new Toolbar(this.app.screen.width);
        this.toolbar.getContainer().position.y = this.app.screen.height - Toolbar.HEIGHT - 5;
        this.toolbar.getContainer().zIndex = 50;
        this.app.stage.addChild(this.toolbar.getContainer());

        // 更新 TrackList
        this.trackArea.getTrackList().update();

        // 初始化
        this.init();
        this.setupTrackEvents();
        this.setupTransportEvents();
        this.setupPlayheadEvents();
        this.setupContextMenuEvents();
        this.setupAudioEvents();
        this.setupWindowEvents();
        
        // 設置初始 BPM
        this.setBPM(this.timelineState.bpm);
    }

    private init(): void {
        this.initAudio();  // 初始化音頻
        this.timeline.update();
        this.trackArea.getTrackList().update();
        this.playhead.setTimePosition(0);
    }

    private handleResize = () => {
        // 更新背景
        this.background
            .clear()
            .fill({ color: 0x1a1a1a })
            .rect(0, TopBar.HEIGHT + TransportBar.HEIGHT, this.app.screen.width, this.app.screen.height - TopBar.HEIGHT - TransportBar.HEIGHT);

        // 更新組件
        this.topBar.update(this.app.screen.width);
        this.transportBar.update(this.app.screen.width);
        this.timeline.update();
        this.trackArea.update();

        // 更新位置
        this.transportBar.getContainer().position.y = TopBar.HEIGHT;
        this.timeline.getContainer().position.y = TopBar.HEIGHT + TransportBar.HEIGHT;
        this.trackArea.getContainer().position.y = TopBar.HEIGHT + TransportBar.HEIGHT + DAWConfig.dimensions.timelineHeight;
        this.playhead.getContainer().position.y = TopBar.HEIGHT + TransportBar.HEIGHT + DAWConfig.dimensions.timelineHeight;

        // 更新 playhead 高度
        this.playhead.setHeight(this.app.screen.height - TopBar.HEIGHT - TransportBar.HEIGHT - DAWConfig.dimensions.timelineHeight);

        // 更新軌道列表
        this.trackArea.getTrackList().update();

        // 更新工具欄位置
        this.toolbar.getContainer().position.y = this.app.screen.height - Toolbar.HEIGHT;
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

        // 添加 BPM 改變事件的監聽
        this.eventManager.on('daw:bpm:change', (data: { bpm: number }) => {
            this.setBPM(data.bpm);
        });
    }

    private setupTrackEvents(): void {
        this.eventManager.on('daw:track:reorder', ({ trackId, newIndex }) => {
            this.trackArea.getTrackList().moveTrack(trackId, newIndex);
        });

        this.eventManager.on('track:rename', ({ trackId, name }) => {
            const track = this.trackArea.getTrackList().getTrack(trackId);
            if (track) {
                track.setName(name);
            }
        });

        // 添加對新增音軌事件的監聽
        this.eventManager.on('daw:track:add', ({ track }) => {
            console.log('Adding new track:', track);
            this.addTrack(track);
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
        const timeInSeconds = (position / this.timelineState.bpm) * DAWConfig.transport.secondsPerMinute;
        this.transportBar.setTime(timeInSeconds);
    }

    private animate = () => {
        if (!this.isPlaying) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTimestamp) / 1000;
        this.lastTimestamp = currentTime;

        // 根據 BPM 計算每秒鐘應該移動的拍數
        const beatsPerSecond = this.bpm / DAWConfig.transport.secondsPerMinute;
        const beatDelta = deltaTime * beatsPerSecond;

        const currentPosition = this.playhead.getPosition();
        const newPosition = currentPosition + beatDelta;

        // 更新 Playhead 位置
        this.playhead.setTimePosition(newPosition);
        
        // 更新時間顯示（將拍數轉換為秒數）
        const timeInSeconds = newPosition / beatsPerSecond;
        this.transportBar.setTime(timeInSeconds);

        // 更新時間軸狀態
        this.timelineState.position += timeInSeconds;

        // 更新組件
        this.timeline.update();
        this.playhead.update();
        this.trackArea.update();

        this.animationFrameId = requestAnimationFrame(this.animate);
    }

    public destroy(): void {
        this.timeline.destroy();
        this.trackArea.destroy();
        this.topBar.destroy();
        this.transportBar.destroy();
        this.playhead.destroy();
        this.toolbar.destroy();
        this.audioEngine.destroy();
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
        const track = this.trackArea.getTrackList().getTrack(trackId);
        if (track) {
            // TODO: 實現重命名邏輯
            console.log('Rename track:', trackId);
        }
    }

    private deleteTrack(trackId: string): void {
        const track = this.trackArea.getTrackList().getTrack(trackId);
        if (track) {
            this.trackArea.getTrackList().removeTrack(trackId);
            this.eventManager.emit('track:removed', { trackId });
        }
    }

    private duplicateTrack(trackId: string): void {
        const track = this.trackArea.getTrackList().getTrack(trackId);
        if (track) {
            // TODO: 實現複製軌道邏輯
            console.log('Duplicate track:', trackId);
        }
    }

    private muteTrack(trackId: string): void {
        const track = this.trackArea.getTrackList().getTrack(trackId);
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
        const tracks = this.trackArea.getTrackList().getTracks();
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
        const tracks = this.trackArea.getTrackList().getTracks();
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
        const track = this.trackArea.getTrackList().getTrack(clipData.trackId);
        if (!track) return;
        
        track.addClip(clipData);
        this.eventManager.emit('clip:added', { clip: clipData });
    }

    public addTrack(track: ITrack): void {
        try {
            console.log('Adding track:', track);
            this.trackArea.getTrackList().addTrack(track);
            this.eventManager.emit('daw:track:added', { track });
        } catch (error) {
            console.error('Failed to add track:', error);
            throw error;
        }
    }

    private setBPM(bpm: number): void {
        this.timelineState.bpm = bpm;
        this.bpm = bpm;  // 更新 DAWManager 的 bpm
        this.transportBar.setBPM(bpm);
        this.timeline.update();
        
        // 如果正在播放，重新計算播放速度
        if (this.isPlaying) {
            this.lastTimestamp = performance.now();  // 重置時間戳
        }
    }

    private setupAudioEvents(): void {
        this.eventManager.on('daw:audio:test', (data: { type: string }) => {
            switch (data.type) {
                case 'note':
                    this.audioEngine.playTestNote('C4', '8n');
                    break;
                case 'chord':
                    this.audioEngine.playChord(['C4', 'E4', 'G4'], '4n');
                    break;
                case 'scale':
                    this.audioEngine.playScale();
                    break;
            }
        });

        this.eventManager.on('daw:tool:changed', (data: { tool: string }) => {
            console.log('Tool changed:', data.tool);
        });
    }

    private async initAudio(): Promise<void> {
        await this.audioEngine.init();
    }

    private setupWindowEvents(): void {
        this.eventManager.on('daw:window:add', ({ window, zIndex }) => {
            window.zIndex = zIndex;
            this.app.stage.addChild(window);
        });

        this.eventManager.on('daw:window:remove', ({ window }) => {
            if (window && window.parent) {
                window.parent.removeChild(window);
            }
        });
    }
} 