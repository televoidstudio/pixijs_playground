import * as PIXI from "pixi.js";
import { BaseComponent } from "../../../core/BaseComponent";
import { ITimeline } from "../../../../types/daw";
import { UIEventBus } from "../../../../events/UIEventBus";
import { DAWConfig } from "../../../../config/DAWConfig";

export class TimelineComponent extends BaseComponent {
    private background: PIXI.Graphics;
    private grid: PIXI.Graphics;
    private timeMarkers: PIXI.Container;

    constructor(
        private app: PIXI.Application, 
        private state: ITimeline,
        protected uiEventBus: UIEventBus = UIEventBus.getInstance()
    ) {
        super('timeline');
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
        this.timeMarkers.zIndex = 1;
        
        this.drawBackground();
        this.drawGrid();
    }

    protected setupEventHandlers(): void {
        this.container.eventMode = 'static';
        this.container.on('click', (event: PIXI.FederatedPointerEvent) => {
            const localX = event.global.x - DAWConfig.dimensions.controlsWidth;
            const time = localX / this.state.gridSize;
            
            this.uiEventBus.emit('ui:timeline:click', {
                time: Math.max(0, time)
            });
        });

        this.container.on('wheel', (event: WheelEvent) => {
            this.uiEventBus.emit('ui:timeline:zoom', {
                zoomLevel: event.deltaY > 0 ? 1 : -1
            });
        });
    }

    private drawBackground() {
        // ... 保持原有的繪製邏輯
    }

    private drawGrid() {
        // ... 保持原有的繪製邏輯
    }

    public update(): void {
        this.drawBackground();
        this.drawGrid();
    }

    public destroy(): void {
        this.container.removeAllListeners();
        super.destroy();
    }
} 