import { BaseComponent } from '../../../core/BaseComponent';
import { TrackControlsComponent } from './TrackControlsComponent';
import { TrackContentComponent } from './TrackContentComponent';
import { ITrack } from '../../../../types/daw';
import { defaultDAWConfig } from '../../../../config/dawConfig';
import * as PIXI from 'pixi.js';
import { FederatedPointerEvent } from 'pixi.js';

/**
 * 軌道組件
 * 負責管理單個音軌的視覺元素和交互功能
 */
export class TrackComponent extends BaseComponent {
    private trackData: ITrack;
    private controls: TrackControlsComponent;
    private content: TrackContentComponent;
    private background: PIXI.Graphics;
    private index: number;
    private gridSize: number;
    private isDragging: boolean = false;
    private dragStartY: number = 0;
    protected readonly trackId: string;

    constructor(id: string, trackData: ITrack, index: number, gridSize: number) {
        super(id);
        this.trackId = id;
        this.trackData = trackData;
        this.index = index;
        this.gridSize = gridSize;
    }

    protected setupComponent(): void {
        this.background = new PIXI.Graphics();
        this.container.addChild(this.background);

        // 創建子組件
        this.controls = new TrackControlsComponent(this.trackId + '-controls', this.trackData);
        this.content = new TrackContentComponent(this.trackId + '-content', this.gridSize);

        // 使用雙重類型斷言來安全地訪問 getContainer 方法
        const controlsContainer = ((this.controls as unknown) as BaseComponent).getContainer();
        const contentContainer = ((this.content as unknown) as BaseComponent).getContainer();

        this.container.addChild(controlsContainer);
        this.container.addChild(contentContainer);

        // 設置位置
        contentContainer.x = defaultDAWConfig.dimensions.controlsWidth;
        this.updatePosition();
        this.drawBackground();
    }

    protected setupEventHandlers(): void {
        // 拖動事件
        this.container.interactive = true;
        this.container.on('pointerdown', this.onDragStart.bind(this));
        this.container.on('pointermove', this.onDragMove.bind(this));
        this.container.on('pointerup', this.onDragEnd.bind(this));
        this.container.on('pointerupoutside', this.onDragEnd.bind(this));

        // 右鍵菜單
        this.container.on('rightclick', (event: FederatedPointerEvent) => {
            const position = event.global;
            this.emitUIEvent('ui:track:contextmenu', {
                trackId: this.trackId,
                x: position.x,
                y: position.y
            });
        });
    }

    private onDragStart(event: FederatedPointerEvent): void {
        this.isDragging = true;
        this.dragStartY = event.global.y;
        this.emitUIEvent('ui:track:dragstart', {
            trackId: this.trackId,
            y: this.dragStartY
        });
    }

    private onDragMove(event: FederatedPointerEvent): void {
        if (!this.isDragging) return;
        const currentY = event.global.y;
        this.emitUIEvent('ui:track:drag', {
            trackId: this.trackId,
            y: currentY
        });
    }

    private onDragEnd(event: FederatedPointerEvent): void {
        if (!this.isDragging) return;
        this.isDragging = false;
        const endY = event.global.y;
        this.emitUIEvent('ui:track:dragend', {
            trackId: this.trackId,
            y: endY
        });
    }

    private drawBackground(): void {
        this.background.clear();
        this.background.beginFill(0x2c2c2c);
        this.background.drawRect(0, 0, window.innerWidth, defaultDAWConfig.dimensions.trackHeight);
        this.background.endFill();
    }

    public updatePosition(): void {
        this.container.y = this.index * defaultDAWConfig.dimensions.trackHeight;
    }

    public setY(y: number): void {
        this.container.y = y;
    }

    public getY(): number {
        return this.container.y;
    }

    public setPreviewState(isPreview: boolean): void {
        this.container.alpha = isPreview ? 0.5 : 1;
    }

    public destroy(): void {
        this.controls.destroy();
        this.content.destroy();
        super.destroy();
    }

    public update(): void {
        this.drawBackground();
        this.controls?.update();
        this.content?.update();
    }
} 