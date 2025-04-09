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

        // 設置容器為可互動
        this.container.eventMode = 'static';
        this.container.cursor = 'ew-resize';
        
        // 設置把手為可互動
        this.handle.eventMode = 'static';
        this.handle.cursor = 'ew-resize';
        
        this.setupDragEvents();
        this.draw();
        
        this.container.position.x = Playhead.CONTROL_WIDTH;
        this.container.position.y = 0;
    }

    private setupDragEvents() {
        // 整個容器都可以拖動
        this.container.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            this.isDragging = true;
            this.dragStartX = event.globalX - this.container.position.x;
            this.handle.alpha = 0.7;
            
            window.addEventListener('pointermove', this.handlePointerMove);
            window.addEventListener('pointerup', this.handlePointerUp);
        });

        // 把手也可以拖動
        this.handle.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            this.isDragging = true;
            this.dragStartX = event.globalX - this.container.position.x;
            this.handle.alpha = 0.7;
            
            window.addEventListener('pointermove', this.handlePointerMove);
            window.addEventListener('pointerup', this.handlePointerUp);
        });
    }

    private handlePointerMove = (event: PointerEvent) => {
        if (!this.isDragging) return;

        const newX = event.clientX - this.dragStartX;
        const minX = Playhead.CONTROL_WIDTH;
        const adjustedX = Math.max(minX, newX);
        
        this.setTimePosition((adjustedX - Playhead.CONTROL_WIDTH) / this.gridSize);

        this.eventManager.emit('daw:playhead:move', undefined);
    };

    private handlePointerUp = () => {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.handle.alpha = 1;
        
        window.removeEventListener('pointermove', this.handlePointerMove);
        window.removeEventListener('pointerup', this.handlePointerUp);
    };

    private draw() {
        this.line.clear();
        this.handle.clear();

        // 繪製播放頭線條
        this.line
            .setStrokeStyle({
                width: 2,
                color: 0xff0000,
                alpha: 1
            })
            .moveTo(0, 0)
            .lineTo(0, this.height)
            .stroke();

        // 繪製頂部三角形
        this.handle
            .fill({ color: 0xff0000 })
            .beginPath()
            .moveTo(-Playhead.HANDLE_SIZE, 0)
            .lineTo(Playhead.HANDLE_SIZE, 0)
            .lineTo(0, Playhead.HANDLE_SIZE)
            .closePath();
    }

    public setPosition(x: number, y: number): void {
        this.container.position.set(x, y);
    }

    public setTimePosition(time: number) {
        const safeTime = Math.max(0, time);
        this.currentPosition = safeTime;
        this.container.position.x = Playhead.CONTROL_WIDTH + (safeTime * this.gridSize);
    }

    public getPosition(): number {
        return this.currentPosition;
    }

    public setHeight(height: number) {
        this.height = height;
        this.draw();
    }

    public update() {
        this.draw();
    }

    public destroy() {
        // 移除事件監聽器
        window.removeEventListener('pointermove', this.handlePointerMove);
        window.removeEventListener('pointerup', this.handlePointerUp);
        
        this.container.destroy({ children: true });
    }
} 