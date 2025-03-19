import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";

export class TimeDisplay extends BaseComponent {
    private timeText: PIXI.Text;
    private background: PIXI.Graphics;
    private currentTime: number = 0;

    constructor() {
        super();
        this.init();
    }

    private init() {
        // 創建背景
        this.background = new PIXI.Graphics();
        this.container.addChild(this.background);

        // 創建時間文字
        this.timeText = new PIXI.Text({
            text: "00:00:000",
            style: {
                fontSize: 16,
                fill: 0xffffff,
                fontFamily: 'Arial',
                fontWeight: 'bold'
            }
        });

        // 設置文字位置
        this.timeText.anchor.set(0.5);
        this.timeText.position.set(50, 20);

        // 繪製背景
        this.drawBackground();

        this.container.addChild(this.timeText);
    }

    private drawBackground() {
        this.background
            .clear()
            .fill({ color: 0x2d2d2d })
            .roundRect(0, 0, 100, 40, 4);
    }

    public setTime(milliseconds: number) {
        this.currentTime = milliseconds;
        
        // 計算分鐘、秒和毫秒
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const ms = Math.floor((milliseconds % 1000) / 10); // 只顯示前兩位

        // 格式化時間顯示
        this.timeText.text = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }

    public getWidth(): number {
        return 100;
    }

    public destroy() {
        this.container.destroy({ children: true });
    }

    public update() {
        // TimeDisplay 不需要每幀更新
    }
} 