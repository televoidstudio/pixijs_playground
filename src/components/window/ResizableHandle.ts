import * as PIXI from "pixi.js";
import { IFloatingWindow } from "../../types/IFloatingWindow";
import { EventManager } from "../../utils/EventManager";

export class ResizableHandle {
    private isResizing = false;
    private startPosition = { x: 0, y: 0 };
    private startSize = { width: 0, height: 0 };
    private handle: PIXI.Graphics;
    private eventManager: EventManager;

    constructor(private window: IFloatingWindow) {
        this.eventManager = EventManager.getInstance();
        this.createHandle();
    }

    private createHandle() {
        this.handle = new PIXI.Graphics();
        this.drawHandle();
        
        this.handle.eventMode = 'static';
        this.handle.cursor = 'se-resize';
        
        this.handle.on('pointerdown', this.onResizeStart.bind(this));
        this.handle.on('pointermove', this.onResizeMove.bind(this));
        this.handle.on('pointerup', this.onResizeEnd.bind(this));
        this.handle.on('pointerupoutside', this.onResizeEnd.bind(this));
        
        this.window.container.addChild(this.handle);
    }

    private drawHandle() {
        this.handle.clear();
        this.handle.beginFill(0xFFFFFF, 0.0);
        this.handle.lineStyle(2, 0xFFFFFF, 0.8);
        
        // 繪製調整大小的手柄
        const size = 10;
        const x = this.window.size.width - size;
        const y = this.window.size.height - size;
        
        this.handle.moveTo(x + size, y);
        this.handle.lineTo(x + size, y + size);
        this.handle.lineTo(x, y + size);
        
        this.handle.hitArea = new PIXI.Rectangle(x, y, size, size);
    }

    private onResizeStart(event: PIXI.FederatedPointerEvent) {
        this.isResizing = true;
        this.startPosition = { x: event.x, y: event.y };
        this.startSize = { ...this.window.size };
        this.eventManager.emit('resize:start', { window: this.window });
    }

    private onResizeMove(event: PIXI.FederatedPointerEvent) {
        if (!this.isResizing) return;

        const dx = event.x - this.startPosition.x;
        const dy = event.y - this.startPosition.y;

        const newWidth = Math.max(this.startSize.width + dx, this.window.minWidth);
        const newHeight = Math.max(this.startSize.height + dy, this.window.minHeight);

        this.window.size.width = newWidth;
        this.window.size.height = newHeight;

        this.window.draw();
        this.drawHandle();

        this.eventManager.emit('resize:move', {
            window: this.window,
            size: { width: newWidth, height: newHeight }
        });
    }

    private onResizeEnd() {
        if (!this.isResizing) return;
        this.isResizing = false;
        this.eventManager.emit('resize:end', { window: this.window });
    }
} 