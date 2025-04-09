import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";
import { TimeDisplay } from "../components/TimeDisplay";
import { BPMDisplay } from "../components/BPMDisplay";

export class TopBar extends BaseComponent {
    public static readonly HEIGHT = 40;
    private background: PIXI.Graphics;
    private projectNameContainer: PIXI.Container;
    private saveButtonContainer: PIXI.Container;
    private timeDisplay: TimeDisplay;
    private bpmDisplay: PIXI.Container;
    private bpmText: PIXI.Text;
    private currentBPM: number = 60;
    private isPlaying: boolean = false;

    constructor(private width: number) {
        super();
        this.init();
    }

    private init() {
        // 創建背景
        this.background = new PIXI.Graphics();
        this.container.addChild(this.background);

        // 創建項目名稱容器
        this.projectNameContainer = new PIXI.Container();
        this.projectNameContainer.position.set(20, 0);
        this.container.addChild(this.projectNameContainer);

        // 創建保存按鈕容器
        this.saveButtonContainer = new PIXI.Container();
        this.saveButtonContainer.position.set(this.width - 120, 0);
        this.container.addChild(this.saveButtonContainer);

        // 創建時間顯示
        this.timeDisplay = new TimeDisplay();
        this.container.addChild(this.timeDisplay.getContainer());

        // 創建 BPM 控制並設置位置
        const bpmControl = this.createBPMControl();
        bpmControl.position.set(200, 5);
        this.container.addChild(bpmControl);

        this.drawBackground();
        this.createProjectName();
        this.createSaveButton();
        this.updateComponentsPosition();
    }

    private createProjectName() {
        const projectName = new PIXI.Text({
            text: "My Project",
            style: {
                fontSize: 16,
                fill: 0xffffff,
                fontFamily: 'Arial'
            }
        });
        projectName.position.set(0, (TopBar.HEIGHT - projectName.height) / 2);
        this.projectNameContainer.addChild(projectName);
    }

    private createSaveButton() {
        const saveButton = this.createButton("Save 🔽", 0x3a3a3a);
        saveButton.position.set(0, (TopBar.HEIGHT - 30) / 2);
        this.saveButtonContainer.addChild(saveButton);

        saveButton.on('pointerdown', () => {
            // 處理保存邏輯
            console.log("Save button clicked");
        });
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
        const bpmContainer = this.bpmDisplay;
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

    private createButton(text: string, color: number): PIXI.Container {
        const button = new PIXI.Container();
        
        // 按鈕背景
        const background = new PIXI.Graphics();
        background
            .fill({ color: color })
            .roundRect(0, 0, 80, 30, 5);
        
        // 按鈕文字
        const buttonText = new PIXI.Text({
            text: text,
            style: {
                fontSize: 12,
                fill: 0xffffff,
                fontFamily: 'Arial'
            }
        });
        buttonText.position.set(
            (80 - buttonText.width) / 2,
            (30 - buttonText.height) / 2
        );

        button.addChild(background, buttonText);
        button.eventMode = 'static';
        button.cursor = 'pointer';

        button.on('pointerover', () => {
            background.fill({ color: 0x4a4a4a });
        });

        button.on('pointerout', () => {
            background.fill({ color: color });
        });

        return button;
    }

    private createBPMControl() {
        this.bpmDisplay = new PIXI.Container();
        
        // 創建背景
        const background = new PIXI.Graphics()
            .fill({ color: 0x2d2d2d })
            .roundRect(0, 0, 100, 30, 4);

        // 創建 BPM 文字
        this.bpmText = new PIXI.Text({
            text: `${this.currentBPM} BPM`,
            style: {
                fontSize: 14,
                fill: 0xffffff,
                fontFamily: 'Arial'
            }
        });

        // 設置文字位置
        this.bpmText.position.set(
            (100 - this.bpmText.width) / 2,
            (30 - this.bpmText.height) / 2
        );

        // 添加到容器
        this.bpmDisplay.addChild(background, this.bpmText);
        
        // 設置互動
        this.bpmDisplay.eventMode = 'static';
        this.bpmDisplay.cursor = 'pointer';

        // 添加點擊事件
        this.bpmDisplay.on('click', this.handleBPMClick.bind(this));
        
        // 添加滾輪事件
        this.bpmDisplay.on('wheel', this.handleBPMWheel.bind(this));

        return this.bpmDisplay;
    }

    private handleBPMClick() {
        // 創建輸入框
        const input = document.createElement('input');
        input.type = 'number';
        input.value = this.currentBPM.toString();
        input.min = '20';
        input.max = '300';
        input.style.position = 'absolute';
        input.style.width = '100px';
        input.style.height = '30px';
        input.style.fontSize = '14px';
        input.style.textAlign = 'center';
        
        // 設置輸入框位置
        const bounds = this.bpmDisplay.getBounds();
        const globalPosition = this.bpmDisplay.getGlobalPosition();
        input.style.left = `${globalPosition.x}px`;
        input.style.top = `${globalPosition.y}px`;

        // 處理完成編輯
        const handleComplete = () => {
            const newBPM = Math.min(300, Math.max(20, parseInt(input.value) || 60));
            this.setBPM(newBPM);
            this.eventManager.emit('daw:bpm:change', { bpm: newBPM });
            document.body.removeChild(input);
        };

        input.onblur = handleComplete;
        input.onkeydown = (e) => {
            if (e.key === 'Enter') handleComplete();
            if (e.key === 'Escape') document.body.removeChild(input);
        };

        document.body.appendChild(input);
        input.focus();
        input.select();
    }

    private handleBPMWheel(event: PIXI.FederatedWheelEvent) {
        event.preventDefault();
        const delta = event.deltaY > 0 ? -1 : 1;
        const newBPM = Math.min(300, Math.max(20, this.currentBPM + delta));
        
        if (newBPM !== this.currentBPM) {
            this.setBPM(newBPM);
            this.eventManager.emit('daw:bpm:change', { bpm: newBPM });
        }
    }

    public update(width: number) {
        this.width = width;
        this.drawBackground();
        this.updateComponentsPosition();
    }

    public setBeat(beat: number) {
        this.timeDisplay.setBeat(beat);
    }

    public setBPM(bpm: number) {
        this.currentBPM = bpm;
        if (this.bpmText) {
            this.bpmText.text = `${bpm} BPM`;
            // 重新置中文字
            this.bpmText.position.set(
                (100 - this.bpmText.width) / 2,
                (30 - this.bpmText.height) / 2
            );
        }
    }

    public destroy() {
        this.timeDisplay.destroy();
        this.saveButtonContainer.removeAllListeners();
        this.container.destroy({ children: true });
    }
} 