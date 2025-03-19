import * as PIXI from "pixi.js";
import { Timeline } from "./components/Timeline";
import { Track } from "./components/Track";
import { Clip } from "./components/Clip";
import { ITrack, ITimeline, IClip } from "../../types/daw";
import { EventManager } from "../../utils/EventManager";
import { TopBar } from "./components/TopBar";
import { Playhead } from "./components/Playhead";

export class DAWManager {
    private static readonly TOP_BAR_HEIGHT = 40;
    private static readonly BEATS_PER_BAR = 4; // 每小節的拍數
    private static readonly SECONDS_PER_MINUTE = 60;
    private static readonly GRIDS_PER_BEAT = 1; // 每拍幾個格子
    
    private timeline: Timeline;
    private tracks: Map<string, Track> = new Map();
    private clips: Map<string, Clip> = new Map();
    private timelineState: ITimeline;
    private trackContainer: PIXI.Container;
    private background: PIXI.Graphics;
    private eventManager: EventManager;
    private topBar: TopBar;
    private playhead: Playhead;
    private isPlaying: boolean = false;
    private lastTimestamp: number = 0;
    private animationFrameId: number | null = null;
    private bpm: number = 60;

    constructor(private app: PIXI.Application) {
        console.log("DAWManager constructor called");  // 檢查點 1
        this.eventManager = EventManager.getInstance();
        this.trackContainer = new PIXI.Container();
        this.app.stage.addChild(this.trackContainer);
        
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
        
        // 創建時間軸
        this.timeline = new Timeline(this.app, this.timelineState);
        
        // 創建頂部控制欄
        this.topBar = new TopBar(this.app.screen.width);
        this.app.stage.addChild(this.topBar.getContainer());
        
        // 調整容器位置，讓 trackContainer 緊貼在 TopBar 下方
        this.trackContainer.position.y = TopBar.HEIGHT;
        
        // 調整 timeline 位置，讓它也緊貼在 TopBar 下方
        this.timeline.getContainer().position.y = TopBar.HEIGHT;
        
        // 創建 Playhead
        this.playhead = new Playhead(this.app.screen.height - TopBar.HEIGHT, this.timelineState.gridSize);
        this.playhead.getContainer().position.y = TopBar.HEIGHT;
        this.app.stage.addChild(this.playhead.getContainer());
        
        // 確保 Playhead 初始位置在 0:00.0
        this.playhead.setPosition(0);
        
        // 設置動畫循環
        // this.app.ticker.add(this.update.bind(this));
        
        // 設置初始 BPM
        this.setBPM(this.timelineState.bpm);
        
        // 初始化
        this.init();
        this.setupTrackEvents();
        this.setupTransportEvents();
        this.setupPlayheadEvents();
    }

    private init() {
        console.log("DAWManager init");
        
        // 測試圖形
        const testGraphics = new PIXI.Graphics();
        testGraphics
            .fill({ color: 0xff0000 })
            .rect(100, 100, 100, 100);
        
        this.app.stage.addChild(testGraphics);
        
        // 設置背景
        this.background
            .clear()
            .fill({ color: 0x1a1a1a })
            .rect(0, TopBar.HEIGHT, 
                  this.app.screen.width, 
                  this.app.screen.height - TopBar.HEIGHT);
        
        // 添加所有容器到舞台（順序很重要）
        this.app.stage.addChild(this.background);          // 背景在最底層
        this.app.stage.addChild(this.trackContainer);      // 軌道容器
        this.app.stage.addChild(this.timeline.getContainer()); // 時間軸
        this.app.stage.addChild(this.playhead.getContainer()); // Playhead 在最上層
        
        // 設置事件監聽
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // 添加 BPM 變更事件監聽
        this.eventManager.on('daw:bpm:change', (data: { bpm: number }) => {
            this.setBPM(data.bpm);
        });
    }

    public addTrack(track: ITrack) {
        console.log("Adding track:", track.id);  // 檢查點 2
        const trackComponent = new Track(track, this.tracks.size);
        this.tracks.set(track.id, trackComponent);
        this.trackContainer.addChild(trackComponent.getContainer());
        console.log("Track added, container children:", this.trackContainer.children.length);  // 檢查點 3
    }

    public addClip(clip: IClip) {
        console.log(`DAWManager: Adding clip ${clip.id} to track ${clip.trackId}`);
        
        const track = this.tracks.get(clip.trackId);
        if (!track) {
            console.error(`Track ${clip.trackId} not found`);
            return;
        }
        
        track.addClip(clip);
        this.eventManager.emit('daw:clip:added', { clip });
    }

    public removeClip(clipId: string, trackId: string) {
        const track = this.tracks.get(trackId);
        if (track) {
            track.removeClip(clipId);
            this.eventManager.emit('daw:clip:removed', { clipId });
        }
    }

