import * as PIXI from "pixi.js";
import { BaseComponent } from "../../../core/BaseComponent";
import { FederatedPointerEvent } from "pixi.js";

/**
 * 傳輸控制按鈕組件
 * 用於播放、暫停和停止等傳輸控制功能
 */
export class TransportButton extends BaseComponent {
    private static readonly BUTTON_WIDTH = 60;
    private static readonly BUTTON_HEIGHT = 30;
    private static readonly BUTTON_RADIUS = 4;

    private background: PIXI.Graphics;
    private buttonText: PIXI.Text;

    constructor(text: string, color: number) {
        super('transport-button');
        this.createButton(text, color);
    }

    protected setupComponent(): void {
        this.container.eventMode = 'static';
        this.container.cursor = 'pointer';
    }

    private createButton(text: string, color: number): void {
        // 創建按鈕背景
        this.background = new PIXI.Graphics()
            .fill({ color })
            .roundRect(
                0,
                0,
                TransportButton.BUTTON_WIDTH,
                TransportButton.BUTTON_HEIGHT,
                TransportButton.BUTTON_RADIUS
            );

        // 創建按鈕文字
        this.buttonText = new PIXI.Text({
            text,
            style: {
                fontSize: 12,
                fill: 0xffffff,
                fontFamily: 'Arial'
            }
        });

        // 設置文字位置
        this.centerText();

        // 添加到容器
        this.container.addChild(this.background, this.buttonText);
    }

    private centerText(): void {
        if (!this.buttonText) return;

        this.buttonText.position.set(
            (TransportButton.BUTTON_WIDTH - this.buttonText.width) / 2,
            (TransportButton.BUTTON_HEIGHT - this.buttonText.height) / 2
        );
    }

    /**
     * 設置按鈕文字
     * @param text 要顯示的文字
     */
    public setText(text: string): void {
        if (!this.buttonText) return;

        this.buttonText.text = text;
        this.centerText();
    }

    /**
     * 設置按鈕顏色
     * @param color 顏色值（十六進制）
     */
    public setColor(color: number): void {
        if (!this.background) return;

        this.background
            .clear()
            .fill({ color })
            .roundRect(
                0,
                0,
                TransportButton.BUTTON_WIDTH,
                TransportButton.BUTTON_HEIGHT,
                TransportButton.BUTTON_RADIUS
            );
    }

    /**
     * 獲取按鈕容器
     */
    public getContainer(): PIXI.Container {
        return this.container;
    }

    /**
     * 設置按鈕位置
     */
    public get position(): PIXI.Point {
        return this.container.position;
    }

    /**
     * 添加事件監聽器
     */
    public on(event: 'click', handler: (event: FederatedPointerEvent) => void): void {
        this.container.on(event, handler);
    }

    public destroy(): void {
        if (this.background) {
            this.background.destroy();
            this.background = null;
        }
        if (this.buttonText) {
            this.buttonText.destroy();
            this.buttonText = null;
        }
        super.destroy();
    }

    protected setupEventHandlers(): void {
        // 按鈕不需要額外的事件處理
    }

    public update(): void {
        // 按鈕不需要定期更新
    }
} 