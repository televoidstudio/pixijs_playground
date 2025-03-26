import * as PIXI from "pixi.js";
import { BaseComponent } from "../../../core/BaseComponent";
import { IClip } from "../../../../types/daw";
import { ClipComponent } from "../clip/ClipComponent";

/**
 * 軌道內容區組件
 * 負責管理軌道中的音頻片段和視覺元素
 */
export class TrackContentComponent extends BaseComponent {
    private background: PIXI.Graphics;
    private clips: Map<string, ClipComponent> = new Map();
    private gridSize: number;

    public static readonly TRACK_HEIGHT = 80;

    /**
     * 建構函數
     * @param id 組件唯一標識符
     * @param gridSize 網格大小
     */
    constructor(id: string, gridSize: number = 50) {
        super(id);
        this.gridSize = gridSize;
    }

    /**
     * 初始化組件
     */
    protected setupComponent(): void {
        this.background = new PIXI.Graphics();
        this.drawBackground();
        this.container.addChild(this.background);
    }

    /**
     * 設置事件處理器
     */
    protected setupEventHandlers(): void {
        // 目前不需要特別的事件處理
    }

    /**
     * 繪製背景
     */
    private drawBackground(): void {
        this.background.clear();
        
        // 計算內容區域的寬度（確保足夠寬）
        const contentWidth = Math.max(window.innerWidth * 2, 3000);
        
        // 繪製內容區域背景
        this.background
            .fill({ color: 0x2a2a2a })
            .rect(0, 0, contentWidth, TrackContentComponent.TRACK_HEIGHT);

        // 添加軌道底部分界線
        this.background
            .setStrokeStyle({
                width: 1,
                color: 0x444444,
                alpha: 1
            })
            .moveTo(0, TrackContentComponent.TRACK_HEIGHT)
            .lineTo(contentWidth, TrackContentComponent.TRACK_HEIGHT)
            .stroke();
    }

    /**
     * 設置片段的事件處理器
     */
    private setupClipEvents(clip: ClipComponent): void {
        const container = clip.getContainer();
        container.eventMode = 'static';
        container.on('rightclick', (event: PIXI.FederatedPointerEvent) => {
            event.stopPropagation();
            this.emitUIEvent('ui:clip:contextmenu', {
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
        const clipComponent = new ClipComponent(`${this.getId()}-clip-${clip.id}`, clip, this.gridSize);
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

    /**
     * 獲取片段數據
     */
    public getClip(clipId: string): IClip | null {
        const clip = this.clips.get(clipId);
        return clip ? clip.getData() : null;
    }

    /**
     * 更新組件
     */
    public update(): void {
        this.drawBackground();
        this.clips.forEach(clip => clip.update());
    }

    /**
     * 設置網格大小
     */
    public setGridSize(size: number): void {
        this.gridSize = size;
        this.update();
    }

    /**
     * 銷毀組件
     */
    public override destroy(): void {
        this.clips.forEach(clip => clip.destroy());
        super.destroy();
    }
} 