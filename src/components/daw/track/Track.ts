import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";
import { ITrack } from "../../../types/daw";
import { TrackControls } from "./TrackControls";
import { TrackContent } from "./TrackContent";
import { DAWConfig } from "../../../config/DAWConfig";

export class Track extends BaseComponent {
    private controls: TrackControls;
    private content: TrackContent;
    private dragStartY: number = 0;
    private initialY: number = 0;
    private isPreviewTarget: boolean = false;

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
        this.setY(topBarHeight + (this.index * trackHeight));

        this.setupControlEvents();
    }

    private setupControlEvents() {
        this.eventManager.on('track:dragstart', (data: { trackId: string; y: number }) => {
            if (data.trackId === this.track.id) {
                this.container.alpha = 0.8;
                this.dragStartY = data.y;
                this.initialY = this.getY();
                this.eventManager.emit('track:drag:start', {
                    id: this.track.id,
                    index: this.index
                });
            }
        });

        // ... 其他事件處理保持不變
    }
} 