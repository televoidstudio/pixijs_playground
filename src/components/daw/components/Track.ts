import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";
import { ITrack, IClip } from "../../../types/daw";
import { TrackControls } from "./TrackControls";
import { TrackContent } from "./TrackContent";
import { TopBar } from "./TopBar";

export class Track extends BaseComponent {
    private controls: TrackControls;
    private content: TrackContent;
    private gridSize: number;
    public static readonly TIMELINE_HEIGHT = 50;
    public static readonly TRACK_HEIGHT = 80;
    public static readonly TOP_BAR_HEIGHT = 40;
    private dragStartY: number = 0;
    private initialY: number = 0;
    private isPreviewTarget: boolean = false;

    constructor(private track: ITrack, private index: number, gridSize: number = 50) {
        super();
        this.gridSize = gridSize;
        this.init();
    }

    private init() {
        // 創建控制區
        this.controls = new TrackControls(this.track);
        this.container.addChild(this.controls.getContainer());

        // 創建內容區
        this.content = new TrackContent(this.track.id, this.gridSize);
        this.content.getContainer().position.x = TrackControls.WIDTH;
        this.container.addChild(this.content.getContainer());

        // 設置初始位置（直接使用 index * TRACK_HEIGHT）
        this.setY(TopBar.HEIGHT + (this.index * Track.TRACK_HEIGHT));

        // 監聽控制區的拖曳事件
        this.setupControlEvents();
    }
    private setupControlEvents() {
        this.eventManager.on('track:dragstart' as keyof EventPayload, (data: { trackId: string; y: number }) => {
            if (data.trackId === this.track.id) {
                this.container.alpha = 0.8;
                this.dragStartY = data.y;
                this.initialY = this.getY();
                this.eventManager.emit('daw:track:dragstart', {
                    trackId: this.track.id,
                    index: this.index
                });
            }
        });

        this.eventManager.on('track:drag', (data: { trackId: string; y: number }) => {
            if (data.trackId === this.track.id) {
                const deltaY = data.y - this.dragStartY;
                // 修改最小值計算，移除 TIMELINE_HEIGHT
                const newY = Math.max(TopBar.HEIGHT, this.initialY + deltaY);
                
                if (this.container) {
                    this.setY(newY);
                    
                    // 修改目標索引計算
                    const targetIndex = Math.floor((newY - TopBar.HEIGHT) / Track.TRACK_HEIGHT);
                    if (targetIndex !== this.index) {
                        this.eventManager.emit('daw:track:preview', {
                            fromId: this.track.id,
                            fromIndex: this.index,
                            toIndex: targetIndex
                        });
                    }
                }
            }
        });

        this.eventManager.on('track:dragend', (data: { trackId: string; y: number }) => {
            if (data.trackId === this.track.id) {
                this.container.alpha = 1;
                
                if (this.container) {
                    this.eventManager.emit('daw:track:dragend', {
                        trackId: this.track.id,
                        finalY: this.getY()
                    });
                }
                
                this.dragStartY = 0;
                this.initialY = 0;
            }
            
            if (this.isPreviewTarget) {
                this.showPreviewState(false);
            }
        });

        // 監聽預覽事件
        this.eventManager.on('daw:track:preview', (data: { fromId: string; fromIndex: number; toIndex: number }) => {
            // 如果這個軌道是目標位置
            if (this.index === data.toIndex && this.track.id !== data.fromId) {
                this.showPreviewState(true);
            } else if (this.isPreviewTarget) {
                this.showPreviewState(false);
            }
        });
    }

    private showPreviewState(show: boolean) {
        this.isPreviewTarget = show;
        if (show) {
            // 顯示預覽效果
            this.container.alpha = 0.7;
            // 添加視覺提示（使用新的 setStrokeStyle）
            const previewBorder = new PIXI.Graphics()
                .setStrokeStyle({
                    width: 2,
                    color: 0x4CAF50
                })
                .drawRect(0, 0, this.container.width, Track.TRACK_HEIGHT);
            this.container.addChild(previewBorder);
        } else {
            // 移除預覽效果
            this.container.alpha = 1;
            // 移除所有預覽相關的視覺元素
            this.container.children.forEach(child => {
                if (child instanceof PIXI.Graphics) {
                    this.container.removeChild(child);
                }
            });
        }
    }

    public setY(y: number) {
        if (this.container) {
            this.container.y = y;
        }
    }

    public getY(): number {
        return this.container ? this.container.y : 0;
    }

    public getId(): string {
        return this.track.id;
    }

    public addClip(clip: IClip) {
        this.content.addClip(clip);
    }

    public removeClip(clipId: string) {
        this.content.removeClip(clipId);
    }

    public update() {
        this.content.update();
    }

    public setGridSize(size: number) {
        this.gridSize = size;
        this.content.setGridSize(size);
    }

    public destroy() {
        this.controls.destroy();
        this.content.destroy();
        this.eventManager.off('track:dragstart', () => {});
        this.eventManager.off('track:drag', () => {});
        this.eventManager.off('track:dragend', () => {});
        this.container.destroy({ children: true });
    }

    public setName(name: string) {
        this.track.name = name;
        this.controls.setName(name);
    }
} 