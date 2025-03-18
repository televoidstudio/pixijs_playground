import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";
import { ITrack, IClip } from "../../../types/daw";
import { Clip } from "./Clip";

export class Track extends BaseComponent {
    private background: PIXI.Graphics;
    private dragHandle: PIXI.Graphics;
    private controlsContainer: PIXI.Container;
    private contentContainer: PIXI.Container;
    private dragIndicator: PIXI.Graphics | null = null;
    private isDragging: boolean = false;
    private dragStartY: number = 0;
    private originalY: number = 0;
    private clips: Map<string, Clip> = new Map();

    constructor(private track: ITrack, private index: number) {
        super();
        
        // 創建所有容器和圖形
        this.controlsContainer = new PIXI.Container();
        this.contentContainer = new PIXI.Container();
        this.background = new PIXI.Graphics();
        this.dragHandle = new PIXI.Graphics();
        
        // 添加子容器到主容器
        this.container.addChild(this.controlsContainer);
        this.container.addChild(this.contentContainer);
        
        // 設置內容區域位置
        this.contentContainer.position.set(200, 0);
        
        // 初始化視覺元素
        this.init();
        
        // 設置初始位置
        this.setY(50 + (index * 80));
    }

    private init() {
        this.drawTrackBackground();
        this.createDragHandle();
        this.createTrackControls();
        this.setupDragEvents();
    }

    private createDragHandle() {
        // 清除之前的繪製
        this.dragHandle.clear();
        
        // 繪製拖動把手背景
        this.dragHandle
            .fill({ color: 0x444444 })
            .rect(0, 0, 30, 80);
            
        // 繪製把手圖示
        this.dragHandle
            .fill({ color: 0x666666 })
            .rect(8, 30, 14, 2)
            .rect(8, 35, 14, 2)
            .rect(8, 40, 14, 2);

        // 設置把手互動屬性
        this.dragHandle.eventMode = 'static';
        this.dragHandle.cursor = 'grab';
        
        // 添加懸停效果
        this.dragHandle.on('pointerover', () => {
            this.dragHandle.tint = 0x666666;
        });
        
        this.dragHandle.on('pointerout', () => {
            this.dragHandle.tint = 0xFFFFFF;
        });

        // 添加到控制區域
        this.controlsContainer.addChild(this.dragHandle);
    }

    private createTrackControls() {
        // 控制區域背景
        const controlsBg = new PIXI.Graphics();
        controlsBg
            .fill({ color: 0x333333 })
            .rect(30, 0, 170, 80); // 30px 之後開始繪製（把手寬度）
        
        // 軌道名稱
        const nameText = new PIXI.Text({
            text: this.track.name,
            style: {
                fontSize: 14,
                fill: 0xffffff,
                fontFamily: 'Arial'
            }
        });
        nameText.position.set(40, 30); // 文字位置也要調整

        this.controlsContainer.addChild(controlsBg, nameText);
    }

    private drawTrackBackground() {
        this.background.clear();
        
        // 繪製軌道內容區域背景
        this.background
            .fill({ color: 0x2a2a2a })
            .rect(0, 0, window.innerWidth - 200, 80);

        // 繪製網格線
        this.background
            .stroke({ color: 0x333333, width: 1 });
        
        // 垂直網格線
        for (let x = 0; x < window.innerWidth - 200; x += 50) {
            this.background
                .moveTo(x, 0)
                .lineTo(x, 80);
        }

        // 將背景添加到內容區域
        this.contentContainer.addChildAt(this.background, 0);
    }

    private setupDragEvents() {
        // 只在把手上設置拖動事件
        this.dragHandle
            .on('pointerdown', this.onDragStart.bind(this))
            .on('globalpointermove', this.onDragMove.bind(this))
            .on('pointerup', this.onDragEnd.bind(this))
            .on('pointerupoutside', this.onDragEnd.bind(this));
    }

    private onDragStart(event: PIXI.FederatedPointerEvent) {
        this.isDragging = true;
        this.dragStartY = event.global.y;
        this.originalY = this.container.y;
        
        // 視覺效果
        this.dragHandle.cursor = 'grabbing';
        this.container.alpha = 0.8;
        this.container.zIndex = 1000;
        
        // 添加拖動時的視覺指示
        this.showDragIndicator();
        
        this.eventManager.emit('daw:track:dragstart', { 
            trackId: this.track.id,
            index: this.index
        });
    }

    private showDragIndicator() {
        if (this.dragIndicator) {
            this.dragIndicator.destroy();
        }
        
        this.dragIndicator = new PIXI.Graphics();
        this.dragIndicator
            .fill({ color: 0xFFFFFF, alpha: 0.2 })
            .rect(0, 0, window.innerWidth, 80);
        
        this.container.addChild(this.dragIndicator);
    }

    private onDragMove(event: PIXI.FederatedPointerEvent) {
        if (!this.isDragging) return;

        const deltaY = event.global.y - this.dragStartY;
        this.setY(this.originalY + deltaY);

        this.eventManager.emit('daw:track:drag', {
            trackId: this.track.id,
            y: this.container.y
        });
    }

    private onDragEnd() {
        if (!this.isDragging) return;

        this.isDragging = false;
        
        // 恢復視覺效果
        this.dragHandle.cursor = 'grab';
        this.container.alpha = 1;
        this.container.zIndex = 0;
        
        // 移除拖動指示器
        if (this.dragIndicator) {
            this.dragIndicator.destroy();
            this.dragIndicator = null;
        }

        this.eventManager.emit('daw:track:dragend', {
            trackId: this.track.id,
            finalY: this.container.y
        });
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

    public update() {
        this.drawTrackBackground();
    }

    public addClip(clip: IClip, gridSize: number) {
        console.log(`Track ${this.track.id} adding clip:`, clip);
        
        const clipComponent = new Clip(clip, gridSize);
        this.clips.set(clip.id, clipComponent);
        
        // 確保將 clip 添加到 contentContainer
        this.contentContainer.addChild(clipComponent.getContainer());
        
        console.log(`Clip ${clip.id} added to track ${this.track.id}`, {
            clipCount: this.clips.size,
            containerChildren: this.contentContainer.children.length,
            clipPosition: clipComponent.getContainer().position
        });
    }

    public removeClip(clipId: string) {
        const clip = this.clips.get(clipId);
        if (clip) {
            clip.destroy();
            this.clips.delete(clipId);
        }
    }

    public updateClips(gridSize: number) {
        this.clips.forEach(clip => clip.update(gridSize));
    }

    public destroy() {
        this.clips.forEach(clip => clip.destroy());
        if (this.container) {
            this.container.removeAllListeners();
            this.container.destroy({ children: true });
        }
    }

    public getContainer(): PIXI.Container {
        return this.container;
    }
} 