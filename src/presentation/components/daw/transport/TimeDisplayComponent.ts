import * as PIXI from "pixi.js";
import { BaseComponent } from "../../../core/BaseComponent";

/**
 * 時間顯示組件
 * 負責顯示當前播放時間
 */
export class TimeDisplayComponent extends BaseComponent {
    private static readonly COMPONENT_WIDTH = 100;
    private static readonly COMPONENT_HEIGHT = 40;

    private background: PIXI.Graphics;
    private timeText: PIXI.Text;
    private currentTime: number = 0;

    constructor(id: string) {
        super(id);
        this.init();
    }

    private init(): void {
        // 創建背景
        this.background = new PIXI.Graphics();
        this.container.addChild(this.background);

        // 創建時間文字
        this.timeText = new PIXI.Text('00:00:00', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xffffff,
            fontWeight: 'bold'
        });

        // 設置文字位置
        this.timeText.anchor.set(0.5);
        this.timeText.position.set(
            TimeDisplayComponent.COMPONENT_WIDTH / 2,
            TimeDisplayComponent.COMPONENT_HEIGHT / 2
        );

        // 繪製背景
        this.drawBackground();

        this.container.addChild(this.timeText);
    }

    private drawBackground(): void {
        this.background
            .clear()
            .fill({ color: 0x2d2d2d })
            .roundRect(
                0,
                0,
                TimeDisplayComponent.COMPONENT_WIDTH,
                TimeDisplayComponent.COMPONENT_HEIGHT,
                4
            );
    }

    private updateTime(time: number): void {
        this.currentTime = time;
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = Math.floor(time % 60);
        
        this.timeText.text = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    public getWidth(): number {
        return TimeDisplayComponent.COMPONENT_WIDTH;
    }

    public update(): void {
        this.drawBackground();
    }

    public destroy(): void {
        this.container.destroy({ children: true });
        super.destroy();
    }

    // 為了與現有系統兼容的方法
    public initialize(): void {
        // 已在構造函數中調用 init()
    }

    protected setupComponent(): void {
        // 已在 init() 中實現
    }

    protected setupEventHandlers(): void {
        // 監聽時間更新事件
        this.onUIEvent('ui:transport:time:update', (data) => {
            this.updateTime(data.time);
        });
    }
} 