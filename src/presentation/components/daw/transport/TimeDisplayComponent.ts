import * as PIXI from "pixi.js";
import { BaseComponent } from "../../../core/BaseComponent";
import { defaultDAWConfig } from "../../../../config/dawConfig";

/**
 * 時間顯示組件
 * 負責顯示當前播放時間
 */
export class TimeDisplayComponent extends BaseComponent {
    private background: PIXI.Graphics;
    private timeText: PIXI.Text;
    private currentTime: number = 0;

    constructor(id: string) {
        super(id);
    }

    protected setupComponent(): void {
        // 創建背景
        this.background = new PIXI.Graphics();
        this.createBackground();

        // 創建時間文字
        this.timeText = new PIXI.Text('00:00:00', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xffffff
        });
        this.timeText.x = 10;
        this.timeText.y = (defaultDAWConfig.dimensions.topBarHeight - this.timeText.height) / 2;

        // 添加元素到容器
        this.container.addChild(this.background);
        this.container.addChild(this.timeText);
    }

    protected setupEventHandlers(): void {
        // 監聽時間更新事件
        this.onUIEvent('ui:transport:time:update', (data) => {
            this.updateTime(data.time);
        });
    }

    private createBackground(): void {
        this.background.clear();
        this.background
            .fill({ color: 0x1a1a1a })
            .rect(0, 0, 100, defaultDAWConfig.dimensions.topBarHeight);
    }

    private updateTime(time: number): void {
        this.currentTime = time;
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = Math.floor(time % 60);
        
        this.timeText.text = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    public update(): void {
        this.createBackground();
    }
} 