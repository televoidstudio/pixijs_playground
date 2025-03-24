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
        this.line = new PIXI.Graphics();
        this.handle = new PIXI.Graphics();
        
        this.container.addChild(this.line);
        this.container.addChild(this.handle);

        this.container.eventMode = 'static';
        this.handle.eventMode = 'static';
        this.handle.cursor = 'ew-resize';
        
        this.handle.interactive = true;
        
        this.setupDragEvents();
        this.draw();
        
        this.container.position.x = Playhead.CONTROL_WIDTH;
        this.container.position.y = 0;
    }

    private setupDragEvents() {
        const handlePointerDown = (event: PIXI.FederatedPointerEvent) => {
            this.isDragging = true;
            this.dragStartX = event.globalX - this.container.position.x;
            this.handle.alpha = 0.7;
            
            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp);
        };

        const handlePointerMove = (event: PointerEvent) => {
            if (!this.isDragging) return;

            const newX = event.clientX - this.dragStartX;
            const minX = Playhead.CONTROL_WIDTH;
            const snappedX = Math.max(
                minX,
                Math.round((newX - Playhead.CONTROL_WIDTH) / this.gridSize) * this.gridSize + Playhead.CONTROL_WIDTH
            );
            
            this.setTimePosition((snappedX - Playhead.CONTROL_WIDTH) / this.gridSize, undefined);

            this.eventManager.emit('daw:playhead:move', undefined);
        };

        const handlePointerUp = () => {
            if (!this.isDragging) return;
            
            this.isDragging = false;
            this.handle.alpha = 1;
            
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };

        this.handle.on('pointerdown', handlePointerDown);
    }

    private draw() {
        this.line.clear();
        this.handle.clear();

        // 繪製播放頭線條，往上延伸 10 像素
        this.line
            .setStrokeStyle({
                width: 2,
                color: 0xff0000,
                alpha: 0.6
            })
            .moveTo(0, -10)  // 從上方開始畫
            .lineTo(0, this.height + 10)  // 延伸到底部以下
            .stroke();

        // 繪製更大的頂部倒三角形
        this.handle
            .fill({ color: 0xff0000, alpha: 0.8 })  // 提高透明度
            .beginPath()
            .moveTo(-12, -8)      // 左頂點
            .lineTo(12, -8)       // 右頂點
            .lineTo(0, 4)       // 底部頂點
            .closePath();

        // 增加更大的可點擊區域
        this.handle
            .fill({ color: 0xff0000, alpha: 0 })
            .rect(
                -16,
                -12,
                32,
                24
            );

        // 將把手移到頂部
        this.handle.position.y = 0;
    }

    public setPosition(x: number, y: number): void {
        super.setPosition(x, y);
    }

    public setTimePosition(time: number, _?: undefined) {
        const safeTime = Math.max(0, time);
        this.currentPosition = (safeTime * this.gridSize) + Playhead.CONTROL_WIDTH;
        this.container.position.x = this.currentPosition;
        
        this.eventManager.emit('daw:playhead:move', undefined);
    }

    public getPosition(): number {
        return Math.max(0, (this.currentPosition - Playhead.CONTROL_WIDTH) / this.gridSize);
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