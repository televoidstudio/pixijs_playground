import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";
import { EventManager } from "../../../events/EventManager";

export class TransportBar extends BaseComponent {
    public static readonly HEIGHT = 40;
    private background: PIXI.Graphics;
    private buttonContainer: PIXI.Container;
    private timeDisplay: PIXI.Text;
    private isPlaying: boolean = false;
    private isRecording: boolean = false;
    private currentTime: number = 0;
    private bpm: number = 120;
    private bpmText: PIXI.Text;

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
        this.buttonContainer.position.set(20, 5);
        this.container.addChild(this.buttonContainer);

        // 創建時間顯示
        this.timeDisplay = new PIXI.Text({
            text: "00:00.0",
            style: {
                fontSize: 14,
                fill: 0xffffff,
                fontFamily: 'Arial'
            }
        });
        this.timeDisplay.position.set(this.width / 2 - 50, 10);
        this.container.addChild(this.timeDisplay);

        // 創建 BPM 顯示
        this.bpmText = new PIXI.Text({
            text: `${this.bpm} BPM`,
            style: {
                fontSize: 14,
                fill: 0xffffff,
                fontFamily: 'Arial'
            }
        });
        this.bpmText.position.set(this.width - 100, 10);
        this.container.addChild(this.bpmText);

        this.drawBackground();
        this.createButtons();
    }

    private drawBackground() {
        this.background
            .clear()
            .fill({ color: 0x2a2a2a })
            .rect(0, 0, this.width, TransportBar.HEIGHT)
            .setStrokeStyle({
                width: 1,
                color: 0x333333
            })
            .stroke()
            .rect(0, TransportBar.HEIGHT - 1, this.width, 1);
    }

    private createButtons() {
        // 錄製按鈕
        const recordButton = this.createButton("⏺", 0x3a3a3a);
        recordButton.position.set(0, 0);
        this.buttonContainer.addChild(recordButton);

        // 播放/暫停按鈕
        const playButton = this.createButton("▶", 0x3a3a3a);
        playButton.position.set(50, 0);
        this.buttonContainer.addChild(playButton);

        // 停止按鈕
        const stopButton = this.createButton("■", 0x3a3a3a);
        stopButton.position.set(100, 0);
        this.buttonContainer.addChild(stopButton);

        // 設置按鈕事件
        recordButton.on('pointerdown', () => {
            this.isRecording = !this.isRecording;
            const buttonText = recordButton.getChildAt(1) as PIXI.Text;
            buttonText.text = this.isRecording ? "⏹" : "⏺";
            buttonText.style.fill = this.isRecording ? 0xff0000 : 0xffffff;
            
            this.eventManager.emit('daw:transport', {
                action: this.isRecording ? 'play' : 'stop'
            });
        });

        playButton.on('pointerdown', () => {
            this.isPlaying = !this.isPlaying;
            const buttonText = playButton.getChildAt(1) as PIXI.Text;
            buttonText.text = this.isPlaying ? "⏸" : "▶";
            
            this.eventManager.emit('daw:transport', {
                action: this.isPlaying ? 'play' : 'pause'
            });
        });

        stopButton.on('pointerdown', () => {
            this.isPlaying = false;
            this.isRecording = false;
            const playButtonText = playButton.getChildAt(1) as PIXI.Text;
            playButtonText.text = "▶";
            const recordButtonText = recordButton.getChildAt(1) as PIXI.Text;
            recordButtonText.text = "⏺";
            recordButtonText.style.fill = 0xffffff;
            
            this.eventManager.emit('daw:transport', {
                action: 'stop'
            });
        });
    }

    private createButton(text: string, color: number): PIXI.Container {
        const button = new PIXI.Container();
        
        // 按鈕背景
        const background = new PIXI.Graphics();
        background
            .fill({ color: color })
            .roundRect(0, 0, 40, 30, 5);
        
        // 按鈕文字
        const buttonText = new PIXI.Text({
            text: text,
            style: {
                fontSize: 16,
                fill: 0xffffff,
                fontFamily: 'Arial'
            }
        });
        buttonText.position.set(
            (40 - buttonText.width) / 2,
            (30 - buttonText.height) / 2
        );

        button.addChild(background, buttonText);
        button.eventMode = 'static';
        button.cursor = 'pointer';

        // 保存原始顏色
        const originalColor = color;

        button.on('pointerover', () => {
            background.clear();
            background
                .fill({ color: 0x4a4a4a })
                .roundRect(0, 0, 40, 30, 5);
        });

        button.on('pointerout', () => {
            background.clear();
            background
                .fill({ color: originalColor })
                .roundRect(0, 0, 40, 30, 5);
        });

        return button;
    }

    public setTime(time: number): void {
        this.currentTime = time;
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        const milliseconds = Math.floor((time % 1) * 10);
        
        this.timeDisplay.text = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
    }

    public setBPM(bpm: number): void {
        this.bpm = bpm;
        this.bpmText.text = `${bpm} BPM`;
    }

    public update(width: number): void {
        this.width = width;
        this.drawBackground();
        
        // 更新時間顯示位置
        this.timeDisplay.position.set(this.width / 2 - 50, 10);
        
        // 更新 BPM 顯示位置
        this.bpmText.position.set(this.width - 100, 10);
    }

    public destroy(): void {
        this.container.destroy({ children: true });
    }
} 