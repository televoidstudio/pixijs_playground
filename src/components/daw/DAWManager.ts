import * as PIXI from "pixi.js";
import { Timeline } from "./components/Timeline";
import { Track } from "../daw/track/Track";
import { Clip } from "./components/Clip";
import { ITrack, ITimeline, IClip } from "../../types/daw";
import { EventManager } from "../../utils/EventManager";
import { TopBar } from "./components/TopBar";
import { Playhead } from "./components/Playhead";
import { DAWConfig } from "../../config/DAWConfig";
import { TrackList } from "../daw/track/TrackList";
import { ContextMenu } from "./context/ContextMenu";

/**
 * DAW 管理器類
 * 負責管理整個數字音頻工作站的核心功能
 */
export class DAWManager {
    // 常量定義
    private static readonly TOP_BAR_HEIGHT = 40;        // 頂部欄高度
    private static readonly BEATS_PER_BAR = 4;         // 每小節的拍數
    private static readonly SECONDS_PER_MINUTE = 60;    // 每分鐘的秒數
    private static readonly GRIDS_PER_BEAT = 1;        // 每拍的網格數
    
    // 核心組件
    private timeline: Timeline;                         // 時間軸組件
    private clips: Map<string, Clip> = new Map();      // 片段集合
    private timelineState: ITimeline;                  // 時間軸狀態
    private trackContainer: PIXI.Container;            // 軌道容器
    private background: PIXI.Graphics;                 // 背景圖形
    private eventManager: EventManager;                // 事件管理器
    private topBar: TopBar;                           // 頂部控制欄
    private playhead: Playhead;                       // 播放頭
    private trackList: TrackList;
    private contextMenu: ContextMenu;
    
    // 播放控制相關
    private isPlaying: boolean = false;               // 是否正在播放
    private lastTimestamp: number = 0;                // 上一幀時間戳
    private animationFrameId: number | null = null;   // 動畫幀 ID
    private bpm: number = 60;                         // 每分鐘節拍數
    private clipboardData: IClip | null = null;        // 剪貼板數據

    /**
     * 構造函數
     * @param app PIXI 應用實例
     */
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
        
        // 初始化 TrackList
        this.trackList = new TrackList(this.app);
        this.trackContainer.addChild(this.trackList.getContainer());
        
        // 初始化右鍵選單
        this.contextMenu = new ContextMenu();
        this.app.stage.addChild(this.contextMenu.getContainer());
        
