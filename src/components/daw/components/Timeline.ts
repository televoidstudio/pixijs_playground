import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";
import { ITimeline } from "../../../types/daw";
import { TrackControls } from "../track/TrackControls";

export class Timeline extends BaseComponent {
    private background: PIXI.Graphics;
    private timeMarkers: PIXI.Container;
    private playhead: PIXI.Graphics;
    private grid: PIXI.Graphics;
    
    static readonly HEIGHT = 50;
    static readonly MARKER_HEIGHT = 15;
    static readonly BEAT_HEIGHT = 10;
    static readonly PLAYHEAD_WIDTH = 2;
    static readonly TOP_BAR_HEIGHT = 40;
    
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
        // 將網格容器位置設置為與軌道內容區域對齊
        this.grid.position.x = TrackControls.WIDTH;
        this.container.addChild(this.grid);
        
        // 創建播放頭
        this.playhead = new PIXI.Graphics();
        this.playhead.position.x = TrackControls.WIDTH;
        this.container.addChild(this.playhead);
        
        // 調整時間軸位置，考慮頂部控制欄高度
        this.container.position.y = Timeline.TOP_BAR_HEIGHT;
        
        // 初始化視覺元素
        this.drawBackground();
        this.drawGrid();
        this.drawPlayhead();
        this.updateTimeMarkers();
        
        // 設置事件監聽
        this.setupEvents();
    }

    private drawBackground() {
        this.background
            .clear()
            .fill({ color: 0x2a2a2a })
            .rect(0, 0, TrackControls.WIDTH, Timeline.HEIGHT)  // 控制區背景
            .fill({ color: 0x1a1a1a })
            .rect(TrackControls.WIDTH, 0, 
                  this.app.screen.width - TrackControls.WIDTH, 
                  Timeline.HEIGHT);  // 內容區背景
    }

    private drawGrid() {
        const gridSize = this.state.gridSize;
        const width = this.app.screen.width - TrackControls.WIDTH;
        
        this.grid.clear();
        
        // 繪製垂直網格線
        for (let x = 0; x < width; x += gridSize) {
            // 主要拍子線（每4拍）
            if ((x / gridSize) % 4 === 0) {
                this.grid
                    .setStrokeStyle({
                        width: 1,
                        color: 0x4a4a4a
                    })
                    .moveTo(x, 0)
                    .lineTo(x, Timeline.HEIGHT);
                
                // 添加拍子數字
                const beatNumber = new PIXI.Text({
                    text: String((x / gridSize) / 4 + 1),
                    style: {
                        fontSize: 10,
                        fill: 0x808080,
                        fontFamily: 'Arial'
                    }
                });
                beatNumber.position.set(x + 2, 2);
                this.timeMarkers.addChild(beatNumber);
            } 
            // 子拍子線
            else {
                this.grid
                    .setStrokeStyle({
                        width: 1,
                        color: 0x333333
                    })
                    .moveTo(x, Timeline.HEIGHT - Timeline.BEAT_HEIGHT)
                    .lineTo(x, Timeline.HEIGHT);
            }
        }
    }

    private drawPlayhead() {
        this.playhead
            .clear()
            .fill({ color: 0xff3333 })
            .rect(
                this.state.position * this.state.gridSize, 
                0, 
                Timeline.PLAYHEAD_WIDTH, 
                Timeline.HEIGHT
            );
    }

    private updateTimeMarkers() {
        this.timeMarkers.removeChildren();
        this.timeMarkers.position.x = TrackControls.WIDTH;
        
        const gridSize = this.state.gridSize;
        const width = this.app.screen.width - TrackControls.WIDTH;
        const totalBars = Math.ceil(width / (gridSize * 4));
        
        for (let bar = 0; bar < totalBars; bar++) {
            const x = bar * gridSize * 4;
            
            // 添加小節數
            const barNumber = new PIXI.Text({
                text: `${bar + 1}`,
                style: {
                    fontSize: 12,
                    fill: 0xaaaaaa,
                    fontFamily: 'Arial'
                }
            });
            barNumber.position.set(x + 2, 2);
            this.timeMarkers.addChild(barNumber);
            
            // 添加時間標記
            const time = this.calculateTime(bar);
            const timeText = new PIXI.Text({
                text: time,
                style: {
                    fontSize: 10,
                    fill: 0x808080,
                    fontFamily: 'monospace'
                }
            });
            timeText.position.set(x + 2, 20);
            this.timeMarkers.addChild(timeText);
        }
    }

    private calculateTime(bar: number): string {
        const secondsPerBar = (60 / this.state.bpm) * 4;
        const totalSeconds = bar * secondsPerBar;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        const milliseconds = Math.floor((totalSeconds % 1) * 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }

    private setupEvents() {
        this.container.eventMode = 'static';
        this.container.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            const localX = event.getLocalPosition(this.container).x;
            // 確保只在內容區域響應點擊
            if (localX > TrackControls.WIDTH) {
                const newPosition = Math.floor((localX - TrackControls.WIDTH) / this.state.gridSize);
                this.setPosition(newPosition);
            }
        });
    }

    public setPosition(position: number) {
        this.state.position = position;
        this.drawPlayhead();
    }

    public update() {
        this.drawBackground();
        this.drawGrid();
        this.drawPlayhead();
        this.updateTimeMarkers();
    }

    public destroy() {
        this.container.removeAllListeners();
        this.container.destroy({ children: true });
    }
} 