import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";
import { ITimeline } from "../../../types/daw";
import { DAWConfig } from "../../../config/DAWConfig";

export class Timeline extends BaseComponent {
    private background: PIXI.Graphics;
    private grid: PIXI.Graphics;
    private timeMarkers: PIXI.Container;

    constructor(private app: PIXI.Application, private state: ITimeline) {
        super();
        this.init();
    }

    private init() {
        // 創建容器層級
        this.timeMarkers = new PIXI.Container();
        this.container.addChild(this.timeMarkers);

        // 創建背景
        this.background = new PIXI.Graphics();
        this.container.addChild(this.background);
        
        // 創建網格
        this.grid = new PIXI.Graphics();
        this.grid.position.x = DAWConfig.dimensions.controlsWidth;
        this.container.addChild(this.grid);
        
        this.drawBackground();
        this.drawGrid();
        this.updateTimeMarkers();
        
        this.setupEvents();
    }

    // ... 其他方法保持不變
} 