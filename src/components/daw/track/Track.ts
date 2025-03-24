import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";
import { ITrack, IClip } from "../../../types/daw";
import { TrackControls } from "./TrackControls";
import { TrackContent } from "./TrackContent";
import { DAWConfig } from "../../../config/DAWConfig";

export class Track extends BaseComponent {
    private controls: TrackControls;
    private content: TrackContent;
    private dragStartY: number = 0;
    private initialY: number = 0;
    private isPreviewTarget: boolean = false;

    // 事件處理器
    private onDragStartHandler: (data: any) => void;
    private onDragHandler: (data: any) => void;
    private onDragEndHandler: (data: any) => void;

    // 添加靜態屬性
    public static readonly TRACK_HEIGHT = DAWConfig.dimensions.trackHeight;
    public static readonly TIMELINE_HEIGHT = DAWConfig.dimensions.topBarHeight;

    constructor(
        private track: ITrack, 
        private index: number, 
        private gridSize: number = DAWConfig.dimensions.gridSize
    ) {
        super();
        this.init();
    }

    private init() {
        // 設置容器屬性
        this.container.eventMode = 'static';
        this.container.interactiveChildren = true;
        this.container.visible = true;
        this.container.sortableChildren = true;

        // 創建控制區
        this.controls = new TrackControls(this.track);
        this.controls.getContainer().zIndex = 1;
        this.container.addChild(this.controls.getContainer());

        // 創建內容區
        this.content = new TrackContent(this.track.id, this.gridSize);
        this.content.getContainer().position.x = DAWConfig.dimensions.controlsWidth;
        this.content.getContainer().zIndex = 0;
        this.container.addChild(this.content.getContainer());

        // 設置初始位置
        this.container.position.y = this.index * DAWConfig.dimensions.trackHeight;

        this.setupControlEvents();
    }

    public update(): void {
        this.controls.update();
        this.content.update();
    }

    public destroy(): void {
        // 清理事件監聽器
        this.eventManager.off('track:dragstart', this.onDragStartHandler);
        this.eventManager.off('track:drag', this.onDragHandler);
        this.eventManager.off('track:dragend', this.onDragEndHandler);
        this.container.removeAllListeners();

        // 清理子組件
        this.controls.destroy();
        this.content.destroy();
        this.container.destroy({ children: true });
    }

    public setY(y: number): void {
        this.container.position.y = y;
    }

    public getY(): number {
        return this.container.position.y;
    }

    private setupControlEvents() {
        this.onDragStartHandler = (data) => {
            if (data.trackId === this.track.id) {
                this.onDragStart(data.y);
            }
        };

        this.onDragHandler = (data) => {
            if (data.trackId === this.track.id) {
                this.onDrag(data.y);
            }
        };

        this.onDragEndHandler = (data) => {
            if (data.trackId === this.track.id) {
                this.onDragEnd();
            }
        };

        this.eventManager.on('track:dragstart', this.onDragStartHandler);
        this.eventManager.on('track:drag', this.onDragHandler);
        this.eventManager.on('track:dragend', this.onDragEndHandler);

        // 添加右鍵選單事件
        this.container.eventMode = 'static';
        this.container.on('rightclick', (event: PIXI.FederatedPointerEvent) => {
            event.stopPropagation();
            this.eventManager.emit('daw:track:contextmenu', {
                trackId: this.track.id,
                x: event.global.x,
                y: event.global.y
            });
        });
    }

    private onDragStart(y: number) {
        this.container.zIndex = 1;  // 確保拖動的軌道在最上層
        this.container.alpha = 0.8;
        this.dragStartY = y;
        this.initialY = this.container.position.y;
    }

    private onDrag(y: number) {
        const deltaY = y - this.dragStartY;
        const newY = this.initialY + deltaY;
        this.setY(newY);
    }

    private onDragEnd() {
        this.container.zIndex = 0;  // 恢復正常層級
        this.container.alpha = 1;
        this.dragStartY = 0;
        this.initialY = 0;
    }

    public resetPreviewState(): void {
        this.container.alpha = 1;
        this.container.zIndex = 0;
        this.isPreviewTarget = false;
    }

    public setPreviewState(isTarget: boolean): void {
        this.isPreviewTarget = isTarget;
        this.container.alpha = isTarget ? 0.7 : 1;
    }

    public setName(name: string): void {
        this.track.name = name;
        this.controls.updateName(name);
    }

    /**
     * 添加片段到軌道
     * @param clip 片段數據
     */
    public addClip(clip: IClip): void {
        this.content.addClip(clip);
    }

    /**
     * 從軌道移除片段
     * @param clipId 片段ID
     */
    public removeClip(clipId: string): void {
        this.content.removeClip(clipId);
    }

    public getClip(clipId: string): IClip | null {
        return this.content.getClip(clipId);
    }
} 