    private updateLayout() {
        // 更新所有組件的位置和狀態
    }

    public setPosition(position: number) {
        this.timeline.setPosition(position);
    }

    private handleResize = () => {
        this.background
            .clear()
            .fill({ color: 0x1a1a1a })
            .rect(0, TopBar.HEIGHT, this.app.screen.width, this.app.screen.height - TopBar.HEIGHT);
        
        this.timeline.update();
        this.tracks.forEach(track => {
            track.update();
        });
        
        // 更新頂部控制欄
        this.topBar.update(this.app.screen.width);
        
        // 更新 playhead 高度
        this.playhead.setHeight(this.app.screen.height - TopBar.HEIGHT);
    }

    public destroy() {
        window.removeEventListener('resize', this.handleResize);
        this.timeline.destroy();
        this.tracks.forEach(track => track.destroy());
        this.app.stage.removeChild(this.trackContainer);
        this.app.stage.removeChild(this.timeline.getContainer());
        this.topBar.destroy();
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    private setupTrackEvents() {
        this.eventManager.on('daw:track:dragend', (data: { trackId: string; finalY: number }) => {
            // 計算新的索引位置
            const newIndex = Math.floor((data.finalY - 50) / 80);
            this.reorderTracks(data.trackId, newIndex);
        });
    }

    private reorderTracks(draggedTrackId: string, newIndex: number) {
        const tracks = Array.from(this.tracks.entries());
        const oldIndex = tracks.findIndex(([id]) => id === draggedTrackId);
        
        if (oldIndex === -1) return;
        
        // 確保新索引在有效範圍內
        const clampedNewIndex = Math.max(0, Math.min(newIndex, tracks.length - 1));
        
        if (clampedNewIndex === oldIndex) return; // 如果位置沒變，直接返回
        
        // 創建新的順序數組
        const trackOrder = tracks.map(([id]) => id);
        trackOrder.splice(oldIndex, 1);
        trackOrder.splice(clampedNewIndex, 0, draggedTrackId);

        // 更新所有軌道的位置
        trackOrder.forEach((id, index) => {
            const track = this.tracks.get(id);
            if (track) {
                const targetY = Track.TIMELINE_HEIGHT + (index * Track.TRACK_HEIGHT);
                track.setY(targetY);
            }
        });

        // 更新內部數據結構
        const newTracks = new Map<string, Track>();
        trackOrder.forEach(id => {
            const track = this.tracks.get(id);
            if (track) {
                newTracks.set(id, track);
            }
        });
        this.tracks = newTracks;

        // 發送重新排序事件
        this.eventManager.emit('daw:track:reordered', { 
            trackId: draggedTrackId,
            newIndex: clampedNewIndex
        });
    }

    private setupTransportEvents() {
        this.eventManager.on('daw:transport', (data: { action: 'play' | 'pause' | 'stop' }) => {
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
    }

    private setBPM(bpm: number) {
        this.bpm = bpm;
        this.topBar.setBPM(bpm);
    }

    private animate = () => {
        if (!this.isPlaying) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTimestamp) / 1000; // 轉換為秒
        this.lastTimestamp = currentTime;

        // 計算每秒移動的拍數
        const beatsPerSecond = this.bpm / DAWManager.SECONDS_PER_MINUTE;
        const beatDelta = deltaTime * beatsPerSecond;

        // 更新 playhead 位置
        const currentPosition = this.playhead.getPosition();
        const newPosition = currentPosition + beatDelta;
        this.playhead.setPosition(newPosition);

        // 更新時間顯示
        this.updateTimeFromPlayhead();

        this.animationFrameId = requestAnimationFrame(this.animate);
    }

    private updateTimeFromPlayhead() {
        const position = this.playhead.getPosition();
        // 直接使用網格位置作為拍數（因為一個網格就是一拍）
        this.topBar.setBeat(position);
    }

    private play() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.lastTimestamp = performance.now();
        this.animate();
    }

    private pause() {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        // 暫停時也更新一次時間顯示
        this.updateTimeFromPlayhead();
    }

    private stop() {
        this.pause();
        this.playhead.setPosition(0);
        // 停止時更新時間顯示為 0
        this.topBar.setTime(0);
    }

    private getSecondsPerBeat(): number {
        return DAWManager.SECONDS_PER_MINUTE / this.bpm;
    }

    private getSecondsPerGrid(): number {
        return this.getSecondsPerBeat() / DAWManager.GRIDS_PER_BEAT;
    }

    // 當 Playhead 被手動拖動時也要更新時間
    private setupPlayheadEvents() {
        this.eventManager.on('playhead:move', () => {
            this.updateTimeFromPlayhead();
        });
    }
}