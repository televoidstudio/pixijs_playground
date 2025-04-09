import * as PIXI from 'pixi.js';
import { BaseComponent } from '../core/BaseComponent';
import { MIDIEditor } from './MidiEditor';
import { IClip } from '../../../types/daw';
import { DAWConfig } from "../../../config/DAWConfig";
import { EventManager } from "../../../events/EventManager";
import { IFloatingWindow } from "../../../types/IFloatingWindow";
import { IWindowPosition, IWindowSize } from "../../../types/window";

export default class MidiEditorWindow extends BaseComponent implements IFloatingWindow {
    public id: string;
    public position: IWindowPosition;
    public size: IWindowSize;
    public titleHeight: number;
    public minWidth: number;
    public minHeight: number;
    public minimized: boolean = false;
    public declare container: PIXI.Container;
    protected app: PIXI.Application;

    private background: PIXI.Graphics;
    private titleBar: PIXI.Graphics;
    private closeButton: PIXI.Container;
    private minimizeButton: PIXI.Container;
    private contentContainer: PIXI.Container;
    private isDragging: boolean = false;
    private dragStart: IWindowPosition = { x: 0, y: 0 };
    private isResizing: boolean = false;
    private resizeStart: IWindowPosition = { x: 0, y: 0 };
    private originalSize: IWindowSize = { width: 0, height: 0 };

    private midiEditor: MIDIEditor;

    constructor(app: PIXI.Application) {
        super();
        this.app = app;
        this.id = 'midi-editor-window';
        this.position = { x: 100, y: 100 };
        this.size = { width: 800, height: 600 };
        this.titleHeight = 30;
        this.minWidth = 400;
        this.minHeight = 300;

        this.init();
    }

    private init(): void {
        // 創建背景
        this.background = new PIXI.Graphics();
        this.background
            .fill({ color: 0x2a2a2a })
            .rect(0, 0, this.size.width, this.size.height);
        
        // 創建標題欄
        this.titleBar = new PIXI.Graphics();
        this.container.addChild(this.titleBar);

        // 創建內容容器
        this.contentContainer = new PIXI.Container();
        this.contentContainer.position.set(0, this.titleHeight);
        this.container.addChild(this.contentContainer);

        // 添加到主容器
        this.container.addChild(this.background);
        
        // 創建 MIDI 編輯器
        this.midiEditor = new MIDIEditor();
        this.contentContainer.addChild(this.midiEditor.getContainer());
        
        // 創建按鈕
        this.createButtons();

        // 繪製視窗
        this.draw();

        // 設置事件
        this.setupEvents();
    }

    private createButtons(): void {
        // 關閉按鈕
        this.closeButton = this.createButton('×', 0xff5555);
        this.closeButton.position.set(this.size.width - 30, 0);
        this.closeButton.on('pointerdown', () => this.close());
        this.container.addChild(this.closeButton);

        // 最小化按鈕
        this.minimizeButton = this.createButton('−', 0x3a3a3a);
        this.minimizeButton.position.set(this.size.width - 60, 0);
        this.minimizeButton.on('pointerdown', () => this.toggleMinimize());
        this.container.addChild(this.minimizeButton);
    }

    private createButton(text: string, color: number): PIXI.Container {
        const button = new PIXI.Container();
        const background = new PIXI.Graphics()
            .fill({ color: color })
            .rect(0, 0, 30, this.titleHeight);
        
        const buttonText = new PIXI.Text({
            text: text,
            style: {
                fontSize: 20,
                fill: 0xffffff,
                fontFamily: 'Arial'
            }
        });
        buttonText.position.set(
            (30 - buttonText.width) / 2,
            (this.titleHeight - buttonText.height) / 2
        );

        button.addChild(background, buttonText);
        button.eventMode = 'static';
        button.cursor = 'pointer';

        // 添加 hover 效果
        const originalColor = color;
        const hoverColor = color === 0xff5555 ? 0xff7777 : 0x4a4a4a;

        button.on('pointerover', () => {
            background.clear().fill({ color: hoverColor }).rect(0, 0, 30, this.titleHeight);
        });

        button.on('pointerout', () => {
            background.clear().fill({ color: originalColor }).rect(0, 0, 30, this.titleHeight);
        });

        return button;
    }

