import * as PIXI from "pixi.js";
import { BaseComponent } from "../../../core/BaseComponent";
import { ITimeline } from "../../../../types/daw";
import { UIEventBus } from "../../../../events/UIEventBus";
import { DAWConfig } from "../../../../config/DAWConfig";

// 定義事件類型
type TimelineStateUpdateEvent = {
    gridSize?: number;
    zoom?: number;
};

export class TimelineComponent extends BaseComponent {
    private static readonly DEFAULT_GRID_SIZE = 100;
    private static readonly DEFAULT_ZOOM = 1;
    private static readonly BEAT_LINE_COLOR = 0x2a2a2a;
    private static readonly BAR_LINE_COLOR = 0x3d3d3d;

    private background: PIXI.Graphics;
    private grid: PIXI.Graphics;
    private timeMarkers: PIXI.Container;
    private width: number;
    private gridSize: number;
    private zoom: number;

    constructor(
        private app: PIXI.Application, 
        private state: ITimeline,
        protected uiEventBus: UIEventBus = UIEventBus.getInstance()
    ) {
        super('timeline');
        
        // 初始化屬性
        this.width = app.screen.width;
        this.gridSize = state?.gridSize || TimelineComponent.DEFAULT_GRID_SIZE;
        this.zoom = state?.zoom || TimelineComponent.DEFAULT_ZOOM;
    }

    public initialize(): void {
        this.setupComponent();
        this.setupEventHandlers();
    }

    protected setupComponent(): void {
        this.background = new PIXI.Graphics();
        this.container.addChild(this.background);
        
        this.grid = new PIXI.Graphics();
        this.grid.position.x = DAWConfig.dimensions.controlsWidth;
        this.container.addChild(this.grid);

        this.timeMarkers = new PIXI.Container();
        this.timeMarkers.position.x = DAWConfig.dimensions.controlsWidth;
        this.container.addChild(this.timeMarkers);
        
        this.container.sortableChildren = true;
        this.background.zIndex = 0;
        this.grid.zIndex = 1;
        this.timeMarkers.zIndex = 2;
        
        this.drawBackground();
        this.drawGrid();
    }

    protected setupEventHandlers(): void {
        this.container.eventMode = 'static';
        this.container.on('click', (event: PIXI.FederatedPointerEvent) => {
            const localX = event.global.x - DAWConfig.dimensions.controlsWidth;
            const time = localX / this.gridSize;
            
            this.emitUIEvent('ui:timeline:click', {
                time: Math.max(0, time)
            });
        });

        this.container.on('wheel', (event: WheelEvent) => {
            this.emitUIEvent('ui:timeline:zoom', {
                zoomLevel: event.deltaY > 0 ? 1 : -1
            });
        });

        window.addEventListener('resize', this.handleResize);

        // 監聽時間軸狀態變化
        this.onUIEvent('ui:timeline:state:update', (data: { gridSize?: number; zoom?: number }) => {
            if (data.gridSize !== undefined) {
                this.gridSize = data.gridSize;
            }
            if (data.zoom !== undefined) {
                this.zoom = data.zoom;
            }
            this.update();
        });
    }

    private handleResize = () => {
        if (this.app) {
            this.width = this.app.screen.width;
            this.update();
        }
    }

    private drawBackground(): void {
        this.background.clear();
        this.background
            .fill({ color: 0x2d2d2d })
            .rect(0, 0, this.width, DAWConfig.dimensions.timelineHeight);
    }

    private drawGrid(): void {
        this.grid.clear();

        const gridWidth = this.width - DAWConfig.dimensions.controlsWidth;
        const gridSize = this.gridSize * this.zoom;
        const gridCount = Math.ceil(gridWidth / gridSize);
        const fullHeight = this.app.screen.height - DAWConfig.dimensions.topBarHeight;

        // 畫拍子線（較細、較淺）
        this.grid.setStrokeStyle({
            width: 1,
            color: TimelineComponent.BEAT_LINE_COLOR
        });

        for (let i = 0; i <= gridCount * 4; i++) {
            const x = i * (gridSize / 4); // 每個網格分成4拍
            this.grid.moveTo(x, 0);
            this.grid.lineTo(x, fullHeight);
        }
        this.grid.stroke();

        // 畫小節線（較粗、較深）
        this.grid.setStrokeStyle({
            width: 2,
            color: TimelineComponent.BAR_LINE_COLOR
        });

        for (let i = 0; i <= gridCount; i++) {
            const x = i * gridSize;
            this.grid.moveTo(x, 0);
            this.grid.lineTo(x, fullHeight);
        }
        this.grid.stroke();

        // 畫水平底線
        this.grid.setStrokeStyle({
            width: 2,
            color: TimelineComponent.BAR_LINE_COLOR
        });
        this.grid.moveTo(0, DAWConfig.dimensions.timelineHeight);
        this.grid.lineTo(gridWidth, DAWConfig.dimensions.timelineHeight);
        this.grid.stroke();

        this.drawTimeMarkers(gridSize, gridCount);
    }

    private drawTimeMarkers(gridSize: number, gridCount: number): void {
        while (this.timeMarkers.children.length > 0) {
            const child = this.timeMarkers.children[0];
            this.timeMarkers.removeChild(child);
            child.destroy();
        }

        for (let i = 0; i <= gridCount; i++) {
            const seconds = i * 4;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            
            const text = new PIXI.Text({
                text: `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`,
                style: {
                    fontSize: 12,
                    fill: 0x808080,
                    fontFamily: 'Arial'
                }
            });
            
            text.position.set(i * gridSize - text.width / 2, 2);
            this.timeMarkers.addChild(text);
        }
    }

    public update(): void {
        if (this.app) {
            this.width = this.app.screen.width;
        }
        if (this.state) {
            this.gridSize = this.state.gridSize || this.gridSize;
            this.zoom = this.state.zoom || this.zoom;
        }
        this.drawBackground();
        this.drawGrid();
    }

    public destroy(): void {
        window.removeEventListener('resize', this.handleResize);
        this.container.removeAllListeners();
        super.destroy();
    }
} 