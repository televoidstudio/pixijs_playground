import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";
import { ITimeline } from "../../../types/daw";
import { DAWConfig } from "../../../config/DAWConfig";
import { TopBar } from "../transport/TopBar";

export class Timeline extends BaseComponent {
    private background: PIXI.Graphics;
    private timeMarkers: PIXI.Container;
    private zoom: number = 1;
    private scrollX: number = 0;
    private scrollY: number = 0;
    private isDragging: boolean = false;
    private dragStart: { x: number; y: number } = { x: 0, y: 0 };

    constructor(private app: PIXI.Application, private state: ITimeline) {
        super();
        this.init();
    }

    private init(): void {
        // 創建背景
        this.background = new PIXI.Graphics();
        this.background
            .fill({ color: 0x1a1a1a })
            .rect(0, 0, this.app.screen.width, this.app.screen.height);
        this.container.addChild(this.background);

        // 創建時間標記容器（放在最上層）
        this.timeMarkers = new PIXI.Container();
        this.timeMarkers.position.x = DAWConfig.dimensions.controlsWidth;
        this.timeMarkers.visible = true;
        this.container.addChild(this.timeMarkers);
        
        // 設置容器屬性
        this.container.sortableChildren = true;
        this.timeMarkers.zIndex = 1;
        this.container.zIndex = 1;
        
        // 確保所有容器都是可見和可互動的
        this.container.visible = true;
        this.container.alpha = 1;
        this.container.eventMode = 'static';
        this.timeMarkers.eventMode = 'static';
        
        // 設置容器的遮罩，確保文字不會超出時間軸區域
        const mask = new PIXI.Graphics()
            .fill({ color: 0xffffff })
            .rect(0, 0, this.app.screen.width, DAWConfig.dimensions.timelineHeight);
        this.timeMarkers.mask = mask;
        this.timeMarkers.addChild(mask);
        
        this.drawBackground();
        this.drawTimeMarkers();
        
        this.setupEvents();
    }

    private drawBackground(): void {
        const timelineHeight = DAWConfig.dimensions.timelineHeight;
        
        this.background
            .clear()
            // 控制區域背景
            .fill({ color: 0x1a1a1a })
            .rect(0, 0, DAWConfig.dimensions.controlsWidth, timelineHeight)
            // 時間軸區域背景
            .fill({ color: 0x2a2a2a })
            .rect(DAWConfig.dimensions.controlsWidth, 0, 
                  this.app.screen.width - DAWConfig.dimensions.controlsWidth, 
                  timelineHeight);
    }

    private drawTimeMarkers(): void {
        this.timeMarkers.removeChildren();
        
        const contentWidth = Math.max(this.app.screen.width * 2, 3000);
        const startX = 0;
        
        // 繪製時間標記
        for (let x = startX; x <= contentWidth - DAWConfig.dimensions.controlsWidth; x += this.state.gridSize) {
            const beatIndex = x / this.state.gridSize;
            const measureNumber = Math.floor(beatIndex / 4) + 1;

            // 只在每小節的開始添加標記
            if (beatIndex % 4 === 0) {
                // 添加小節數字
                const measureText = new PIXI.Text({
                    text: `${measureNumber}`,
                    style: {
                        fontSize: 12,
                        fill: 0xffffff,
                        fontFamily: 'Arial'
                    }
                });
                measureText.position.set(x + 5, 5);
                this.timeMarkers.addChild(measureText);
            }
        }
    }

    private setupEvents(): void {
        // 設置事件處理
    }

    public update(): void {
        this.drawBackground();
        this.drawTimeMarkers();
    }

    public destroy(): void {
        this.container.destroy({ children: true });
    }
} 