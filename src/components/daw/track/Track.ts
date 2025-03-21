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
        // 創建控制區
        this.controls = new TrackControls(this.track);
        this.container.addChild(this.controls.getContainer());

        // 創建內容區
        this.content = new TrackContent(this.track.id, this.gridSize);
        this.content.getContainer().position.x = DAWConfig.dimensions.controlsWidth;
        this.container.addChild(this.content.getContainer());

        // 設置初始位置
        const { topBarHeight, trackHeight } = DAWConfig.dimensions;
        this.container.position.y = topBarHeight + (this.index * trackHeight);

        this.setupControlEvents();
    }

    public update(): void {
        this.controls.update();
        this.content.update();
    }

    public destroy(): void {
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
        this.eventManager.on('track:dragstart', (data) => {
            if (data.trackId === this.track.id) {
                this.onDragStart(data.y);
            }
        });

        this.eventManager.on('track:drag', (data) => {
            if (data.trackId === this.track.id) {
                this.onDrag(data.y);
            }
        });

        this.eventManager.on('track:dragend', (data) => {
            if (data.trackId === this.track.id) {
                this.onDragEnd();
            }
        });
    }

    private onDragStart(y: number) {
        this.container.alpha = 0.8;
        this.dragStartY = y;
        this.initialY = this.getY();
    }

    private onDrag(y: number) {
        const deltaY = y - this.dragStartY;
        const newY = Math.max(
            DAWConfig.dimensions.topBarHeight, 
            this.initialY + deltaY
        );
        this.setY(newY);
    }

    private onDragEnd() {
        this.container.alpha = 1;
        this.dragStartY = 0;
        this.initialY = 0;
    }

    public setName(name: string): void {
        this.track.name = name;
        this.controls.updateName(name);
    }

    private showPreviewState(show: boolean): void {
        this.isPreviewTarget = show;
        this.container.alpha = show ? 0.7 : 1;
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
} 