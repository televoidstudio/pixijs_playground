import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";
import { IClip } from "../../../types/daw";

/**
 * 音頻片段組件類
 * 負責管理和渲染單個音頻片段的視覺表現
 */
export class Clip extends BaseComponent {
    /** 軌道高度常量 */
    private static readonly TRACK_HEIGHT = 80;

    /** 片段背景圖形 */
    private background: PIXI.Graphics;
    /** 調整大小的把手 */
    private resizeHandle: PIXI.Graphics;
    /** 片段名稱文字 */
    private nameText: PIXI.Text;
    
    /** 拖動狀態標記 */
    private isDragging: boolean = false;
    /** 調整大小狀態標記 */
    private isResizing: boolean = false;
    /** 拖動開始時的 X 座標 */
    private dragStartX: number = 0;
    /** 拖動開始時的原始 X 座標 */
    private originalX: number = 0;
    /** 調整大小時的原始寬度 */
    private originalWidth: number = 0;
    /** 網格大小 */
    private readonly gridSize: number;

    /**
     * 構造函數
     * @param clipData - 片段數據
     * @param gridSize - 網格大小
     */
    constructor(private clipData: IClip, gridSize: number) {
        super();
        this.gridSize = gridSize;
        
        // 初始化圖形元素
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

    /**
     * 初始化片段組件
     * 設置容器、繪製背景、創建調整把手等
     */
    private init() {
        // 創建容器
        this.container = new PIXI.Container();
        
        // 設置初始位置
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
        
        // 按順序添加元素到容器
        this.container.addChild(this.background);
        this.container.addChild(this.resizeHandle);
        this.container.addChild(this.nameText);
        
        // 設置事件監聽
        this.setupEvents();

        // 添加右鍵選單事件
        this.container.eventMode = 'static';
        this.container.on('rightclick', (event: PIXI.FederatedPointerEvent) => {
            event.stopPropagation();
            this.eventManager.emit('daw:clip:contextmenu', {
                clipId: this.clipData.id,
                x: event.global.x,
                y: event.global.y
            });
        });
    }

    /**
     * 繪製片段背景
     * 包括填充顏色和邊框
     */
    private drawBackground() {
        this.background.clear();
        
        // 計算尺寸
        const width = Math.max(this.clipData.duration * this.gridSize, this.gridSize);
        const height = Clip.TRACK_HEIGHT;

        // 繪製填充
        this.background
            .beginFill(this.clipData.color, 0.8)
            .drawRect(0, 0, width, height)
            .endFill();

        // 繪製邊框
        this.background
            .setStrokeStyle({
                width: 1,
                color: 0xffffff,
                alpha: 0.3,
                alignment: 0
            })
            .drawRect(0, 0, width, height);

        // 設置背景可交互
        this.background.eventMode = 'static';
    }

    /**
     * 更新片段名稱文字位置
     */
    private updateTextPosition() {
        this.nameText.position.set(
            5,
            (Clip.TRACK_HEIGHT - this.nameText.height) / 2
        );
    }

    /**
     * 創建調整大小的把手
     */
    private createResizeHandle() {
        this.resizeHandle.clear();
        
        // 繪製把手
        this.resizeHandle
            .beginFill(0xffffff, 0.8)
            .drawRect(-3, 0, 6, Clip.TRACK_HEIGHT)
            .endFill();
        
        // 設置把手位置
        this.resizeHandle.position.x = this.clipData.duration * this.gridSize;
        this.resizeHandle.eventMode = 'static';
        this.resizeHandle.cursor = 'ew-resize';
    }

    /**
     * 設置事件監聽器
     */
    private setupEvents() {
        // 設置拖動事件
        this.background.eventMode = 'static';
        this.background.cursor = 'grab';

        this.background
            .on('pointerdown', this.onDragStart.bind(this))
            .on('globalpointermove', this.onDragMove.bind(this))
            .on('pointerup', this.onDragEnd.bind(this))
            .on('pointerupoutside', this.onDragEnd.bind(this));

        // 設置調整大小事件
        this.resizeHandle
            .on('pointerdown', this.onResizeStart.bind(this))
            .on('globalpointermove', this.onResizeMove.bind(this))
            .on('pointerup', this.onResizeEnd.bind(this))
            .on('pointerupoutside', this.onResizeEnd.bind(this));
    }

    /**
     * 開始拖動處理
     */
    private onDragStart(event: PIXI.FederatedPointerEvent) {
        this.isDragging = true;
        this.dragStartX = event.global.x;
        this.originalX = this.container.x;
        this.container.alpha = 0.7;
        this.background.cursor = 'grabbing';
        this.container.zIndex = 1;
    }

    /**
     * 拖動過程處理
     */
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

    /**
     * 結束拖動處理
     */
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

    /**
     * 開始調整大小處理
     */
    private onResizeStart(event: PIXI.FederatedPointerEvent) {
        this.isResizing = true;
        this.dragStartX = event.global.x;
        this.originalWidth = this.clipData.duration * this.gridSize;
    }

    /**
     * 調整大小過程處理
     */
    private onResizeMove(event: PIXI.FederatedPointerEvent) {
        if (!this.isResizing) return;

        const deltaX = event.global.x - this.dragStartX;
        const newWidth = Math.max(
            this.gridSize,
            this.originalWidth + deltaX
        );
        
        const newDuration = Math.max(1, Math.round(newWidth / this.gridSize));
        
        if (this.clipData.duration !== newDuration) {
            this.clipData.duration = newDuration;
            this.drawBackground();
            this.createResizeHandle();
            
            this.eventManager.emit('daw:clip:resized', { 
                clip: { ...this.clipData }
            });
        }
    }

    /**
     * 結束調整大小處理
     */
    private onResizeEnd() {
        if (!this.isResizing) return;
        
        this.isResizing = false;
        const finalDuration = Math.max(1, Math.round(this.clipData.duration));
        if (this.clipData.duration !== finalDuration) {
            this.clipData.duration = finalDuration;
            this.drawBackground();
            this.createResizeHandle();
        }
    }

    /**
     * 更新片段視覺狀態
     */
    public update() {
        this.drawBackground();
        this.createResizeHandle();
        this.updateTextPosition();
    }

    /**
     * 清理資源
     */
    public destroy() {
        this.container.removeAllListeners();
        this.container.destroy({ children: true });
    }

    /**
     * 獲取片段ID
     */
    public getId(): string {
        return this.clipData.id;
    }

    public getData(): IClip {
        return { ...this.clipData };
    }
} 