import * as PIXI from "pixi.js";
import { EventManager } from "../../utils/EventManager";

export class Draggable {
    private isDragging = false;
    private startPosition = { x: 0, y: 0 };
    private startTargetPosition = { x: 0, y: 0 };
    private eventManager: EventManager;

    constructor(private target: PIXI.Container) {
        this.eventManager = EventManager.getInstance();
        this.initialize();
    }

    private initialize() {
        this.target.eventMode = 'static';
        this.target.cursor = 'move';

        this.target.on('pointerdown', this.onDragStart.bind(this));
        this.target.on('pointermove', this.onDragMove.bind(this));
        this.target.on('pointerup', this.onDragEnd.bind(this));
        this.target.on('pointerupoutside', this.onDragEnd.bind(this));
    }

    private onDragStart(event: PIXI.FederatedPointerEvent) {
        this.isDragging = true;
        this.startPosition = { x: event.x, y: event.y };
        this.startTargetPosition = { x: this.target.parent.x, y: this.target.parent.y };
        this.eventManager.emit('drag:start', { target: this.target });
    }

    private onDragMove(event: PIXI.FederatedPointerEvent) {
        if (!this.isDragging) return;

        const dx = event.x - this.startPosition.x;
        const dy = event.y - this.startPosition.y;

        this.target.parent.x = this.startTargetPosition.x + dx;
        this.target.parent.y = this.startTargetPosition.y + dy;

        this.eventManager.emit('drag:move', {
            target: this.target,
            position: { x: this.target.parent.x, y: this.target.parent.y }
        });
    }

    private onDragEnd() {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.eventManager.emit('drag:end', { target: this.target });
    }
} 