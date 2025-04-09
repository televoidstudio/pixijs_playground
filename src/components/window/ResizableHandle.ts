import * as PIXI from "pixi.js";
import { IFloatingWindow } from "../../types/IFloatingWindow";
import { EventManager } from "../../events/EventManager";

export class ResizableHandle {
    private isResizing = false;
    private startPosition = { x: 0, y: 0 };
    private startSize = { width: 0, height: 0 };
    private targetSize = { width: 0, height: 0 };
    private currentSize = { width: 0, height: 0 };
    private handle: PIXI.Graphics = new PIXI.Graphics();
    private eventManager: EventManager;
    private animationFrame: number | null = null;
    private readonly EASING = 0.25;
    private globalPointerMove: (event: PIXI.FederatedPointerEvent) => void;
    private globalPointerUp: () => void;

    constructor(private window: IFloatingWindow) {
        this.eventManager = EventManager.getInstance();
        this.currentSize = { ...window.size };
        this.targetSize = { ...window.size };
        this.globalPointerMove = this.onResizeMove.bind(this);
        this.globalPointerUp = this.onResizeEnd.bind(this);
        this.createHandle();
    }

    private createHandle() {
        this.drawHandle();
        
        this.handle.eventMode = 'static';
        this.handle.cursor = 'se-resize';
        
        this.handle.on('pointerdown', this.onResizeStart.bind(this));
        
        this.window.container.addChild(this.handle);
    }

    private drawHandle() {
        this.handle.clear();
        this.handle.beginFill(0xFFFFFF, 0.0);
        this.handle.lineStyle(2, 0xFFFFFF, 0.8);
        
        const size = 10;
        const x = this.currentSize.width - size;
        const y = this.currentSize.height - size;
        
        this.handle.moveTo(x + size, y);
        this.handle.lineTo(x + size, y + size);
        this.handle.lineTo(x, y + size);
        
        this.handle.hitArea = new PIXI.Rectangle(x, y, size, size);
    }

    private onResizeStart(event: PIXI.FederatedPointerEvent) {
        this.isResizing = true;
        this.startPosition = { x: event.x, y: event.y };
        this.startSize = { ...this.window.size };
        this.targetSize = { ...this.startSize };
        this.currentSize = { ...this.startSize };
        
        window.addEventListener('pointermove', this.globalPointerMove as any);
        window.addEventListener('pointerup', this.globalPointerUp);
        
        this.startAnimation();
        this.eventManager.emit('resize:start', { window: this.window });
    }

    private onResizeMove(event: PIXI.FederatedPointerEvent) {
        if (!this.isResizing) return;

        const dx = event.x - this.startPosition.x;
        const dy = event.y - this.startPosition.y;

        const newWidth = Math.max(this.startSize.width + dx, this.window.minWidth);
        const newHeight = Math.max(this.startSize.height + dy, this.window.minHeight);

        this.targetSize = {
            width: newWidth,
            height: newHeight
        };

        this.drawHandle();
    }

    private onResizeEnd() {
        if (!this.isResizing) return;
        this.isResizing = false;
        
        window.removeEventListener('pointermove', this.globalPointerMove as any);
        window.removeEventListener('pointerup', this.globalPointerUp);
        
        this.stopAnimation();
        this.eventManager.emit('resize:end', { window: this.window });
    }

    private startAnimation() {
        if (this.animationFrame !== null) return;

        const animate = () => {
            if (!this.isResizing) return;

            // 保存實際位置
            const currentPosition = {
                x: this.window.container.x,
                y: this.window.container.y
            };

            // 計算新的尺寸
            const newWidth = this.currentSize.width + (this.targetSize.width - this.currentSize.width) * this.EASING;
            const newHeight = this.currentSize.height + (this.targetSize.height - this.currentSize.height) * this.EASING;

            // 更新當前尺寸
            this.currentSize = {
                width: Math.round(newWidth),
                height: Math.round(newHeight)
            };

            // 更新視窗尺寸
            this.window.size = { ...this.currentSize };

            // 重新繪製視窗和手柄
            this.window.draw();
            this.drawHandle();

            // 確保位置保持不變
            this.window.container.x = currentPosition.x;
            this.window.container.y = currentPosition.y;
            this.window.position = currentPosition;

            this.eventManager.emit('resize:move', {
                window: this.window,
                size: this.currentSize
            });

            this.animationFrame = requestAnimationFrame(animate);
        };

        this.animationFrame = requestAnimationFrame(animate);
    }

    private stopAnimation() {
        if (this.animationFrame !== null) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
} 