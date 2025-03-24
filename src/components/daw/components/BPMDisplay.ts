import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";

export class BPMDisplay extends BaseComponent {
    private bpmText: PIXI.Text;
    private background: PIXI.Graphics;
    private currentBPM: number = 120;

    constructor() {
        super();
        this.init();
    }

    private init() {
        // 創建背景
        this.background = new PIXI.Graphics();
        this.container.addChild(this.background);

        // 創建 BPM 文字
        this.bpmText = new PIXI.Text({
            text: "120 BPM",
            style: {
                fontSize: 16,
                fill: 0xffffff,
                fontFamily: 'Arial',
                fontWeight: 'bold'
            }
        });

        // 設置文字位置
        this.bpmText.anchor.set(0.5);
        this.bpmText.position.set(45, 20);

        // 繪製背景
        this.drawBackground();

        this.container.addChild(this.bpmText);

        // 設置互動
        this.container.eventMode = 'static';
        this.container.cursor = 'pointer';
        this.container.on('click', this.onClick.bind(this));
    }

    private drawBackground() {
        this.background
            .clear()
            .fill({ color: 0x2d2d2d })
            .roundRect(0, 0, 90, 40, 4);
    }

    private onClick() {
        // 發出事件通知需要更改 BPM
        this.eventManager.emit('daw:bpm:change', { bpm: this.currentBPM });
    }

    public setBPM(bpm: number) {
        this.currentBPM = bpm;
        this.bpmText.text = `${bpm} BPM`;
    }

    public getWidth(): number {
        return 90;
    }

    public destroy() {
        this.container.destroy({ children: true });
    }

    public update(): void {
        this.drawBackground();
    }
} 