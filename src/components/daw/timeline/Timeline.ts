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
        // 創建背景
        this.background = new PIXI.Graphics();
        this.container.addChild(this.background);
        
        // 創建網格（放在底層）
        this.grid = new PIXI.Graphics();
        this.grid.position.x = DAWConfig.dimensions.controlsWidth;
        this.container.addChild(this.grid);

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
        this.drawGrid();
        
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

    private drawGrid(): void {
        this.grid.clear();
        this.timeMarkers.removeChildren();
        
        const contentWidth = Math.max(this.app.screen.width * 2, 3000);
        const startX = 0;
        const timelineHeight = DAWConfig.dimensions.timelineHeight;
        const screenHeight = this.app.screen.height;

        // 先繪製背景以確保文字可見
        this.grid
            .fill({ color: 0x2a2a2a })
            .rect(0, 0, contentWidth, timelineHeight);
        
        // 繪製垂直網格線
        for (let x = startX; x <= contentWidth - DAWConfig.dimensions.controlsWidth; x += this.state.gridSize) {
            const beatIndex = x / this.state.gridSize;
            const measureNumber = Math.floor(beatIndex / 4) + 1;
            const beatInMeasure = (beatIndex % 4) + 1;

            // 主要拍子線（每4拍，即小節線）
            if (beatIndex % 4 === 0) {
                // 繪製小節線（使用較亮的顏色）
                this.grid
                    .setStrokeStyle({
                        width: 1,
                        color: 0x666666,
                        alpha: 1
                    })
                    .moveTo(x, 0)
                    .lineTo(x, screenHeight)
                    .stroke();

                // 添加小節數
                const measureText = new PIXI.Text({
                    text: measureNumber.toString(),
                    style: {
                        fontSize: 16,
                        fill: 0xffffff,
                        fontFamily: 'Arial',
                        fontWeight: 'bold'
                    }
                });
                
                // 創建背景矩形
                const padding = 4;
                const background = new PIXI.Graphics()
                    .fill({ color: 0x333333 })
                    .roundRect(
                        -measureText.width/2 - padding,
                        0,
                        measureText.width + padding * 2,
                        measureText.height + padding * 2,
                        4
                    );
                
                // 創建容器來組合背景和文字
                const measureContainer = new PIXI.Container();
                measureContainer.addChild(background);
                measureContainer.addChild(measureText);
                
                measureText.anchor.set(0.5, 0);
                measureText.position.set(0, padding);
                measureContainer.position.set(x, 2);
                this.timeMarkers.addChild(measureContainer);
            }

            // 添加拍子數（每一拍都添加，但不是小節開始的拍子）
            if (beatIndex % 4 !== 0) {
                const beatText = new PIXI.Text({
                    text: beatInMeasure.toString(),
                    style: {
                        fontSize: 12,
                        fill: 0x888888,
                        fontFamily: 'Arial'
                    }
                });
                
                beatText.anchor.set(0.5, 0);
                beatText.position.set(x, 24);
                this.timeMarkers.addChild(beatText);
            }

            // 繪製拍子線
            this.grid
                .setStrokeStyle({
                    width: 1,
                    color: 0x444444,
                    alpha: 0.6
                })
                .moveTo(x, timelineHeight)
                .lineTo(x, screenHeight)
                .stroke();
        }

        // 添加水平分隔線
        this.grid
            .setStrokeStyle({
                width: 1,
                color: 0x444444,
                alpha: 0.8
            })
            .moveTo(0, timelineHeight)
            .lineTo(contentWidth, timelineHeight)
            .stroke();

        // 確保文字容器在最上層
        this.timeMarkers.zIndex = 1;
        this.container.sortChildren();
    }

    private updateTimeMarkers(): void {
        this.timeMarkers.removeChildren();
        // 時間標記會在 drawGrid 中添加
    }

    private setupEvents(): void {
        // 事件設置邏輯
    }

    public update(): void {
        this.drawBackground();
        this.drawGrid();
        this.updateTimeMarkers();
    }

    public destroy(): void {
        this.container.destroy({ children: true });
    }

    // ... 其他方法保持不變
} 