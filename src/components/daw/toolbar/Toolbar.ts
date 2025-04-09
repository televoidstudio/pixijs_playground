import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";
import { DAWConfig } from "../../../config/DAWConfig";
import { EventManager } from "../../../events/EventManager";
import { ITrack } from "../../../types/daw";

export class Toolbar extends BaseComponent {
    public static readonly HEIGHT = 40;
    private background: PIXI.Graphics;
    private buttonContainer: PIXI.Container;
    private buttons: Map<string, PIXI.Container> = new Map();
    private trackCount: number = 0;

    constructor(width: number) {
        super();
        this.init(width);
    }

    public getContainer(): PIXI.Container {
        return this.container;
    }

    private init(width: number): void {
        // 創建背景
        this.background = new PIXI.Graphics();
        this.background
            .fill({ color: 0x2a2a2a })
            .rect(0, 0, width, Toolbar.HEIGHT);
        this.container.addChild(this.background);

        // 創建按鈕容器
        this.buttonContainer = new PIXI.Container();
        this.buttonContainer.position.set(10, 5);
        this.container.addChild(this.buttonContainer);

        // 創建按鈕
        this.createButtons();
        this.setupEvents();
    }

    private createButtons(): void {
        const buttonWidth = 100;
        const buttonHeight = 30;
        const buttonSpacing = 20; // 增加按鈕間距
        const startX = 20;
        const startY = -10; // 向上移動 30px (從 20 改為 -10)

        // 創建 +Track 按鈕
        const addTrackButton = this.createButton(
            "+ Track",
            startX,
            startY,
            buttonWidth,
            buttonHeight,
            0x3a3a3a
        );
        this.buttons.set("addTrack", addTrackButton);
        this.buttonContainer.addChild(addTrackButton);

        // 創建其他按鈕
        const buttons = [
            { id: "undo", text: "Undo", x: startX + buttonWidth + buttonSpacing },
            { id: "redo", text: "Redo", x: startX + (buttonWidth + buttonSpacing) * 2 },
            { id: "cut", text: "Cut", x: startX + (buttonWidth + buttonSpacing) * 3 },
            { id: "copy", text: "Copy", x: startX + (buttonWidth + buttonSpacing) * 4 },
            { id: "paste", text: "Paste", x: startX + (buttonWidth + buttonSpacing) * 5 }
        ];

        buttons.forEach(button => {
            const buttonContainer = this.createButton(
                button.text,
                button.x,
                startY,
                buttonWidth,
                buttonHeight,
                0x3a3a3a
            );
            this.buttons.set(button.id, buttonContainer);
            this.buttonContainer.addChild(buttonContainer);
        });
    }

    private createButton(
        text: string,
        x: number,
        y: number,
        width: number,
        height: number,
        color: number
    ): PIXI.Container {
        const button = new PIXI.Container();
        button.position.set(x, y);

        // 創建背景
        const background = new PIXI.Graphics()
            .fill({ color: color })
            .rect(0, 0, width, height);

        // 創建文字
        const buttonText = new PIXI.Text({
            text: text,
            style: {
                fontSize: 14,
                fill: 0xffffff,
                fontFamily: 'Arial'
            }
        });
        buttonText.position.set(
            (width - buttonText.width) / 2,
            (height - buttonText.height) / 2
        );

        button.addChild(background, buttonText);
        button.eventMode = 'static';
        button.cursor = 'pointer';

        // 添加 hover 效果
        const originalColor = color;
        const hoverColor = 0x5a5a5a; // 更亮的顏色
        const pressColor = 0x6a6a6a; // 按下時的顏色

        button.on('pointerover', () => {
            background.clear().fill({ color: hoverColor }).rect(0, 0, width, height);
            buttonText.style.fill = 0xffffff; // 文字顏色變白
        });

        button.on('pointerout', () => {
            background.clear().fill({ color: originalColor }).rect(0, 0, width, height);
            buttonText.style.fill = 0xffffff; // 恢復原始文字顏色
        });

        button.on('pointerdown', () => {
            background.clear().fill({ color: pressColor }).rect(0, 0, width, height);
        });

        button.on('pointerup', () => {
            background.clear().fill({ color: hoverColor }).rect(0, 0, width, height);
        });

        button.on('pointerupoutside', () => {
            background.clear().fill({ color: originalColor }).rect(0, 0, width, height);
        });

        return button;
    }

    private setupEvents(): void {
        // 設置 +Track 按鈕事件
        const addTrackButton = this.buttons.get("addTrack");
        if (addTrackButton) {
            addTrackButton.on('pointerdown', () => {
                this.trackCount++;
                const newTrack: ITrack = {
                    id: `track-${this.trackCount}`,
                    name: `Track ${this.trackCount}`,
                    volume: 1,
                    isMuted: false,
                    isSolo: false,
                    color: 0x3a3a3a
                };
                this.eventManager.emit('daw:track:add', { track: newTrack });
            });
        }

        // 設置其他按鈕事件
        const buttonEvents = {
            undo: () => this.eventManager.emit('daw:tool:changed', { tool: 'undo' }),
            redo: () => this.eventManager.emit('daw:tool:changed', { tool: 'redo' }),
            cut: () => this.eventManager.emit('clip:cut', { clipId: '' }),
            copy: () => this.eventManager.emit('clip:copy', { clipId: '' }),
            paste: () => this.eventManager.emit('clip:added', { clip: null })
        };

        Object.entries(buttonEvents).forEach(([id, handler]) => {
            const button = this.buttons.get(id);
            if (button) {
                button.on('pointerdown', handler);
            }
        });
    }

    public update(): void {
        // 更新工具欄
    }

    public destroy(): void {
        this.buttons.forEach(button => {
            button.destroy({ children: true });
        });
        this.buttons.clear();
        this.container.destroy({ children: true });
    }
} 