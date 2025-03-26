import * as PIXI from "pixi.js";
import { BaseComponent } from "../../../core/BaseComponent";
import { ITrack } from "../../../../types/daw";
import { defaultDAWConfig } from "../../../../config/dawConfig";
import { FederatedPointerEvent } from "pixi.js";

/**
 * 軌道控制區組件
 * 負責管理軌道的控制元素，如名稱、按鈕等
 */
export class TrackControlsComponent extends BaseComponent {
    private trackData: ITrack;
    private background: PIXI.Graphics;
    private dragHandle: PIXI.Graphics;
    private nameText: PIXI.Text;
    private isDragging: boolean = false;

    // 靜態屬性
    public static readonly WIDTH = defaultDAWConfig.dimensions.controlsWidth;
    public static readonly HEIGHT = defaultDAWConfig.dimensions.trackHeight;
    public static readonly HANDLE_WIDTH = 30;

    private handleDragMove = (event: PointerEvent): void => {
        if (!this.isDragging) return;

        const currentTime = performance.now();
        if (currentTime - this.lastEmitTime >= this.throttleInterval) {
            this.lastY = event.clientY;
            this.emitUIEvent('ui:track:drag', {
                trackId: this.trackData.id,
                y: this.lastY
            });
            this.lastEmitTime = currentTime;
        }
    };

    private handleDragEnd = (): void => {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.dragHandle.cursor = 'grab';
        this.dragHandle.tint = 0xFFFFFF;

        window.removeEventListener('pointermove', this.handleDragMove);
        window.removeEventListener('pointerup', this.handleDragEnd);

        this.emitUIEvent('ui:track:dragend', {
            trackId: this.trackData.id,
            y: this.lastY
        });
    };

    private lastEmitTime: number = 0;
    private readonly throttleInterval: number = 16; // 約60fps
    private lastY: number = 0;

    /**
     * 建構函數
     * @param id 組件唯一標識符
     * @param trackData 軌道數據
     */
    constructor(id: string, trackData: ITrack) {
        super(id);
        this.trackData = trackData;
    }

    /**
     * 初始化組件
     */
    protected setupComponent(): void {
        // 創建背景
        this.background = new PIXI.Graphics();
        this.createBackground();

        // 創建拖曳把手
        this.dragHandle = new PIXI.Graphics();
        this.createDragHandle();

        // 創建軌道名稱
        this.createTrackName();
    }

    /**
     * 設置事件處理器
     */
    protected setupEventHandlers(): void {
        this.setupDragEvents();
        this.nameText.interactive = true;
        this.nameText.on('click', this.startNameEdit.bind(this));
    }

    /**
     * 創建背景
     */
    private createBackground(): void {
        this.background.beginFill(0x1a1a1a);
        this.background.drawRect(0, 0, defaultDAWConfig.dimensions.controlsWidth, defaultDAWConfig.dimensions.trackHeight);
        this.background.endFill();
        this.container.addChild(this.background);
    }

    /**
     * 創建拖曳把手
     */
    private createDragHandle(): void {
        // 繪製拖動把手背景
        this.dragHandle
            .fill({ color: 0x444444 })
            .rect(0, 0, TrackControlsComponent.HANDLE_WIDTH, TrackControlsComponent.HEIGHT);

        // 繪製把手圖示
        this.dragHandle
            .fill({ color: 0x666666 })
            .rect(8, 32, 14, 2)
            .rect(8, 37, 14, 2)
            .rect(8, 42, 14, 2);

        // 設置把手互動屬性
        this.dragHandle.eventMode = 'static';
        this.dragHandle.cursor = 'grab';

        this.container.addChild(this.dragHandle);
    }

    /**
     * 創建軌道名稱
     */
    private createTrackName(): void {
        this.nameText = new PIXI.Text(this.trackData.name, {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xffffff
        });
        this.nameText.x = 10;
        this.nameText.y = (defaultDAWConfig.dimensions.trackHeight - this.nameText.height) / 2;
        this.container.addChild(this.nameText);
    }

    /**
     * 設置拖拽事件
     */
    private setupDragEvents(): void {
        this.dragHandle.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            this.isDragging = true;
            this.lastY = event.global.y;
            this.dragHandle.cursor = 'grabbing';
            this.dragHandle.tint = 0x888888;

            window.addEventListener('pointermove', this.handleDragMove);
            window.addEventListener('pointerup', this.handleDragEnd);

            this.emitUIEvent('ui:track:dragstart', {
                trackId: this.trackData.id,
                y: event.global.y
            });
        });
    }

    /**
     * 處理名稱點擊
     */
    private startNameEdit(): void {
        this.emitUIEvent('ui:track:rename:start', {
            trackId: this.trackData.id,
            currentName: this.trackData.name
        });
    }

    /**
     * 更新軌道名稱
     */
    public updateName(name: string): void {
        this.trackData.name = name;
        this.nameText.text = name;
    }

    /**
     * 更新組件
     */
    public update(): void {
        this.createBackground();
        this.nameText.text = this.trackData.name;
    }

    /**
     * 銷毀組件
     */
    public override destroy(): void {
        window.removeEventListener('pointermove', this.handleDragMove);
        window.removeEventListener('pointerup', this.handleDragEnd);
        super.destroy();
    }
} 