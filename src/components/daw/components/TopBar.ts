import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";
import { TimeDisplay } from "./TimeDisplay";
import { BPMDisplay } from "./BPMDisplay";

export class TopBar extends BaseComponent {
    public static readonly HEIGHT = 40;
    private background: PIXI.Graphics;
    private buttonContainer: PIXI.Container;
    private timeDisplay: TimeDisplay;
    private bpmDisplay: BPMDisplay;

    constructor(private width: number) {
        super();
        this.init();
    }

    private init() {
        // 創建背景
        this.background = new PIXI.Graphics();
        this.container.addChild(this.background);

        // 創建按鈕容器
        this.buttonContainer = new PIXI.Container();
        this.buttonContainer.position.set(20, 0);
        this.container.addChild(this.buttonContainer);

        // 創建時間顯示
        this.timeDisplay = new TimeDisplay();
        this.container.addChild(this.timeDisplay.getContainer());

        // 創建 BPM 顯示
        this.bpmDisplay = new BPMDisplay();
        this.container.addChild(this.bpmDisplay.getContainer());

        this.drawBackground();
        this.createButtons();
        this.updateComponentsPosition();
    }

    private updateComponentsPosition() {
        // 計算中心位置
        const centerX = this.width / 2;
        
        // 設置時間顯示位置
        const timeContainer = this.timeDisplay.getContainer();
        timeContainer.position.set(
            centerX - this.timeDisplay.getWidth() - 5,
            0
        );

        // 設置 BPM 顯示位置
        const bpmContainer = this.bpmDisplay.getContainer();
        bpmContainer.position.set(
            centerX + 5,
            0
        );
    }

    private drawBackground() {
        this.background
            .clear()
            .fill({ color: 0x2a2a2a })
            .rect(0, 0, this.width, TopBar.HEIGHT)
            .setStrokeStyle({
                width: 1,
                color: 0x333333
            })
            .stroke()
            .rect(0, TopBar.HEIGHT - 1, this.width, 1);
    }

    private createButtons() {
        // 播放按鈕
        const playButton = this.createButton("播放", 0x3a3a3a);
        playButton.position.set(0, (TopBar.HEIGHT - 30) / 2);
        this.buttonContainer.addChild(playButton);

        // 停止按鈕
        const stopButton = this.createButton("停止", 0x3a3a3a);
        stopButton.position.set(80, (TopBar.HEIGHT - 30) / 2);
        this.buttonContainer.addChild(stopButton);

        // 設置按鈕事件
        this.setupButtonEvents(playButton, 'play');
        this.setupButtonEvents(stopButton, 'stop');
    }

    private createButton(text: string, color: number): PIXI.Container {
        const button = new PIXI.Container();
        
        // 按鈕背景
        const background = new PIXI.Graphics()
            .fill({ color })
            .roundRect(0, 0, 60, 30, 4);
        
        // 按鈕文字
        const buttonText = new PIXI.Text({
            text,
            style: {
                fontSize: 12,
                fill: 0xffffff,
                fontFamily: 'Arial'
            }
        });
        
        buttonText.position.set(
            (60 - buttonText.width) / 2,
            (30 - buttonText.height) / 2
        );

        button.addChild(background, buttonText);
        button.eventMode = 'static';
        button.cursor = 'pointer';

        return button;
    }

    private setupButtonEvents(button: PIXI.Container, action: 'play' | 'stop') {
        button.on('pointerdown', () => {
            button.scale.set(0.95);
            this.eventManager.emit('daw:transport', { action });
        });

        button.on('pointerup', () => {
            button.scale.set(1);
        });

        button.on('pointerupoutside', () => {
            button.scale.set(1);
        });

        button.on('pointerover', () => {
            const background = button.getChildAt(0) as PIXI.Graphics;
            background.tint = 0x4a4a4a;
        });

        button.on('pointerout', () => {
            const background = button.getChildAt(0) as PIXI.Graphics;
            background.tint = 0xffffff;
        });
    }

    public update(width: number) {
        this.width = width;
        this.drawBackground();
        this.updateComponentsPosition();
    }

    public setTime(milliseconds: number) {
        this.timeDisplay.setTime(milliseconds);
    }

    public setBPM(bpm: number) {
        this.bpmDisplay.setBPM(bpm);
    }

    public destroy() {
        this.timeDisplay.destroy();
        this.bpmDisplay.destroy();
        this.buttonContainer.removeAllListeners();
        this.container.destroy({ children: true });
    }
} 