import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";
import { ITimeline } from "../../../types/daw";

export class Timeline extends BaseComponent {
    private cursor: PIXI.Graphics;
    private background: PIXI.Graphics;
    private timeMarkers: PIXI.Container;

    constructor(private app: PIXI.Application, private timelineState: ITimeline) {
        super();
        this.cursor = new PIXI.Graphics();
        this.background = new PIXI.Graphics();
        this.timeMarkers = new PIXI.Container();
        
        // 修改：確保時間軸在正確位置
        this.container.position.set(200, 0); // 改為從頂部開始
        
        this.init();
    }

    private init() {
        this.drawBackground();
        this.drawTimeMarkers();
        this.drawCursor();
        this.setupEvents();
    }

    private drawBackground() {
        this.background.clear();
        this.background
            .fill({ color: 0x2a2a2a })
            .rect(0, 0, this.app.screen.width - 200, 40);
        
        this.container.addChild(this.background);
    }

    private drawTimeMarkers() {
        this.timeMarkers.removeChildren();
        
        const graphics = new PIXI.Graphics();
        
        // 繪製時間刻度
        for (let i = 0; i < this.app.screen.width - 200; i += this.timelineState.gridSize) {
            graphics
                .stroke({ color: 0x444444, width: 1 })
                .moveTo(i, 0)
                .lineTo(i, 10);
            
            // 添加時間標記 - 使用新的 Text 語法
            const seconds = (i / this.timelineState.gridSize) * (60 / this.timelineState.bpm);
            const text = new PIXI.Text({
                text: this.formatTime(seconds),
                style: {
                    fontSize: 10,
                    fill: 0x888888
                }
            });
            text.position.set(i + 2, 15);
            this.timeMarkers.addChild(text);
        }
        
        this.timeMarkers.addChild(graphics);
        this.container.addChild(this.timeMarkers);
    }

    private drawCursor() {
        this.cursor.clear();
        this.cursor
            .stroke({ color: 0xff0000, width: 2 })  // 使用 stroke 而不是 line
            .moveTo(0, 0)
            .lineTo(0, this.app.screen.height);
        
        this.cursor.position.x = this.timelineState.position * this.timelineState.gridSize;
        
        this.container.addChild(this.cursor);
    }

    private setupEvents() {
        // 設置時間軸點擊事件
        this.background.eventMode = 'static';
        this.background.cursor = 'pointer';
        this.background.on('pointerdown', this.onTimelineClick.bind(this));
    }

    private onTimelineClick(event: PIXI.FederatedPointerEvent) {
        const localX = event.getLocalPosition(this.container).x;
        const newPosition = localX / this.timelineState.gridSize;
        this.setPosition(newPosition);
    }

    public setPosition(position: number) {
        this.timelineState.position = position;
        this.cursor.position.x = position * this.timelineState.gridSize;
        
        this.eventManager.emit('daw:playback:position', { position });
    }

    private formatTime(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    public update() {
        // 更新時間軸狀態
        this.drawTimeMarkers();
        this.cursor.position.x = this.timelineState.position * this.timelineState.gridSize;
    }

    public destroy() {
        this.background.removeAllListeners();
        this.container.destroy({ children: true });
    }
} 