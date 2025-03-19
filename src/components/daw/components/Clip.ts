import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";
import { IClip } from "../../../types/daw";

export class Clip extends BaseComponent {
    private static readonly TRACK_HEIGHT = 80;
    private background: PIXI.Graphics;
    private resizeHandle: PIXI.Graphics;
    private nameText: PIXI.Text;
    private isDragging: boolean = false;
    private isResizing: boolean = false;
    private dragStartX: number = 0;
    private originalX: number = 0;
    private originalWidth: number = 0;
    private readonly gridSize: number;

    constructor(private clipData: IClip, gridSize: number) {
        super();
        this.gridSize = gridSize;
        
        // 初始化所有圖形元素
        this.background = new PIXI.Graphics();
        this.resizeHandle = new PIXI.Graphics();
        this.nameText = new PIXI.Text({
            text: this.clipData.name,
            style: {
                fontSize: 12,
                fill: 0xffffff,
                fontFamily: 'Arial',
                fontWeight: 'bold'
            }
        });

        this.init();
    }

    private init() {
        // 先創建圖形容器
        this.container = new PIXI.Container();
        
        // 設置容器初始位置
        this.container.position.set(
            this.clipData.startTime * this.gridSize,
            0
        );

        // 繪製背景
        this.drawBackground();
        
        // 創建調整大小的把手
        this.createResizeHandle();
        
        // 更新文字位置
        this.updateTextPosition();
        
        // 添加到容器，注意順序
        this.container.addChild(this.background);
        this.container.addChild(this.resizeHandle);
        this.container.addChild(this.nameText);
        
        // 設置事件
        this.setupEvents();
    }

    private drawBackground() {
        // 確保清除之前的繪製
        this.background.clear();
        
        // 計算尺寸
        const width = Math.max(this.clipData.duration * this.gridSize, this.gridSize);
        const height = Clip.TRACK_HEIGHT;

        // 先繪製填充
        this.background
            .beginFill(this.clipData.color, 0.8)
            .drawRect(0, 0, width, height)
            .endFill();

        // 再繪製邊框
        this.background
            .setStrokeStyle({
                width: 1,
                color: 0xffffff,
                alpha: 0.3,
                alignment: 0 // 設置邊框對齊方式
            })
            .drawRect(0, 0, width, height);

        // 確保背景可以接收事件
        this.background.eventMode = 'static';
    }

    private updateTextPosition() {
        // 確保文字在片段中間
        this.nameText.position.set(
            5,
            (Clip.TRACK_HEIGHT - this.nameText.height) / 2
        );
    }

    private createResizeHandle() {
        this.resizeHandle.clear();
        
        // 繪製調整大小的把手
        this.resizeHandle
            .beginFill(0xffffff, 0.8)
            .drawRect(-3, 0, 6, Clip.TRACK_HEIGHT)
            .endFill();
        
        // 設置把手位置在片段右側
        this.resizeHandle.position.x = this.clipData.duration * this.gridSize;
        this.resizeHandle.eventMode = 'static';
        this.resizeHandle.cursor = 'ew-resize';
    }

    private setupEvents() {
        // 設置拖動事件
        this.background.eventMode = 'static';
        this.background.cursor = 'grab';

        this.background
            .on('pointerdown', this.onDragStart.bind(this))
            .on('globalpointermove', this.onDragMove.bind(this))
            .on('pointerup', this.onDragEnd.bind(this))
            .on('pointerupoutside', this.onDragEnd.bind(this));

        // 設置大小調整事件
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
        this.container.zIndex = 1;
    }

    private onDragMove(event: PIXI.FederatedPointerEvent) {
        if (!this.isDragging) return;

        const deltaX = event.global.x - this.dragStartX;
        const newX = Math.max(0, this.originalX + deltaX);
        const snappedX = Math.round(newX / this.gridSize) * this.gridSize;
        
        this.container.x = snappedX;
        this.clipData.startTime = Math.floor(snappedX / this.gridSize);
        
        this.eventManager.emit('daw:clip:moved', { 
            clip: { ...this.clipData }
        });
    }

    private onDragEnd() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.container.alpha = 1;
        this.background.cursor = 'grab';
        this.container.zIndex = 0;
        
        const finalX = Math.round(this.container.x / this.gridSize) * this.gridSize;
        this.container.x = finalX;
        this.clipData.startTime = Math.floor(finalX / this.gridSize);
        
        this.eventManager.emit('daw:clip:moved', { 
            clip: { ...this.clipData }
        });
    }

    private onResizeStart(event: PIXI.FederatedPointerEvent) {
        this.isResizing = true;
        this.dragStartX = event.global.x;
        // 保存原始寬度
        this.originalWidth = this.clipData.duration * this.gridSize;
    }

    private onResizeMove(event: PIXI.FederatedPointerEvent) {
        if (!this.isResizing) return;

        // 計算滑鼠移動的距離
        const deltaX = event.global.x - this.dragStartX;
        
        // 基於原始寬度計算新的寬度，並確保最小值
        const newWidth = Math.max(
            this.gridSize,  // 最小寬度為一個網格
            this.originalWidth + deltaX
        );
        
        // 將寬度轉換為網格單位，並四捨五入到最近的網格
        const newDuration = Math.max(1, Math.round(newWidth / this.gridSize));
        
        // 更新片段數據
        if (this.clipData.duration !== newDuration) {
            this.clipData.duration = newDuration;
            this.drawBackground();
            this.createResizeHandle();
            
            // 發送調整大小事件
            this.eventManager.emit('daw:clip:resized', { 
                clip: { ...this.clipData }
            });
        }
    }

    private onResizeEnd() {
        if (!this.isResizing) return;
        
        this.isResizing = false;
        // 最後一次確保對齊網格
        const finalDuration = Math.max(1, Math.round(this.clipData.duration));
        if (this.clipData.duration !== finalDuration) {
            this.clipData.duration = finalDuration;
            this.drawBackground();
            this.createResizeHandle();
        }
    }

    public update() {
        this.drawBackground();
        this.createResizeHandle();
        this.updateTextPosition();
    }

    public destroy() {
        this.container.removeAllListeners();
        this.container.destroy({ children: true });
    }
} 