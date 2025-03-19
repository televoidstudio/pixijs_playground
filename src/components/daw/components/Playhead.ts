import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";

export class Playhead extends BaseComponent {
    private line: PIXI.Graphics;
    private handle: PIXI.Graphics;
    private currentPosition: number = 0;
    private height: number;
    private gridSize: number;
    private isDragging: boolean = false;
    private dragStartX: number = 0;
    private static readonly CONTROL_WIDTH = 200; // 與 Track 控制區域寬度相同
    private static readonly HANDLE_SIZE = 10; // 三角形大小

    constructor(height: number, gridSize: number = 25) {
        super();
        this.height = height;
        this.gridSize = gridSize;
        this.init();
    }

    private init() {
        // 創建線條
        this.line = new PIXI.Graphics();
        this.container.addChild(this.line);

        // 創建可拖拉的三角形控制器
        this.handle = new PIXI.Graphics();
        this.container.addChild(this.handle);

        // 設置拖拉事件
        this.handle.eventMode = 'static';
        this.handle.cursor = 'pointer';
        this.setupDragEvents();

        this.draw();
        
        // 設置初始位置為控制區域右側
        this.container.position.x = Playhead.CONTROL_WIDTH;
    }

    private setupDragEvents() {
        this.handle
            .on('pointerdown', this.onDragStart.bind(this))
            .on('pointerup', this.onDragEnd.bind(this))
            .on('pointerupoutside', this.onDragEnd.bind(this))
            .on('pointermove', this.onDragMove.bind(this));
    }

    private onDragStart(event: PIXI.FederatedPointerEvent) {
        this.isDragging = true;
        this.dragStartX = event.globalX - this.container.position.x;
        this.handle.alpha = 0.7; // 視覺反饋
    }

    private onDragMove(event: PIXI.FederatedPointerEvent) {
        if (!this.isDragging) return;

        const newX = event.globalX - this.dragStartX;
        const snappedX = Math.round((newX - Playhead.CONTROL_WIDTH) / this.gridSize) * this.gridSize + Playhead.CONTROL_WIDTH;
        this.setPosition((snappedX - Playhead.CONTROL_WIDTH) / this.gridSize);

        // 發送位置更新事件
        this.eventManager.emit('playhead:move', {
            time: this.getPosition()
        });
    }

    private onDragEnd() {
        this.isDragging = false;
        this.handle.alpha = 1;
    }

    private draw() {
        this.line.clear();
        
        // 使用新的 API 設置線條樣式
        this.line.setStrokeStyle({
            width: 2,
            color: 0xff0000,
            alpha: 0.8
        });

        // 繪製播放頭線條
        this.line
            .moveTo(0, 0)
            .lineTo(0, this.height)
            .stroke();

        // 繪製三角形控制器
        this.handle.clear();
        this.handle
            .fill({ color: 0xff0000 })
            .beginPath()
            .moveTo(-Playhead.HANDLE_SIZE, 0)
            .lineTo(Playhead.HANDLE_SIZE, 0)
            .lineTo(0, Playhead.HANDLE_SIZE)
            .closePath();

        // 添加互動區域（稍微大一點方便點擊）
        this.handle
            .fill({ color: 0xff0000, alpha: 0 })
            .rect(
                -Playhead.HANDLE_SIZE - 5,
                -5,
                Playhead.HANDLE_SIZE * 2 + 10,
                Playhead.HANDLE_SIZE + 10
            );
    }

    public setPosition(time: number) {
        // 將時間轉換為像素位置，加上控制區域寬度
        this.currentPosition = (time * this.gridSize) + Playhead.CONTROL_WIDTH;
        this.container.position.x = this.currentPosition;
    }

    public getPosition(): number {
        // 返回不包含控制區域寬度的位置
        return (this.currentPosition - Playhead.CONTROL_WIDTH) / this.gridSize;
    }

    public setHeight(height: number) {
        this.height = height;
        this.draw();
    }

    public update() {
        // 實現 BaseComponent 的抽象方法
    }

    public destroy() {
        this.handle.removeAllListeners();
        this.line.destroy();
        this.handle.destroy();
        this.container.destroy({ children: true });
    }
} 