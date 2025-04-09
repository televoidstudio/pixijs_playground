import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";

interface IMidiNote {
    pitch: number;
    time: number;
    duration: number;
    velocity: number;
}

export class Note extends BaseComponent {
    private background: PIXI.Graphics;
    private noteData: IMidiNote;
    private gridSize: number;
    private noteHeight: number;
    private isDragging: boolean = false;
    private isResizing: boolean = false;
    private dragStartX: number = 0;
    private dragStartY: number = 0;
    private originalX: number = 0;
    private originalY: number = 0;
    private resizeHandle: PIXI.Graphics;
    private onDelete: () => void;

    constructor(
        noteData: IMidiNote,
        gridSize: number,
        noteHeight: number,
        onDelete: () => void
    ) {
        super();
        this.noteData = noteData;
        this.gridSize = gridSize;
        this.noteHeight = noteHeight;
        this.onDelete = onDelete;
        this.init();
    }

    private init(): void {
        this.background = new PIXI.Graphics();
        this.resizeHandle = new PIXI.Graphics();
        
        this.container.position.x = this.noteData.time * this.gridSize;
        this.container.position.y = 0;
        
        this.drawNote();
        this.setupEvents();
    }

    private drawNote(): void {
        // 繪製音符主體
        this.background
            .fill({ color: 0x4a90e2 })
            .rect(
                0,
                0,
                this.noteData.duration * this.gridSize,
                this.noteHeight
            );

        // 繪製調整大小的把手
        this.resizeHandle
            .fill({ color: 0x2a62a8 })
            .rect(
                this.noteData.duration * this.gridSize - 5,
                0,
                5,
                this.noteHeight
            );

        this.container.addChild(this.background);
        this.container.addChild(this.resizeHandle);
    }

    private setupEvents(): void {
        this.container.eventMode = 'static';
        this.container.cursor = 'move';
        this.resizeHandle.eventMode = 'static';
        this.resizeHandle.cursor = 'ew-resize';

        // 拖動事件
        this.container.on('pointerdown', this.onDragStart.bind(this));
        this.container.on('pointermove', this.onDragMove.bind(this));
        this.container.on('pointerup', this.onDragEnd.bind(this));
        this.container.on('pointerupoutside', this.onDragEnd.bind(this));

        // 調整大小事件
        this.resizeHandle.on('pointerdown', this.onResizeStart.bind(this));
        this.resizeHandle.on('pointermove', this.onResizeMove.bind(this));
        this.resizeHandle.on('pointerup', this.onResizeEnd.bind(this));
        this.resizeHandle.on('pointerupoutside', this.onResizeEnd.bind(this));

        // 雙擊刪除
        this.container.on('pointertap', (event: PIXI.FederatedPointerEvent) => {
            if (event.detail === 2) {  // 雙擊
                this.onDelete();
            }
        });
    }

    private onDragStart(event: PIXI.FederatedPointerEvent): void {
        if (this.isResizing) return;
        this.isDragging = true;
        this.dragStartX = event.globalX;
        this.dragStartY = event.globalY;
        this.originalX = this.container.position.x;
        this.originalY = this.container.position.y;
        this.background.alpha = 0.7;
    }

    private onDragMove(event: PIXI.FederatedPointerEvent): void {
        if (!this.isDragging) return;

        const dx = event.globalX - this.dragStartX;
        const dy = event.globalY - this.dragStartY;

        const newX = Math.round((this.originalX + dx) / this.gridSize) * this.gridSize;
        const newY = Math.round(dy / this.noteHeight) * this.noteHeight;

        this.container.position.x = newX;
        // Y position is handled by the parent container
    }

    private onDragEnd(): void {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.background.alpha = 1;

        // 更新音符數據
        this.noteData.time = Math.round(this.container.position.x / this.gridSize);
        this.eventManager.emit('daw:midi:note:moved', { note: this.noteData });
    }

    private onResizeStart(event: PIXI.FederatedPointerEvent): void {
        this.isResizing = true;
        this.dragStartX = event.globalX;
        this.originalX = this.noteData.duration;
        event.stopPropagation();
    }

    private onResizeMove(event: PIXI.FederatedPointerEvent): void {
        if (!this.isResizing) return;

        const dx = event.globalX - this.dragStartX;
        const newDuration = Math.max(1, Math.round((this.originalX * this.gridSize + dx) / this.gridSize));
        
        this.noteData.duration = newDuration;
        this.redraw();
    }

    private onResizeEnd(): void {
        if (!this.isResizing) return;
        this.isResizing = false;
        this.eventManager.emit('daw:midi:note:resized', { note: this.noteData });
    }

    private redraw(): void {
        this.background.clear();
        this.resizeHandle.clear();
        this.drawNote();
    }

    public getData(): IMidiNote {
        return { ...this.noteData };
    }

    public update(): void {
        // 實現更新邏輯
    }

    public destroy(): void {
        this.background.destroy();
        this.resizeHandle.destroy();
        this.container.destroy({ children: true });
    }
} 