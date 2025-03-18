import * as PIXI from "pixi.js";
import { EventManager } from "../../utils/EventManager";

export class Draggable {
    private isDragging = false;
    private startPosition = { x: 0, y: 0 };
    private startTargetPosition = { x: 0, y: 0 };
    private targetPosition = { x: 0, y: 0 };
    private currentPosition = { x: 0, y: 0 };
    private eventManager: EventManager;
    private animationFrame: number | null = null;
    private readonly EASING = 0.25; // 調整此值可改變平滑程度 (0.1-1.0)
    private globalPointerMove: (event: PIXI.FederatedPointerEvent) => void;
    private globalPointerUp: () => void;

    constructor(private target: PIXI.Container) {
        this.eventManager = EventManager.getInstance();
        this.globalPointerMove = this.onDragMove.bind(this);
        this.globalPointerUp = this.onDragEnd.bind(this);
        this.initialize();
    }

    private initialize() {
        this.target.eventMode = 'static';
        this.target.cursor = 'move';

        this.target.on('pointerdown', this.onDragStart.bind(this));

        this.currentPosition = {
            x: this.target.parent.x,
            y: this.target.parent.y
        };
        this.targetPosition = { ...this.currentPosition };
    }

    private onDragStart(event: PIXI.FederatedPointerEvent) {
        this.isDragging = true;
        this.startPosition = { x: event.x, y: event.y };
        this.startTargetPosition = {
            x: this.target.parent.x,
            y: this.target.parent.y
        };
        this.targetPosition = { ...this.startTargetPosition };
        this.currentPosition = { ...this.startTargetPosition };
        
        window.addEventListener('pointermove', this.globalPointerMove as any);
        window.addEventListener('pointerup', this.globalPointerUp);
        
        this.startAnimation();
        this.eventManager.emit('drag:start', { target: this.target });
    }

    private onDragMove(event: PIXI.FederatedPointerEvent) {
        if (!this.isDragging) return;

        const dx = event.x - this.startPosition.x;
        const dy = event.y - this.startPosition.y;

        this.targetPosition = {
            x: this.startTargetPosition.x + dx,
            y: this.startTargetPosition.y + dy
        };
    }

    private onDragEnd() {
        if (!this.isDragging) return;
        this.isDragging = false;
        
        window.removeEventListener('pointermove', this.globalPointerMove as any);
        window.removeEventListener('pointerup', this.globalPointerUp);
        
        this.stopAnimation();
        this.eventManager.emit('drag:end', { target: this.target });
    }

    private startAnimation() {
        if (this.animationFrame !== null) return;

        const animate = () => {
            if (!this.isDragging) return;

            // 使用緩動函數進行插值
            this.currentPosition.x += (this.targetPosition.x - this.currentPosition.x) * this.EASING;
            this.currentPosition.y += (this.targetPosition.y - this.currentPosition.y) * this.EASING;

            // 更新實際位置
            this.target.parent.x = Math.round(this.currentPosition.x);
            this.target.parent.y = Math.round(this.currentPosition.y);

            this.eventManager.emit('drag:move', {
                target: this.target,
                position: this.currentPosition
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