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
            
        // 繪製把手圖示（三條線）
        this.dragHandle
            .fill({ color: 0x666666 })
            .rect(8, 32, 14, 2)
            .rect(8, 37, 14, 2)
            .rect(8, 42, 14, 2);

        // 設置把手互動屬性
        this.dragHandle.eventMode = 'static';
        this.dragHandle.cursor = 'grab';
        
        // 添加懸停效果
        this.dragHandle
            .on('pointerover', () => {
                if (!this.isDragging) {
                    this.dragHandle.tint = 0x666666;
                    // 添加視覺提示
                    this.dragHandle
                        .fill({ color: 0x888888 })
                        .rect(8, 32, 14, 2)
                        .rect(8, 37, 14, 2)
                        .rect(8, 42, 14, 2);
                }
            })
            .on('pointerout', () => {
                if (!this.isDragging) {
                    this.dragHandle.tint = 0xFFFFFF;
                    // 恢復原始外觀
                    this.dragHandle
                        .fill({ color: 0x666666 })
                        .rect(8, 32, 14, 2)
                        .rect(8, 37, 14, 2)
                        .rect(8, 42, 14, 2);
                }
            });

        this.container.addChild(this.dragHandle);
    }

    private createTrackName() {
        this.nameText = new PIXI.Text({
            text: this.track.name,
            style: {
                fontSize: 14 * (window.devicePixelRatio || 1),
                fill: 0xffffff,
                fontFamily: 'Arial',
                align: 'left'
            }
        });

        // 調整位置，考慮縮放因素
        this.nameText.scale.set(1 / (window.devicePixelRatio || 1));
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

        let lastEmitTime = 0;
        const throttleInterval = 16; // 約60fps
        let lastY = 0;  // 記錄最後的 Y 位置

        const handleDragMove = (event: PointerEvent) => {
            if (!this.isDragging) return;
            
            const currentTime = performance.now();
            if (currentTime - lastEmitTime >= throttleInterval) {
                // 使用 clientY 替代 global.y
                const y = event.clientY;
                lastY = y;
                
                this.eventManager.emit('track:drag', {
                    trackId: this.track.id,
                    y: y
                });
                lastEmitTime = currentTime;
            }
        };

        const handleDragEnd = () => {
            if (!this.isDragging) return;
            
            this.isDragging = false;
            this.dragHandle.cursor = 'grab';
            
            // 恢復原始外觀
            this.dragHandle.tint = 0xFFFFFF;
            this.dragHandle
                .fill({ color: 0x666666 })
                .rect(8, 32, 14, 2)
                .rect(8, 37, 14, 2)
                .rect(8, 42, 14, 2);
            
            // 移除全局事件監聽
            window.removeEventListener('pointermove', handleDragMove);
            window.removeEventListener('pointerup', handleDragEnd);
            
            this.eventManager.emit('track:dragend', {
                trackId: this.track.id,
                y: lastY  // 使用最後記錄的 Y 位置
            });
        };
        
        this.dragHandle.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            this.isDragging = true;
            this.dragStartY = event.global.y;
            this.originalY = this.container.parent.y;
            lastY = event.global.y;  // 初始化最後的 Y 位置
            
            this.dragHandle.cursor = 'grabbing';
            
            // 改變拖動時的外觀
            this.dragHandle.tint = 0x888888;
            this.dragHandle
                .fill({ color: 0x888888 })
                .rect(8, 32, 14, 2)
                .rect(8, 37, 14, 2)
                .rect(8, 42, 14, 2);
            
            // 添加全局事件監聽
            window.addEventListener('pointermove', handleDragMove);
            window.addEventListener('pointerup', handleDragEnd);
            
            this.eventManager.emit('track:dragstart', { 
                trackId: this.track.id,
                y: event.global.y
            });
        });
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
            this.track.name = name;
            this.nameText.text = name;
            this.nameText.style.fontSize = 14 * (window.devicePixelRatio || 1);
            this.nameText.scale.set(1 / (window.devicePixelRatio || 1));
        }
    }

    public update(): void {
        // 更新文字的縮放
        if (this.nameText) {
            this.nameText.style.fontSize = 14 * (window.devicePixelRatio || 1);
            this.nameText.scale.set(1 / (window.devicePixelRatio || 1));
        }
        this.createBackground();
        this.createDragHandle();
    }
} 