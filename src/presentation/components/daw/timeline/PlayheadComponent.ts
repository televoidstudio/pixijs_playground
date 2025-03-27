import * as PIXI from "pixi.js";
import { BaseComponent } from "../../../core/BaseComponent";
import { UIEventBus } from "../../../../events/UIEventBus";

export class PlayheadComponent extends BaseComponent {
    private line: PIXI.Graphics;
    private handle: PIXI.Graphics;
    private currentPosition: number = 0;
    private height: number;
    private gridSize: number;
    private isDragging: boolean = false;
    private dragStartX: number = 0;
    private static readonly CONTROL_WIDTH = 200;
    private static readonly HANDLE_SIZE = 10;

    constructor(
        height: number, 
        gridSize: number = 25,
        protected uiEventBus: UIEventBus = UIEventBus.getInstance()
    ) {
        super('playhead');
        this.height = height;
        this.gridSize = gridSize;
    }

    public initialize(): void {
        this.setupComponent();
        this.setupEventHandlers();
    }

    protected setupComponent(): void {
        this.line = new PIXI.Graphics();
        this.handle = new PIXI.Graphics();
        
        this.container.addChild(this.line);
        this.container.addChild(this.handle);

        this.container.eventMode = 'static';
        this.handle.eventMode = 'static';
        this.handle.cursor = 'ew-resize';
        
        this.handle.interactive = true;
        
        this.draw();
        
        this.container.position.x = PlayheadComponent.CONTROL_WIDTH;
        this.container.position.y = 0;
    }

    protected setupEventHandlers(): void {
        this.setupDragEvents();
    }

    private setupDragEvents() {
        const handlePointerDown = (event: PIXI.FederatedPointerEvent) => {
            this.isDragging = true;
            this.dragStartX = event.globalX - this.container.position.x;
            this.handle.alpha = 0.7;
            
            window.addEventListener('pointermove', this.handlePointerMove);
            window.addEventListener('pointerup', this.handlePointerUp);

            this.emitUIEvent('ui:timeline:playhead:dragstart', {
                position: this.getPosition()
            });
        };

        this.handle.on('pointerdown', handlePointerDown);
    }

    private handlePointerMove = (event: PointerEvent) => {
        if (!this.isDragging) return;

        const newX = event.clientX - this.dragStartX;
        const minX = PlayheadComponent.CONTROL_WIDTH;
        const snappedX = Math.max(
            minX,
            Math.round((newX - PlayheadComponent.CONTROL_WIDTH) / this.gridSize) * this.gridSize + PlayheadComponent.CONTROL_WIDTH
        );
        
        this.setTimePosition((snappedX - PlayheadComponent.CONTROL_WIDTH) / this.gridSize);

        this.emitUIEvent('ui:timeline:playhead:drag', {
            position: this.getPosition()
        });
    };

    private handlePointerUp = () => {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.handle.alpha = 1;
        
        window.removeEventListener('pointermove', this.handlePointerMove);
        window.removeEventListener('pointerup', this.handlePointerUp);

        this.emitUIEvent('ui:timeline:playhead:dragend', {
            position: this.getPosition()
        });
    };

    private draw() {
        // 清除之前的繪製
        this.line.clear();
        this.handle.clear();

        // 繪製播放頭線條
        this.line
            .setStrokeStyle({
                width: 2,
                color: 0xff0000,
                alpha: 0.8
            })
            .moveTo(0, 0)
            .lineTo(0, this.height)
            .stroke();

        // 繪製播放頭手柄
        this.handle
            .fill({ color: 0xff0000 })
            .drawRect(
                -PlayheadComponent.HANDLE_SIZE / 2,
                0,
                PlayheadComponent.HANDLE_SIZE,
                PlayheadComponent.HANDLE_SIZE
            );
    }

    public setTimePosition(time: number) {
        const safeTime = Math.max(0, time);
        this.currentPosition = (safeTime * this.gridSize) + PlayheadComponent.CONTROL_WIDTH;
        this.container.position.x = this.currentPosition;
        
        this.emitUIEvent('ui:timeline:playhead:move', {
            position: this.getPosition()
        });
    }

    public getPosition(): number {
        return Math.max(0, (this.currentPosition - PlayheadComponent.CONTROL_WIDTH) / this.gridSize);
    }

    public update(): void {
        this.draw();
    }

    public destroy(): void {
        this.handle.removeAllListeners();
        window.removeEventListener('pointermove', this.handlePointerMove);
        window.removeEventListener('pointerup', this.handlePointerUp);
        super.destroy();
    }

    public setHeight(height: number): void {
        this.height = height;
        this.draw();
    }
} 