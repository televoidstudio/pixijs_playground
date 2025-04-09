import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";
import { DAWConfig } from "../../../config/DAWConfig";
import { TrackList } from "./TrackList";
import { Toolbar } from "../toolbar/Toolbar";
import { TopBar } from "../transport/TopBar";
import { TransportBar } from "../transport/TransportBar";
import { ITimeline } from "../../../types/daw";

export default class TrackArea extends BaseComponent {
    private trackList: TrackList;
    private scrollContainer: PIXI.Container;
    private scrollBar: PIXI.Graphics;
    private grid: PIXI.Graphics;
    private isDragging: boolean = false;
    private dragStart: { y: number } = { y: 0 };
    private scrollPosition: number = 0;
    private maxScroll: number = 0;
    private timelineState: ITimeline;

    constructor(private app: PIXI.Application) {
        super();
        // 初始化時間軸狀態
        this.timelineState = {
            position: 0,
            zoom: 1,
            gridSize: 50,
            isPlaying: false,
            bpm: 60
        };
        this.init();
    }

    private init(): void {
        // 設置容器位置
        this.container.position.y = TopBar.HEIGHT + TransportBar.HEIGHT + DAWConfig.dimensions.timelineHeight;
        this.container.zIndex = 4;

        // 創建背景
        const background = new PIXI.Graphics();
        background
            .fill({ color: 0x1a1a1a })
            .rect(0, 0, this.app.screen.width, this.getVisibleHeight())
            // 添加粗框線
            .setStrokeStyle({
                width: 2,
                color: 0x3a3a3a,
                alpha: 1
            })
            .rect(0, 0, this.app.screen.width, this.getVisibleHeight())
            .stroke();
        this.container.addChild(background);

        // 創建網格
        this.grid = new PIXI.Graphics();
        this.container.addChild(this.grid);

        // 創建滾動容器
        this.scrollContainer = new PIXI.Container();
        this.container.addChild(this.scrollContainer);

        // 創建音軌列表
        this.trackList = new TrackList(this.app);
        this.scrollContainer.addChild(this.trackList.getContainer());

        // 創建滾動條
        this.scrollBar = new PIXI.Graphics();
        this.container.addChild(this.scrollBar);

        // 設置事件
        this.setupEvents();

        // 繪製網格
        this.drawGrid();
    }

    private drawGrid(): void {
        this.grid.clear();
        
        const contentWidth = Math.max(this.app.screen.width * 2, 3000);
        const visibleHeight = this.getVisibleHeight();

        // 繪製垂直網格線
        for (let x = 0; x <= contentWidth - DAWConfig.dimensions.controlsWidth; x += this.timelineState.gridSize) {
            const beatIndex = x / this.timelineState.gridSize;

            // 主要拍子線（每4拍，即小節線）
            if (beatIndex % 4 === 0) {
                this.grid
                    .setStrokeStyle({
                        width: 1,
                        color: 0x666666,
                        alpha: 1
                    })
                    .moveTo(x + DAWConfig.dimensions.controlsWidth, 0)
                    .lineTo(x + DAWConfig.dimensions.controlsWidth, visibleHeight)
                    .stroke();
            } else {
                // 繪製次要拍子線
                this.grid
                    .setStrokeStyle({
                        width: 1,
                        color: 0x444444,
                        alpha: 0.5
                    })
                    .moveTo(x + DAWConfig.dimensions.controlsWidth, 0)
                    .lineTo(x + DAWConfig.dimensions.controlsWidth, visibleHeight)
                    .stroke();
            }
        }
    }

    private getVisibleHeight(): number {
        const totalHeight = this.app.screen.height - TopBar.HEIGHT - TransportBar.HEIGHT - DAWConfig.dimensions.timelineHeight - Toolbar.HEIGHT;
        return totalHeight * 0.7; // 只使用 70% 的空間
    }

    private setupEvents(): void {
        // 設置滾動事件
        this.container.eventMode = 'static';
        this.container.on('wheel', (event: WheelEvent) => {
            this.scrollPosition += event.deltaY;
            this.scrollPosition = Math.max(0, Math.min(this.scrollPosition, this.maxScroll));
            this.updateScrollPosition();
        });

        // 設置滾動條拖動事件
        this.scrollBar.eventMode = 'static';
        this.scrollBar.cursor = 'pointer';
        this.scrollBar.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            this.isDragging = true;
            this.dragStart.y = event.global.y;
        });

        this.app.stage.on('pointermove', (event: PIXI.FederatedPointerEvent) => {
            if (this.isDragging) {
                const deltaY = event.global.y - this.dragStart.y;
                this.scrollPosition += deltaY * (this.maxScroll / this.getVisibleHeight());
                this.scrollPosition = Math.max(0, Math.min(this.scrollPosition, this.maxScroll));
                this.updateScrollPosition();
                this.dragStart.y = event.global.y;
            }
        });

        this.app.stage.on('pointerup', () => {
            this.isDragging = false;
        });
    }

    private updateScrollPosition(): void {
        this.scrollContainer.position.y = -this.scrollPosition;
        this.updateScrollBar();
    }

    private updateScrollBar(): void {
        const visibleHeight = this.getVisibleHeight();
        const scrollBarHeight = Math.max(20, visibleHeight * (visibleHeight / this.trackList.getContainer().height));
        const scrollBarY = (visibleHeight - scrollBarHeight) * (this.scrollPosition / this.maxScroll);

        this.scrollBar
            .clear()
            .fill({ color: 0x3a3a3a })
            .rect(this.app.screen.width - 10, scrollBarY, 10, scrollBarHeight);
    }

    public getTrackList(): TrackList {
        return this.trackList;
    }

    public update(): void {
        this.maxScroll = Math.max(0, this.trackList.getContainer().height - this.getVisibleHeight());
        this.updateScrollBar();
        this.drawGrid();
    }

    public destroy(): void {
        this.trackList.destroy();
        this.container.destroy({ children: true });
    }
} 