import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";
import { IClip } from "../../../types/daw";

export class Clip extends BaseComponent {
    private background: PIXI.Graphics;
    private isDragging: boolean = false;
    private isResizing: boolean = false;
    private dragStartX: number = 0;
    private originalX: number = 0;
    private resizeHandle: PIXI.Graphics;
    private clipText: PIXI.Text;
    private readonly gridSize: number = 50;  // 添加為類屬性

    constructor(private clipData: IClip, gridSize: number) {
        super();
        console.log(`Creating clip ${clipData.id} with gridSize ${gridSize}`);
        
        this.gridSize = gridSize;
        this.container = new PIXI.Container();
        this.background = new PIXI.Graphics();
        
        // 確保初始位置在可視範圍內
        const initialX = this.clipData.startTime * 20;  // 改用較小的乘數
        this.container.position.set(initialX, 5);  // y 位置設小一點
        
        this.clipText = new PIXI.Text({
            text: this.clipData.name,
            style: {
                fontSize: 12,  // 字體小一點
                fill: 0xFFFFFF,
                fontWeight: 'bold',
            }
        });
        
        this.container.addChild(this.background);
        this.container.addChild(this.clipText);
        
        this.resizeHandle = new PIXI.Graphics();
        this.init();
    }

    private init() {
        console.log("Initializing clip:", this.clipData);
        
        this.drawClip();
        this.createResizeHandle();
        this.setupEvents();
    }

    private drawClip() {
        const clipHeight = 40;  // 減小高度
        const clipWidth = this.clipData.duration * 20;  // 改用較小的乘數

        this.background.clear();
        
        // 增加顏色飽和度和對比度
        this.background
            .fill({ color: this.clipData.color || 0x4CAF50, alpha: 1 })
            .rect(0, 0, clipWidth, clipHeight);
        
        // 加粗邊框
        this.background.lineStyle(2, 0xFFFFFF, 1);
        this.background.rect(0, 0, clipWidth, clipHeight);
        
        // 頂部漸層
        this.background
            .fill({ color: 0xFFFFFF, alpha: 0.2 })
            .rect(0, 0, clipWidth, 10);

        // 調整文字位置
        this.clipText.position.set(5, clipHeight / 2 - this.clipText.height / 2);
        
        console.log("Clip drawn:", {
            x: this.container.x,
            y: this.container.y,
            width: clipWidth,
            height: clipHeight
        });
    }

    private createResizeHandle() {
        this.resizeHandle.clear();
        
        // 調整調整手柄的大小
        this.resizeHandle
            .fill({ color: 0xffffff, alpha: 0.8 })
            .rect(-3, 0, 6, 40);  // 配合新的高度
        
        this.resizeHandle.position.x = this.clipData.duration * 20;  // 使用相同的乘數
        this.resizeHandle.eventMode = 'static';
        this.resizeHandle.cursor = 'ew-resize';

        this.container.addChild(this.resizeHandle);
    }

    private setupEvents() {
        // 設置片段拖動
        this.background.eventMode = 'static';
        this.background.cursor = 'grab';  // 改為抓取游標
        
        this.background
            .on('pointerdown', this.onDragStart.bind(this))
            .on('globalpointermove', this.onDragMove.bind(this))
            .on('pointerup', this.onDragEnd.bind(this))
            .on('pointerupoutside', this.onDragEnd.bind(this))
            .on('pointerover', () => {
                // 懸停效果
                this.container.alpha = 0.9;
            })
            .on('pointerout', () => {
                if (!this.isDragging) {
                    this.container.alpha = 1;
                }
            });

        // 設置大小調整
        this.resizeHandle
            .on('pointerdown', this.onResizeStart.bind(this))
            .on('globalpointermove', this.onResizeMove.bind(this))
            .on('pointerup', this.onResizeEnd.bind(this))
            .on('pointerupoutside', this.onResizeEnd.bind(this));
    }

    private onDragStart(event: PIXI.FederatedPointerEvent) {
        this.isDragging = true;
        this.dragStartX = event.global.x;
        this.originalX = this.container.x;
        this.container.alpha = 0.7;
        this.background.cursor = 'grabbing';
        this.container.zIndex = 1000;
        
        console.log("Drag start:", {
            dragStartX: this.dragStartX,
            originalX: this.originalX,
            gridSize: this.gridSize
        });
    }

    private onDragMove(event: PIXI.FederatedPointerEvent) {
        if (!this.isDragging) return;

        const deltaX = event.global.x - this.dragStartX;
        const newX = Math.max(0, this.originalX + deltaX);
        
        const GRID_SIZE = 20;  // 使用與其他地方相同的網格大小
        const snappedX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
        this.container.x = snappedX;
        
        this.clipData.startTime = Math.floor(snappedX / GRID_SIZE);
        
        console.log("Dragging clip:", {
            deltaX,
            newX,
            snappedX,
            startTime: this.clipData.startTime,
            x: this.container.x,
            gridSize: GRID_SIZE
        });
        
        this.eventManager.emit('daw:clip:moved', { clip: this.clipData });
    }

    private onDragEnd() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.container.alpha = 1;
        this.background.cursor = 'grab';
        this.container.zIndex = 0;
        
        const GRID_SIZE = 20;  // 使用與其他地方相同的網格大小
        const finalX = Math.round(this.container.x / GRID_SIZE) * GRID_SIZE;
        this.container.x = finalX;
        this.clipData.startTime = Math.floor(finalX / GRID_SIZE);
        
        console.log("Drag end:", {
            finalX,
            startTime: this.clipData.startTime,
            gridSize: GRID_SIZE,
            x: this.container.x
        });
    }

    private onResizeStart(event: PIXI.FederatedPointerEvent) {
        this.isResizing = true;
        this.dragStartX = event.global.x;
    }

    private onResizeMove(event: PIXI.FederatedPointerEvent) {
        if (!this.isResizing) return;

        const deltaX = event.global.x - this.dragStartX;
        const newWidth = Math.max(
            this.gridSize,
            this.clipData.duration * this.gridSize + deltaX
        );
        
        this.clipData.duration = Math.round(newWidth / this.gridSize);
        
        this.drawClip();
        this.createResizeHandle();
        
        console.log("Resizing clip:", {
            duration: this.clipData.duration,
            width: newWidth
        });
        
        this.eventManager.emit('daw:clip:resized', { clip: this.clipData });
    }

    private onResizeEnd() {
        this.isResizing = false;
    }

    public update() {
        this.drawClip();
    }

    public destroy() {
        this.container.removeAllListeners();
        this.container.destroy({ children: true });
    }

    public getContainer(): PIXI.Container {
        if (!this.container) {
            throw new Error("Container is not initialized");
        }
        return this.container;
    }
} 