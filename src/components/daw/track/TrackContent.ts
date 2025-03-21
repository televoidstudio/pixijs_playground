import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";
import { IClip } from "../../../types/daw";
import { Clip } from "../components/Clip";

export class TrackContent extends BaseComponent {
    private background: PIXI.Graphics;
    private clips: Map<string, Clip> = new Map();
    private gridSize: number;
    private static readonly TRACK_HEIGHT = 80;

    constructor(private trackId: string, gridSize: number = 50) {
        super();
        this.gridSize = gridSize;
        this.init();
    }

    private init() {
        this.background = new PIXI.Graphics();
        this.drawBackground();
        this.container.addChild(this.background);
    }

    private drawBackground() {
        this.background.clear();
        
        // 計算內容區域的寬度
        const contentWidth = window.innerWidth * 2;
        
        // 繪製內容區域背景
        this.background
            .fill({ color: 0x2a2a2a })
            .rect(0, 0, contentWidth, TrackContent.TRACK_HEIGHT);

        // 繪製垂直網格線
        for (let x = 0; x <= contentWidth; x += this.gridSize) {
            // 主要拍子線（每4拍）
            if ((x / this.gridSize) % 4 === 0) {
                this.background
                    .setStrokeStyle({
                        width: 1,
                        color: 0x444444,
                        alpha: 0.8
                    })
                    .moveTo(x, 0)
                    .lineTo(x, TrackContent.TRACK_HEIGHT)
                    .stroke();
            } else {
                // 子拍子線
                this.background
                    .setStrokeStyle({
                        width: 1,
                        color: 0x333333,
                        alpha: 0.5
                    })
                    .moveTo(x, 0)
                    .lineTo(x, TrackContent.TRACK_HEIGHT)
                    .stroke();
            }
        }

        // 添加軌道底部分界線
        this.background
            .setStrokeStyle({
                width: 1,
                color: 0x444444,
                alpha: 1
            })
            .moveTo(0, TrackContent.TRACK_HEIGHT)
            .lineTo(contentWidth, TrackContent.TRACK_HEIGHT)
            .stroke();
    }

    private setupClipEvents(clip: Clip): void {
        const container = clip.getContainer();
        container.eventMode = 'static';
        container.on('rightclick', (event: PIXI.FederatedPointerEvent) => {
            event.stopPropagation();
            this.eventManager.emit('clip:contextmenu', {
                clipId: clip.getId(),
                x: event.global.x,
                y: event.global.y
            });
        });
    }

    /**
     * 添加片段
     */
    public addClip(clip: IClip): void {
        const clipComponent = new Clip(clip, this.gridSize);
        this.clips.set(clip.id, clipComponent);
        this.container.addChild(clipComponent.getContainer());
        
        // 設置片段位置
        clipComponent.getContainer().position.x = clip.startTime * this.gridSize;
        
        // 設置右鍵選單事件
        this.setupClipEvents(clipComponent);
    }

    /**
     * 移除片段
     */
    public removeClip(clipId: string): void {
        const clip = this.clips.get(clipId);
        if (clip) {
            this.container.removeChild(clip.getContainer());
            clip.destroy();
            this.clips.delete(clipId);
        }
    }

    public getClip(clipId: string): Clip | undefined {
        return this.clips.get(clipId);
    }

    public update() {
        this.drawBackground();
        this.clips.forEach(clip => clip.update());
    }

    public setGridSize(size: number) {
        this.gridSize = size;
        this.update();
    }

    public destroy() {
        this.clips.forEach(clip => clip.destroy());
        this.container.destroy({ children: true });
    }
} 