import * as PIXI from "pixi.js";
import { BaseComponent } from "../../../core/BaseComponent";
import { DAWConfig } from "../../../../config/DAWConfig";
import { FederatedPointerEvent } from "pixi.js";
import { UIEventBus } from "../../../../events/UIEventBus";
import { BPMDisplayComponent } from "./BPMDisplayComponent";
import { TimeDisplayComponent } from "./TimeDisplayComponent";
import { TransportButton } from "./TransportButton";

/**
 * 頂部工具欄組件
 * 負責管理和渲染 DAW 的頂部控制區域，包括播放控制、時間顯示和 BPM 控制
 */
export class TopBarComponent extends BaseComponent {
    private static readonly BUTTON_MARGIN = 80;
    private static readonly COMPONENT_SPACING = 5;

    private background: PIXI.Graphics;
    private transportControls: PIXI.Container;
    private playButton: TransportButton;
    private stopButton: TransportButton;
    private timeDisplayComponent: TimeDisplayComponent;
    private bpmDisplayComponent: BPMDisplayComponent;
    private isPlaying: boolean = false;

    constructor(id: string) {
        super(id);
    }

    public initialize(): void {
        this.setupComponent();
        this.setupEventHandlers();
    }

    protected setupComponent(): void {
        // 創建並初始化各個子組件
        this.createBackground();
        this.createTransportControls();
        this.createDisplayComponents();
        
        // 添加組件到容器
        this.addComponentsToContainer();
        
        // 更新組件位置
        this.updateComponentsPosition();
    }

    protected setupEventHandlers(): void {
        // 設置播放按鈕事件
        this.playButton.on('click', this.handlePlayClick.bind(this));
        
        // 設置停止按鈕事件
        this.stopButton.on('click', this.handleStopClick.bind(this));

        // 監聽視窗大小變化
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    private createBackground(): void {
        this.background = new PIXI.Graphics();
        this.drawBackground();
    }

    private drawBackground(): void {
        if (!this.background) return;
        
        this.background.clear();
        this.background
            .fill({ color: 0x2a2a2a })
            .rect(0, 0, window.innerWidth, DAWConfig.dimensions.topBarHeight)
            .setStrokeStyle({
                width: 1,
                color: 0x333333
            })
            .stroke()
            .rect(0, DAWConfig.dimensions.topBarHeight - 1, window.innerWidth, 1);
    }

    private createTransportControls(): void {
        // 創建傳輸控制容器
        this.transportControls = new PIXI.Container();
        this.transportControls.position.set(20, 0);

        // 創建播放和停止按鈕
        this.playButton = new TransportButton("播放", 0x3a3a3a);
        this.stopButton = new TransportButton("停止", 0x3a3a3a);

        // 設置按鈕位置
        this.playButton.position.set(0, (DAWConfig.dimensions.topBarHeight - 30) / 2);
        this.stopButton.position.set(TopBarComponent.BUTTON_MARGIN, (DAWConfig.dimensions.topBarHeight - 30) / 2);

        // 添加按鈕到傳輸控制容器
        this.transportControls.addChild(this.playButton.getContainer(), this.stopButton.getContainer());
    }

    private createDisplayComponents(): void {
        // 創建時間顯示組件
        this.timeDisplayComponent = new TimeDisplayComponent('time-display');
        this.timeDisplayComponent.initialize();

        // 創建 BPM 顯示組件
        this.bpmDisplayComponent = new BPMDisplayComponent('bpm-display');
        this.bpmDisplayComponent.initialize();
    }

    private addComponentsToContainer(): void {
        if (!this.container) return;

        // 清理現有的子組件（如果有的話）
        while (this.container.children.length > 0) {
            const child = this.container.children[0];
            this.container.removeChild(child);
            if (child) {
                child.destroy();
            }
        }

        // 確保所有組件都已創建
        if (!this.background || !this.transportControls || 
            !this.timeDisplayComponent || !this.bpmDisplayComponent) {
            console.error('Some components are not initialized');
            return;
        }

        this.container.addChild(
            this.background,
            this.transportControls,
            this.timeDisplayComponent.getContainer(),
            this.bpmDisplayComponent.getContainer()
        );
    }

    private updateComponentsPosition(): void {
        if (!this.timeDisplayComponent || !this.bpmDisplayComponent) return;

        const centerX = window.innerWidth / 2;
        
        // 設置時間顯示組件位置
        const timeContainer = this.timeDisplayComponent.getContainer();
        if (timeContainer) {
            timeContainer.position.set(
                centerX - timeContainer.width - TopBarComponent.COMPONENT_SPACING,
                (DAWConfig.dimensions.topBarHeight - timeContainer.height) / 2
            );
        }

        // 設置 BPM 顯示組件位置
        const bpmContainer = this.bpmDisplayComponent.getContainer();
        if (bpmContainer) {
            bpmContainer.position.set(
                centerX + TopBarComponent.COMPONENT_SPACING,
                (DAWConfig.dimensions.topBarHeight - bpmContainer.height) / 2
            );
        }
    }

    private handlePlayClick(): void {
        this.isPlaying = !this.isPlaying;
        if (this.playButton) {
            this.playButton.setText(this.isPlaying ? "暫停" : "播放");
        }
        
        this.uiEventBus.emit('ui:transport:playback:toggle', {
            isPlaying: this.isPlaying
        });
    }

    private handleStopClick(): void {
        this.isPlaying = false;
        if (this.playButton) {
            this.playButton.setText("播放");
        }
        
        this.uiEventBus.emit('ui:transport:playback:stop', {});
    }

    private handleResize(): void {
        this.drawBackground();
        this.updateComponentsPosition();
    }

    public update(): void {
        this.drawBackground();
        this.updateComponentsPosition();
        if (this.timeDisplayComponent) {
            this.timeDisplayComponent.update();
        }
        if (this.bpmDisplayComponent) {
            this.bpmDisplayComponent.update();
        }
    }

    public destroy(): void {
        // 移除事件監聽器
        window.removeEventListener('resize', this.handleResize.bind(this));
        
        // 銷毀子組件
        if (this.timeDisplayComponent) {
            this.timeDisplayComponent.destroy();
        }
        if (this.bpmDisplayComponent) {
            this.bpmDisplayComponent.destroy();
        }
        if (this.playButton) {
            this.playButton.destroy();
        }
        if (this.stopButton) {
            this.stopButton.destroy();
        }
        
        // 清理容器
        if (this.container) {
            this.container.removeAllListeners();
        }
        super.destroy();
    }
} 