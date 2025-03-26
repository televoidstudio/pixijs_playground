import * as PIXI from "pixi.js";
import { BaseComponent } from "../../../core/BaseComponent";
import { defaultDAWConfig } from "../../../../config/dawConfig";

/**
 * BPM 顯示組件
 * 負責顯示當前 BPM 值
 */
export class BPMDisplayComponent extends BaseComponent {
    private background: PIXI.Graphics;
    private bpmText: PIXI.Text;
    private currentBPM: number = 120;

    constructor(id: string) {
        super(id);
    }

    protected setupComponent(): void {
        // 創建背景
        this.background = new PIXI.Graphics();
        this.createBackground();

        // 創建 BPM 文字
        this.bpmText = new PIXI.Text('120 BPM', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xffffff
        });
        this.bpmText.x = 10;
        this.bpmText.y = (defaultDAWConfig.dimensions.topBarHeight - this.bpmText.height) / 2;

        // 添加元素到容器
        this.container.addChild(this.background);
        this.container.addChild(this.bpmText);
    }

    protected setupEventHandlers(): void {
        // 監聽 BPM 更新事件
        this.onUIEvent('ui:transport:bpm:update', (data) => {
            this.updateBPM(data.bpm);
        });
    }

    private createBackground(): void {
        this.background.clear();
        this.background
            .fill({ color: 0x1a1a1a })
            .rect(0, 0, 80, defaultDAWConfig.dimensions.topBarHeight);
    }

    private updateBPM(bpm: number): void {
        this.currentBPM = bpm;
        this.bpmText.text = `${bpm} BPM`;
    }

    public update(): void {
        this.createBackground();
    }
} 