    public draw(): void {
        // 繪製標題欄
        this.titleBar
            .clear()
            .fill({ color: 0x3a3a3a })
            .rect(0, 0, this.size.width, this.titleHeight);

        // 更新背景大小
        this.background
            .clear()
            .fill({ color: 0x2a2a2a })
            .rect(0, 0, this.size.width, this.size.height);

        // 更新內容容器大小
        this.contentContainer.position.set(0, this.titleHeight);
        this.midiEditor.getContainer().position.set(0, 0);
    }

    private setupEvents(): void {
        // 設置拖動事件
        this.titleBar.eventMode = 'static';
        this.titleBar.cursor = 'move';
        this.titleBar.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            this.isDragging = true;
            this.dragStart = { x: event.global.x - this.position.x, y: event.global.y - this.position.y };
        });

        this.app.stage.on('pointermove', (event: PIXI.FederatedPointerEvent) => {
            if (this.isDragging) {
                this.position = {
                    x: event.global.x - this.dragStart.x,
                    y: event.global.y - this.dragStart.y
                };
                this.container.position.set(this.position.x, this.position.y);
            }
        });

        this.app.stage.on('pointerup', () => {
            this.isDragging = false;
        });

        // 設置調整大小事件
        const resizeHandle = new PIXI.Graphics()
            .fill({ color: 0x3a3a3a })
            .rect(this.size.width - 10, this.size.height - 10, 10, 10);
        this.container.addChild(resizeHandle);

        resizeHandle.eventMode = 'static';
        resizeHandle.cursor = 'nwse-resize';
        resizeHandle.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            this.isResizing = true;
            this.resizeStart = { x: event.global.x, y: event.global.y };
            this.originalSize = { ...this.size };
        });

        this.app.stage.on('pointermove', (event: PIXI.FederatedPointerEvent) => {
            if (this.isResizing) {
                const deltaX = event.global.x - this.resizeStart.x;
                const deltaY = event.global.y - this.resizeStart.y;
                
                this.size = {
                    width: Math.max(this.minWidth, this.originalSize.width + deltaX),
                    height: Math.max(this.minHeight, this.originalSize.height + deltaY)
                };
                
                this.draw();
            }
        });

        this.app.stage.on('pointerup', () => {
            this.isResizing = false;
        });
    }

    public update(): void {
        this.draw();
    }

    public toggleMinimize(): void {
        this.minimized = !this.minimized;
        if (this.minimized) {
            this.contentContainer.visible = false;
            this.size.height = this.titleHeight;
        } else {
            this.contentContainer.visible = true;
            this.size.height = 600;
        }
        this.draw();
    }

    public close(): void {
        this.eventManager.emit('daw:window:remove', { window: this.container });
    }

    public destroy(): void {
        this.container.destroy({ children: true });
    }

    // IFloatingWindow 介面實現
    public getContentContainer(): PIXI.Container {
        return this.contentContainer;
    }

    public enableDrag(): void {
        this.titleBar.eventMode = 'static';
        this.titleBar.cursor = 'move';
    }

    public disableDrag(): void {
        this.titleBar.eventMode = 'none';
        this.titleBar.cursor = 'default';
    }

    public enableResize(): void {
        const resizeHandle = this.container.getChildByName('resizeHandle') as PIXI.Graphics;
        if (resizeHandle) {
            resizeHandle.eventMode = 'static';
            resizeHandle.cursor = 'nwse-resize';
        }
    }

    public disableResize(): void {
        const resizeHandle = this.container.getChildByName('resizeHandle') as PIXI.Graphics;
        if (resizeHandle) {
            resizeHandle.eventMode = 'none';
            resizeHandle.cursor = 'default';
        }
    }

    public enableClose(): void {
        this.closeButton.eventMode = 'static';
        this.closeButton.cursor = 'pointer';
    }

    public disableClose(): void {
        this.closeButton.eventMode = 'none';
        this.closeButton.cursor = 'default';
    }

    public getMidiEditor(): MIDIEditor {
        return this.midiEditor;
    }

    public enableMinimize(): void {
        this.minimizeButton.eventMode = 'static';
        this.minimizeButton.cursor = 'pointer';
    }

    public disableMinimize(): void {
        this.minimizeButton.eventMode = 'none';
        this.minimizeButton.cursor = 'default';
    }

    public bringToFront(): void {
        if (this.container.parent) {
            this.container.parent.addChild(this.container);
        }
    }
} 