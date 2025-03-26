import * as PIXI from "pixi.js";
import { BaseComponent } from "../../../core/BaseComponent";
import { IClip } from "../../../../types/daw";
import { defaultDAWConfig } from "../../../../config/dawConfig";
import { FederatedPointerEvent } from "pixi.js";

/**
 * 音頻片段組件
 * 負責管理和渲染單個音頻片段的視覺表現
 */
export class ClipComponent extends BaseComponent {
    private clipData: IClip;
    private background: PIXI.Graphics;
    private resizeHandle: PIXI.Graphics;
    private nameText: PIXI.Text;
    private isDragging: boolean = false;
    private isResizing: boolean = false;
    private dragStartX: number = 0;
    private originalX: number = 0;
    private originalWidth: number = 0;
    private readonly gridSize: number;

    constructor(id: string, clipData: IClip, gridSize: number) {
        super(id);
        this.clipData = clipData;
        this.gridSize = gridSize;
    }

    protected setupComponent(): void {
        // 創建視覺元素
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

        // 設置初始位置
        this.container.position.set(
            this.clipData.startTime * this.gridSize,
            0
        );

        // 繪製視覺元素
        this.drawBackground();
        this.createResizeHandle();
        this.updateTextPosition();

        // 添加元素到容器
        this.container.addChild(this.background);
        this.container.addChild(this.resizeHandle);
        this.container.addChild(this.nameText);
    }

    protected setupEventHandlers(): void {
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

        // 添加右鍵選單事件
        this.container.eventMode = 'static';
        this.container.on('rightclick', (event: FederatedPointerEvent) => {
            event.stopPropagation();
            this.emitUIEvent('ui:clip:contextmenu', {
                clipId: this.clipData.id,
                x: event.global.x,
                y: event.global.y
            });
        });
    }

    private drawBackground(): void {
        this.background.clear();
        
        const width = Math.max(this.clipData.duration * this.gridSize, this.gridSize);
        const height = defaultDAWConfig.dimensions.trackHeight;

        this.background
            .beginFill(this.clipData.color, 0.8)
            .drawRect(0, 0, width, height)
            .endFill();

        this.background
            .setStrokeStyle({
                width: 1,
                color: 0xffffff,
                alpha: 0.3,
                alignment: 0
            })
            .drawRect(0, 0, width, height);

        this.background.eventMode = 'static';
    }

    private updateTextPosition(): void {
        this.nameText.position.set(
            5,
            (defaultDAWConfig.dimensions.trackHeight - this.nameText.height) / 2
        );
    }

    private createResizeHandle(): void {
        this.resizeHandle.clear();
        
        this.resizeHandle
            .beginFill(0xffffff, 0.8)
            .drawRect(-3, 0, 6, defaultDAWConfig.dimensions.trackHeight)
            .endFill();
        
        this.resizeHandle.position.x = this.clipData.duration * this.gridSize;
        this.resizeHandle.eventMode = 'static';
        this.resizeHandle.cursor = 'ew-resize';
    }

    private onDragStart(event: FederatedPointerEvent): void {
        this.isDragging = true;
        this.dragStartX = event.global.x;
        this.originalX = this.container.x;
        this.container.alpha = 0.7;
        this.background.cursor = 'grabbing';
        this.container.zIndex = 1;

        this.emitUIEvent('ui:clip:dragstart', {
            clipId: this.clipData.id,
            x: event.global.x
        });
    }

    private onDragMove(event: FederatedPointerEvent): void {
        if (!this.isDragging) return;

        const deltaX = event.global.x - this.dragStartX;
        const newX = Math.max(0, this.originalX + deltaX);
        const snappedX = Math.round(newX / this.gridSize) * this.gridSize;
        
        this.container.x = snappedX;
        this.clipData.startTime = Math.floor(snappedX / this.gridSize);
        
        this.emitUIEvent('ui:clip:drag', {
            clipId: this.clipData.id,
            x: event.global.x
        });
    }

    private onDragEnd(): void {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.container.alpha = 1;
        this.background.cursor = 'grab';
        this.container.zIndex = 0;
        
        const finalX = Math.round(this.container.x / this.gridSize) * this.gridSize;
        this.container.x = finalX;
        this.clipData.startTime = Math.floor(finalX / this.gridSize);
        
        this.emitUIEvent('ui:clip:dragend', {
            clipId: this.clipData.id,
            x: this.container.x
        });
    }

    private onResizeStart(event: FederatedPointerEvent): void {
        this.isResizing = true;
        this.dragStartX = event.global.x;
        this.originalWidth = this.clipData.duration * this.gridSize;
    }

    private onResizeMove(event: FederatedPointerEvent): void {
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
            
            this.emitUIEvent('ui:clip:resize', {
                clipId: this.clipData.id,
                width: newWidth
            });
        }
    }

    private onResizeEnd(): void {
        if (!this.isResizing) return;
        this.isResizing = false;
    }

    public update(): void {
        this.drawBackground();
        this.createResizeHandle();
        this.updateTextPosition();
    }

    public getData(): IClip {
        return { ...this.clipData };
    }
} 