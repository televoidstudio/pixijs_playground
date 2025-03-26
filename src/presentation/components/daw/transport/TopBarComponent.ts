import * as PIXI from "pixi.js";
import { BaseComponent } from "../../../core/BaseComponent";
import { defaultDAWConfig } from "../../../../config/dawConfig";
import { FederatedPointerEvent } from "pixi.js";

/**
 * 頂部工具欄組件
 * 負責管理和渲染 DAW 的頂部控制區域
 */
export class TopBarComponent extends BaseComponent {
    private background: PIXI.Graphics;
    private playButton: PIXI.Graphics;
    private stopButton: PIXI.Graphics;
    private isPlaying: boolean = false;

    constructor(id: string) {
        super(id);
    }

    protected setupComponent(): void {
        // 創建背景
        this.background = new PIXI.Graphics();
        this.createBackground();

        // 創建控制按鈕
        this.playButton = new PIXI.Graphics();
        this.stopButton = new PIXI.Graphics();
        this.createPlayButton();
        this.createStopButton();

        // 添加元素到容器
        this.container.addChild(this.background);
        this.container.addChild(this.playButton);
        this.container.addChild(this.stopButton);
    }

    protected setupEventHandlers(): void {
        // 設置播放按鈕事件
        this.playButton.eventMode = 'static';
        this.playButton.cursor = 'pointer';
        this.playButton.on('pointerdown', this.handlePlayClick.bind(this));

        // 設置停止按鈕事件
        this.stopButton.eventMode = 'static';
        this.stopButton.cursor = 'pointer';
        this.stopButton.on('pointerdown', this.handleStopClick.bind(this));
    }

    private createBackground(): void {
        this.background.clear();
        this.background
            .fill({ color: 0x2a2a2a })
            .rect(0, 0, defaultDAWConfig.width, defaultDAWConfig.topBarHeight);
    }

    private createPlayButton(): void {
        this.playButton.clear();
        this.playButton
            .fill({ color: 0x4CAF50 })
            .circle(30, 30, 20)
            .fill({ color: 0xffffff })
            .drawPolygon([
                new PIXI.Point(25, 20),
                new PIXI.Point(25, 40),
                new PIXI.Point(45, 30)
            ]);
    }

    private createStopButton(): void {
        this.stopButton.clear();
        this.stopButton
            .fill({ color: 0xf44336 })
            .circle(80, 30, 20)
            .fill({ color: 0xffffff })
            .rect(70, 20, 20, 20);
    }

    private handlePlayClick(event: FederatedPointerEvent): void {
        this.isPlaying = !this.isPlaying;
        this.playButton.clear();
        
        if (this.isPlaying) {
            this.playButton
                .fill({ color: 0x4CAF50 })
                .circle(30, 30, 20)
                .fill({ color: 0xffffff })
                .rect(25, 20, 10, 20);
        } else {
            this.playButton
                .fill({ color: 0x4CAF50 })
                .circle(30, 30, 20)
                .fill({ color: 0xffffff })
                .drawPolygon([
                    new PIXI.Point(25, 20),
                    new PIXI.Point(25, 40),
                    new PIXI.Point(45, 30)
                ]);
        }

        this.emitUIEvent('ui:transport:playback:toggle', {
            isPlaying: this.isPlaying
        });
    }

    private handleStopClick(event: FederatedPointerEvent): void {
        this.isPlaying = false;
        this.playButton.clear();
        this.playButton
            .fill({ color: 0x4CAF50 })
            .circle(30, 30, 20)
            .fill({ color: 0xffffff })
            .drawPolygon([
                new PIXI.Point(25, 20),
                new PIXI.Point(25, 40),
                new PIXI.Point(45, 30)
            ]);

        this.emitUIEvent('ui:transport:playback:stop', {});
    }

    public update(): void {
        this.createBackground();
    }
} 