import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";
import { ITrack } from "../../../types/daw";

export class TrackControls extends BaseComponent {
    private background: PIXI.Graphics;
    private dragHandle: PIXI.Graphics;
    private nameText: PIXI.Text;
    private isDragging: boolean = false;
    private dragStartY: number = 0;
    private originalY: number = 0;

    static readonly WIDTH = 200;
    static readonly HEIGHT = 80;
    static readonly HANDLE_WIDTH = 30;

    constructor(private track: ITrack) {
        super();
        this.init();
    }

    private init() {
        // 創建背景
        this.background = new PIXI.Graphics();
        this.createBackground();

        // 創建拖曳把手
        this.dragHandle = new PIXI.Graphics();
        this.createDragHandle();

        // 創建軌道名稱
        this.createTrackName();

        // 設置事件
        this.setupDragEvents();
    }

    private createBackground() {
        this.background
            .fill({ color: 0x333333 })
            .rect(TrackControls.HANDLE_WIDTH, 0, 
                  TrackControls.WIDTH - TrackControls.HANDLE_WIDTH, 
                  TrackControls.HEIGHT);
        
        this.container.addChild(this.background);
    }

    private createDragHandle() {
        // 繪製拖動把手背景
        this.dragHandle
            .fill({ color: 0x444444 })
            .rect(0, 0, TrackControls.HANDLE_WIDTH, TrackControls.HEIGHT);
            
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
        this.dragHandle
            .on('pointerover', () => this.dragHandle.tint = 0x666666)
            .on('pointerout', () => this.dragHandle.tint = 0xFFFFFF);

        this.container.addChild(this.dragHandle);
    }

    private createTrackName() {
        this.nameText = new PIXI.Text({
            text: this.track.name,
            style: {
                fontSize: 14,
                fill: 0xffffff,
                fontFamily: 'Arial'
            }
        });
        this.nameText.position.set(40, 30);
        this.nameText.eventMode = 'static';
        this.nameText.cursor = 'pointer';

        // 添加點擊事件
        this.nameText.on('click', this.handleNameClick.bind(this));

        this.container.addChild(this.nameText);
    }

    private setupDragEvents() {
        this.dragHandle.eventMode = 'static';
        this.dragHandle.cursor = 'grab';

        this.dragHandle.on('pointerdown', this.onDragStart.bind(this));
        this.dragHandle.on('globalpointermove', this.onDragMove.bind(this));
        this.dragHandle.on('pointerup', this.onDragEnd.bind(this));
        this.dragHandle.on('pointerupoutside', this.onDragEnd.bind(this));
    }

    private onDragStart(event: PIXI.FederatedPointerEvent) {
        this.isDragging = true;
        this.dragStartY = event.global.y;
        this.originalY = this.container.parent.y;
        
        this.dragHandle.cursor = 'grabbing';
        
        this.eventManager.emit('track:dragstart', { 
            trackId: this.track.id,
            y: event.global.y
        });
    }

    private onDragMove(event: PIXI.FederatedPointerEvent) {
        if (!this.isDragging) return;

        this.eventManager.emit('track:drag', {
            trackId: this.track.id,
            y: event.global.y
        });
    }

    private onDragEnd() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.dragHandle.cursor = 'grab';
        
        this.eventManager.emit('track:dragend', {
            trackId: this.track.id,
            y: this.container.parent.y
        });
    }

    private handleNameClick() {
        // 創建輸入框
        const input = document.createElement('input');
        input.type = 'text';
        input.value = this.track.name;
        input.style.position = 'absolute';
        input.style.width = '150px';
        input.style.height = '24px';
        input.style.fontSize = '14px';
        input.style.backgroundColor = '#2d2d2d';
        input.style.color = '#ffffff';
        input.style.border = '1px solid #444';
        input.style.borderRadius = '4px';
        input.style.padding = '0 8px';

        // 設置輸入框位置
        const globalPosition = this.nameText.getGlobalPosition();
        input.style.left = `${globalPosition.x}px`;
        input.style.top = `${globalPosition.y}px`;

        // 處理完成編輯
        const handleComplete = () => {
            const newName = input.value.trim() || this.track.name;
            this.setName(newName);
            this.eventManager.emit('track:rename', {
                trackId: this.track.id,
                name: newName
            });
            document.body.removeChild(input);
        };

        input.onblur = handleComplete;
        input.onkeydown = (e) => {
            if (e.key === 'Enter') handleComplete();
            if (e.key === 'Escape') document.body.removeChild(input);
        };

        document.body.appendChild(input);
        input.focus();
        input.select();
    }

    public setName(name: string) {
        this.track.name = name;
        this.nameText.text = name;
    }

    public setY(y: number) {
        this.container.y = y;
    }

    public getY(): number {
        return this.container.y;
    }

    public destroy() {
        this.container.removeAllListeners();
        this.container.destroy({ children: true });
    }

    /**
     * 更新軌道名稱
     */
    public updateName(name: string): void {
        if (this.nameText) {
            this.nameText.text = name;
        }
    }
} 