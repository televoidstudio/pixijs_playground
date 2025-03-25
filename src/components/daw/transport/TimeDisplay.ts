import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";

export class TimeDisplay extends BaseComponent {
    private timeText: PIXI.Text;
    private background: PIXI.Graphics;
    private currentBeat: number = 0;

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
            text: "1.1.00",  // 預設顯示格式：小節.拍.細分
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

        this.drawBackground();
        this.container.addChild(this.timeText);
    }

    private drawBackground() {
        this.background
            .clear()
            .fill({ color: 0x2d2d2d })
            .roundRect(0, 0, 100, 40, 4);
    }

    public setBeat(beat: number) {
        this.currentBeat = beat;
        
        // 計算小節數（每4拍一小節）
        const bar = Math.floor(beat / 4) + 1;
        
        // 計算小節內的拍數（1-4）
        const beatInBar = Math.floor(beat % 4) + 1;
        
        // 計算細分（保留2位小數）
        const ticks = Math.floor((beat % 1) * 100);
        
        // 格式化顯示
        this.timeText.text = `${bar}.${beatInBar}.${ticks.toString().padStart(2, '0')}`;
    }

    public getWidth(): number {
        return 100;
    }

    public update() {
        // 實現 BaseComponent 的抽象方法
    }

    public destroy() {
        this.container.destroy({ children: true });
    }
} 