        // 初始化
        this.init();
        this.setupTrackEvents();
        this.setupTransportEvents();
        this.setupPlayheadEvents();
        this.setupContextMenuEvents();
    }

    /**
     * 初始化 DAW 管理器
     * 設置背景、容器和事件監聽器
     */
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

    /**
     * 添加新軌道
     * @param track 軌道數據
     */
    public addTrack(track: ITrack) {
        console.log("Adding track:", track.id);
        // 使用 TrackList 來添加軌道
        this.trackList.addTrack(track);
    }

    /**
     * 添加新片段到指定軌道
     * @param clip 片段數據
     */
    public addClip(clip: IClip) {
        console.log(`DAWManager: Adding clip ${clip.id} to track ${clip.trackId}`);
        
        const track = this.trackList.getTrack(clip.trackId);
        if (!track) {
            console.error(`Track ${clip.trackId} not found`);
            return;
        }
        
        track.addClip(clip);
        this.eventManager.emit('daw:clip:added', { clip });
    }

    /**
     * 從指定軌道移除片段
     * @param clipId 片段 ID
     * @param trackId 軌道 ID
     */
    public removeClip(clipId: string, trackId: string) {
        const track = this.trackList.getTrack(trackId);
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

    /**
     * 處理視窗大小變化
     */
    private handleResize = () => {
        this.background
            .clear()
            .fill({ color: 0x1a1a1a })
            .rect(0, TopBar.HEIGHT, this.app.screen.width, this.app.screen.height - TopBar.HEIGHT);
        
        this.timeline.update();
        this.trackList.update();
        
        // 更新頂部控制欄
        this.topBar.update(this.app.screen.width);
        
        // 更新 playhead 高度
        this.playhead.setHeight(this.app.screen.height - TopBar.HEIGHT);
    }

    /**
     * 銷毀 DAW 管理器
     * 清理所有資源和事件監聽
     */
    public destroy() {
        window.removeEventListener('resize', this.handleResize);
        this.timeline.destroy();
        this.trackList.destroy();
        this.app.stage.removeChild(this.trackContainer);
        this.app.stage.removeChild(this.timeline.getContainer());
        this.topBar.destroy();
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    /**
     * 設置軌道相關事件監聽
     */
    private setupTrackEvents() {
        // 只處理高層級的業務邏輯
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

    /**
     * 設置播放控制相關事件監聽
     */
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

    /**
     * 設置播放速度(BPM)
     * @param bpm 每分鐘節拍數
     */
    private setBPM(bpm: number) {
        this.bpm = bpm;
        this.topBar.setBPM(bpm);
    }

    /**
     * 動畫更新函數
     * 負責更新播放頭位置和時間顯示
     */
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

    /**
     * 根據播放頭位置更新時間顯示
     */
    private updateTimeFromPlayhead() {
        const position = this.playhead.getPosition();
        // 直接使用網格位置作為拍數（因為一個網格就是一拍）
        this.topBar.setBeat(position);
    }

    /**
     * 開始播放
     */
    private play() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.lastTimestamp = performance.now();
        this.animate();
    }

    /**
     * 暫停播放
     */
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

    /**
     * 停止播放並重置播放頭
     */
    private stop() {
        // 先停止播放狀態
        this.isPlaying = false;
        
        // 取消動畫幀
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // 重置 playhead 位置
        this.playhead.setPosition(0);
        
        // 更新時間顯示
        this.updateTimeFromPlayhead();
        
        // 重置時間戳
        this.lastTimestamp = 0;
    }

    /**
     * 計算每拍的秒數
     */
    private getSecondsPerBeat(): number {
        return DAWManager.SECONDS_PER_MINUTE / this.bpm;
    }

    /**
     * 計算每個網格的秒數
     */
    private getSecondsPerGrid(): number {
        return this.getSecondsPerBeat() / DAWManager.GRIDS_PER_BEAT;
    }

    /**
     * 設置播放頭事件監聽
     */
    private setupPlayheadEvents() {
        this.eventManager.on('playhead:move', () => {
            this.updateTimeFromPlayhead();
        });
    }

    private setupContextMenuEvents(): void {
        // 點擊任何地方都會觸發這個事件
        this.app.stage.eventMode = 'static';
        this.app.stage.hitArea = this.app.screen;
        
        // 使用 pointerdown 而不是 click，這樣可以捕獲所有點擊
        this.app.stage.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            // 如果是右鍵點擊，不要隱藏選單
            if (event.button === 2) return;
            
            // 隱藏選單
            this.contextMenu.hide();
        });

        // 監聽軌道右鍵事件
        this.eventManager.on('track:contextmenu', (data) => {
            // 先隱藏之前的選單（如果有的話）
            this.contextMenu.hide();
            
            const track = this.trackList.getTrack(data.trackId);
            if (!track) return;

            // 顯示新的選單
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
            
            // 阻止事件冒泡
            event.stopPropagation();
        });

        // 監聽片段右鍵事件，同樣的處理方式
        this.eventManager.on('clip:contextmenu', (data) => {
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
            
            // 阻止事件冒泡
            event.stopPropagation();
        });
    }

    // 實現右鍵選單的操作方法
    private renameTrack(trackId: string): void {
        // TODO: 實現重命名邏輯
        console.log('Rename track:', trackId);
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
        // 獲取片段數據
        const clip = this.findClip(clipId);
        if (!clip) return;

        // 將片段數據存儲到剪貼板
        this.clipboardData = { ...clip };
        
        // 刪除原片段
        this.deleteClip(clipId);
    }

    private copyClip(clipId: string): void {
        // 獲取片段數據
        const clip = this.findClip(clipId);
        if (!clip) return;

        // 將片段數據存儲到剪貼板
        this.clipboardData = { ...clip };
    }

    private deleteClip(clipId: string): void {
        // 遍歷所有軌道尋找並刪除片段
        for (const track of this.trackList.getTracks()) {
            track.removeClip(clipId);
        }
        this.eventManager.emit('clip:removed', { clipId });
    }

    private splitClip(clipId: string): void {
        // 獲取片段數據
        const clip = this.findClip(clipId);
        if (!clip) return;

        // 在當前播放頭位置分割片段
        const playheadPosition = this.playhead.getPosition();
        const clipStartTime = clip.startTime;
        const clipDuration = clip.duration;

        if (playheadPosition > clipStartTime && 
            playheadPosition < clipStartTime + clipDuration) {
            
            // 創建兩個新片段
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

            // 刪除原片段
            this.deleteClip(clipId);

            // 添加新片段
            this.addClip(leftClip);
            this.addClip(rightClip);
        }
    }

    private findClip(clipId: string): IClip | null {
        for (const track of this.trackList.getTracks()) {
            const clip = track.getClip(clipId);
            if (clip) {
                return clip.getData();
            }
        }
        return null;
    }
}