import * as PIXI from "pixi.js";
import { UIEventBus } from "../../events/UIEventBus";
import { EventTranslator } from "../../events/core/EventTranslator";
import { DAWConfig } from "../../config/DAWConfig";
import { TimelineComponent } from "../components/daw/timeline/TimelineComponent";
import { PlayheadComponent } from "../components/daw/timeline/PlayheadComponent";
import { TopBarComponent } from "../components/daw/transport/TopBarComponent";
import { ITimeline } from "../../types/daw";

/**
 * DAW UI 管理器
 * 負責管理所有 UI 組件的渲染和交互
 */
export class DawUIManager {
    // 常量定義
    private static readonly BACKGROUND_COLOR = 0x1a1a1a;
    private static readonly ZOOM_FACTOR = 0.1;
    
    // 核心組件
    private timeline: TimelineComponent;
    private playhead: PlayheadComponent;
    private topBar: TopBarComponent;
    private background: PIXI.Graphics;
    private trackContainer: PIXI.Container;
    private eventTranslator: EventTranslator;
    private container: PIXI.Container;

    // 狀態管理
    private isResizing: boolean = false;

    constructor(
        private app: PIXI.Application,
        private timelineState: ITimeline,
        private uiEventBus: UIEventBus = UIEventBus.getInstance()
    ) {
        this.eventTranslator = EventTranslator.getInstance();
        this.container = new PIXI.Container();
        this.app.stage.addChild(this.container);
        
        this.initialize();
    }

    /**
     * 初始化管理器
     */
    private initialize(): void {
        this.setupComponent();
        this.setupEventHandlers();
    }

    /**
     * 設置 UI 組件
     */
    private setupComponent(): void {
        this.setupBackground();
        this.setupTopBar();
        this.setupTrackContainer();
        this.setupTimeline();
        this.setupPlayhead();
        this.setupZIndex();
        
        // 初始更新所有組件
        this.update();
    }

    /**
     * 設置背景
     */
    private setupBackground(): void {
        this.background = new PIXI.Graphics();
        this.drawBackground();
        this.container.addChild(this.background);
    }

    /**
     * 繪製背景
     */
    private drawBackground(): void {
        this.background.clear();
        this.background.beginFill(DawUIManager.BACKGROUND_COLOR);
        this.background.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        this.background.endFill();
    }

    /**
     * 設置頂部工具欄
     */
    private setupTopBar(): void {
        this.topBar = new TopBarComponent('top-bar');
        this.topBar.initialize();
        this.container.addChild(this.topBar.getContainer());
    }

    /**
     * 設置軌道容器
     */
    private setupTrackContainer(): void {
        this.trackContainer = new PIXI.Container();
        this.trackContainer.position.set(
            DAWConfig.dimensions.controlsWidth,
            DAWConfig.dimensions.topBarHeight
        );
        this.container.addChild(this.trackContainer);
    }

    /**
     * 設置時間軸
     */
    private setupTimeline(): void {
        this.timeline = new TimelineComponent(this.app, this.timelineState);
        this.timeline.initialize();
        this.timeline.getContainer().position.y = DAWConfig.dimensions.topBarHeight;
        this.container.addChild(this.timeline.getContainer());
    }

    /**
     * 設置播放頭
     */
    private setupPlayhead(): void {
        this.playhead = new PlayheadComponent(
            this.app.screen.height - DAWConfig.dimensions.topBarHeight,
            this.timelineState.gridSize
        );
        this.playhead.initialize();
        this.playhead.getContainer().position.y = DAWConfig.dimensions.topBarHeight;
        this.container.addChild(this.playhead.getContainer());
    }

    /**
     * 設置組件層級
     */
    private setupZIndex(): void {
        this.container.sortableChildren = true;
        this.background.zIndex = 0;
        this.topBar.getContainer().zIndex = 1;
        this.timeline.getContainer().zIndex = 2;
        this.trackContainer.zIndex = 3;
        this.playhead.getContainer().zIndex = 4;
    }

    /**
     * 設置事件處理器
     */
    private setupEventHandlers(): void {
        this.setupTimelineEvents();
        this.setupPlayheadEvents();
        this.setupResizeEvents();
    }

    /**
     * 設置時間軸事件
     */
    private setupTimelineEvents(): void {
        // 點擊事件
        this.uiEventBus.on('ui:timeline:click', (payload) => {
            this.playhead.setTimePosition(payload.time);
        });

        // 縮放事件
        this.uiEventBus.on('ui:timeline:zoom', (payload) => {
            this.handleTimelineZoom(payload.zoomLevel);
        });
    }

    /**
     * 設置播放頭事件
     */
    private setupPlayheadEvents(): void {
        this.uiEventBus.on('ui:timeline:playhead:move', (payload) => {
            this.timelineState.position = payload.position;
        });
    }

    /**
     * 設置視窗大小變化事件
     */
    private setupResizeEvents(): void {
        window.addEventListener('resize', this.handleResize);
    }

    /**
     * 處理時間軸縮放
     */
    private handleTimelineZoom(zoomLevel: number): void {
        this.timelineState.zoom *= (1 + zoomLevel * DawUIManager.ZOOM_FACTOR);
        this.timeline.update();
    }

    /**
     * 處理視窗大小變化
     */
    private handleResize = () => {
        if (this.isResizing) return;
        this.isResizing = true;

        // 更新背景
        this.drawBackground();

        // 更新組件
        this.topBar.update();
        this.timeline.update();
        this.playhead.setHeight(this.app.screen.height - DAWConfig.dimensions.topBarHeight);

        // 使用 requestAnimationFrame 避免過度重繪
        requestAnimationFrame(() => {
            this.isResizing = false;
        });
    }

    /**
     * 更新 UI
     */
    public update(): void {
        this.topBar.update();
        this.timeline.update();
        this.playhead.update();
    }

    /**
     * 銷毀管理器
     */
    public destroy(): void {
        window.removeEventListener('resize', this.handleResize);
        this.topBar.destroy();
        this.timeline.destroy();
        this.playhead.destroy();
        this.container.removeFromParent();
    }

    // 公共方法
    public getTrackContainer(): PIXI.Container {
        return this.trackContainer;
    }

    public setPlayheadPosition(time: number): void {
        this.playhead.setTimePosition(time);
    }

    public getPlayheadPosition(): number {
        return this.playhead.getPosition();
    }
} 