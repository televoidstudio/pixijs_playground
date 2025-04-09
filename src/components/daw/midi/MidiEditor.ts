import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";
import { Note } from "./Note"
import { DAWConfig } from "../../../config/DAWConfig";
import { EventManager } from "../../../events/EventManager";
import { IFloatingWindow } from "../../../types/IFloatingWindow";
import { IWindowPosition, IWindowSize } from "../../../types/window";

interface IMidiNote {
    pitch: number;    // MIDI 音高 (0-127)
    time: number;     // 開始時間（以網格為單位）
    duration: number; // 持續時間（以網格為單位）
    velocity: number; // 力度 (0-127)
}

export class MIDIEditor extends BaseComponent implements IFloatingWindow {
    public id: string;
    public container: PIXI.Container;
    public position: IWindowPosition;
    public size: IWindowSize;
    public titleHeight: number;
    public minWidth: number;
    public minHeight: number;
    public minimized: boolean = false;

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

    private gridContainer: PIXI.Container;
    private notesContainer: PIXI.Container;
    private pianoRoll: PIXI.Container;
    private notes: Map<string, Note> = new Map();
    
    private width: number;
    private height: number;
    private gridSize: number = 25;
    private noteHeight: number = 20;
    private pianoRollWidth: number = 100;
    
    // 音符範圍（MIDI 音高）
    private minNote: number = 48;  // C3
    private maxNote: number = 72;  // C5

    constructor() {
        super();
        this.id = 'midi-editor';
        this.container = new PIXI.Container();
        this.container.zIndex = 1000; // 設置為最高層級
        this.position = { x: 100, y: 100 };
        this.size = { width: 800, height: 600 };
        this.titleHeight = 30;
        this.minWidth = 400;
        this.minHeight = 300;

        this.init();
    }

    private init(): void {
        // 創建容器
        this.gridContainer = new PIXI.Container();
        this.notesContainer = new PIXI.Container();
        this.pianoRoll = new PIXI.Container();
        
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
        this.container.addChild(this.gridContainer);
        this.container.addChild(this.notesContainer);
        this.container.addChild(this.pianoRoll);
        
        // 初始化鋼琴卷軸
        this.initPianoRoll();
        // 初始化網格
        this.drawGrid();
        
        // 創建按鈕
        this.createButtons();

        // 繪製視窗
        this.draw();

        // 設置事件
        this.setupEvents();
    }

    private initPianoRoll(): void {
        this.pianoRoll.position.x = 0;
        
        // 繪製鋼琴鍵
        for (let i = this.maxNote; i >= this.minNote; i--) {
            const isBlackKey = [1, 3, 6, 8, 10].includes(i % 12);
            const key = new PIXI.Graphics();
            const y = (this.maxNote - i) * this.noteHeight;
            
            key
                .fill({ color: isBlackKey ? 0x000000 : 0xffffff })
                .rect(0, y, this.pianoRollWidth, this.noteHeight);
            
            if (!isBlackKey) {
                // 添加音符名稱
                const noteName = this.getMidiNoteName(i);
                const text = new PIXI.Text({
                    text: noteName,
                    style: {
                        fontSize: 10,
                        fill: 0x000000
                    }
                });
                text.position.set(5, y + 5);
                key.addChild(text);
            }
            
            key.eventMode = 'static';
            key.cursor = 'pointer';
            
            // 添加預覽音效
            key.on('pointerdown', () => {
                this.eventManager.emit('daw:audio:preview', { note: this.getMidiNoteName(i) });
            });
            
            this.pianoRoll.addChild(key);
        }
    }

    private drawGrid(): void {
        const graphics = new PIXI.Graphics();
        graphics.position.x = this.pianoRollWidth;
        
        // 繪製水平線（音高分隔線）
        for (let i = 0; i <= this.maxNote - this.minNote; i++) {
            const y = i * this.noteHeight;
            graphics
                .setStrokeStyle({
                    width: 1,
                    color: 0x444444,
                    alpha: 0.5
                })
                .moveTo(0, y)
                .lineTo(this.width - this.pianoRollWidth, y)
                .stroke();
        }
        
        // 繪製垂直線（時間分隔線）
        const cols = Math.floor((this.width - this.pianoRollWidth) / this.gridSize);
        for (let i = 0; i <= cols; i++) {
            const x = i * this.gridSize;
            const alpha = i % 4 === 0 ? 0.8 : 0.3; // 每四拍加重顯示
            graphics
                .setStrokeStyle({
                    width: 1,
                    color: 0x444444,
                    alpha
                })
                .moveTo(x, 0)
                .lineTo(x, this.height)
                .stroke();
        }
        
        this.gridContainer.addChild(graphics);
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
                fontSize: 16,
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

        return button;
    }

    private draw(): void {
        // 繪製背景
        this.background
            .clear()
            .fill({ color: 0x2a2a2a })
            .rect(0, 0, this.size.width, this.size.height);

        // 繪製標題欄
        this.titleBar
            .clear()
            .fill({ color: 0x3a3a3a })
            .rect(0, 0, this.size.width, this.titleHeight)
            .setStrokeStyle({
                width: 1,
                color: 0x444444
            })
            .stroke()
            .rect(0, this.titleHeight - 1, this.size.width, 1);

        // 繪製標題文字
        const titleText = new PIXI.Text({
            text: 'MIDI Editor',
            style: {
                fontSize: 14,
                fill: 0xffffff,
                fontFamily: 'Arial'
            }
        });
        titleText.position.set(10, (this.titleHeight - titleText.height) / 2);
        this.titleBar.addChild(titleText);

        // 更新按鈕位置
        this.closeButton.position.set(this.size.width - 30, 0);
        this.minimizeButton.position.set(this.size.width - 60, 0);
    }

    private setupEvents(): void {
        this.notesContainer.position.x = this.pianoRollWidth;
        this.notesContainer.eventMode = 'static';
        
        // 點擊網格添加音符
        this.notesContainer.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            const localPos = this.notesContainer.toLocal(event.global);
            const pitch = this.maxNote - Math.floor(localPos.y / this.noteHeight);
            const time = Math.floor(localPos.x / this.gridSize);
            
            if (pitch >= this.minNote && pitch <= this.maxNote) {
                this.addNote({
                    pitch,
                    time,
                    duration: 1,
                    velocity: 100
                });
            }
        });

        // 標題欄拖動
        this.titleBar.eventMode = 'static';
        this.titleBar.cursor = 'move';
        this.titleBar.on('pointerdown', this.startDrag.bind(this));

        // 視窗大小調整
        const resizeArea = new PIXI.Graphics()
            .fill({ color: 0x000000, alpha: 0 })
            .rect(this.size.width - 10, this.size.height - 10, 10, 10);
        this.container.addChild(resizeArea);
        resizeArea.eventMode = 'static';
        resizeArea.cursor = 'se-resize';
        resizeArea.on('pointerdown', this.startResize.bind(this));

        // 全局滑鼠事件
        this.app.stage.on('pointermove', this.handlePointerMove.bind(this));
        this.app.stage.on('pointerup', this.handlePointerUp.bind(this));
    }

    private startDrag(event: PIXI.FederatedPointerEvent): void {
        this.isDragging = true;
        this.dragStart = {
            x: event.global.x - this.position.x,
            y: event.global.y - this.position.y
        };
    }

    private startResize(event: PIXI.FederatedPointerEvent): void {
        this.isResizing = true;
        this.resizeStart = {
            x: event.global.x,
            y: event.global.y
        };
        this.originalSize = { ...this.size };
    }

    private handlePointerMove(event: PIXI.FederatedPointerEvent): void {
        if (this.isDragging) {
            this.position = {
                x: event.global.x - this.dragStart.x,
                y: event.global.y - this.dragStart.y
            };
            this.container.position.set(this.position.x, this.position.y);
        } else if (this.isResizing) {
            const deltaX = event.global.x - this.resizeStart.x;
            const deltaY = event.global.y - this.resizeStart.y;
            this.size = {
                width: Math.max(this.minWidth, this.originalSize.width + deltaX),
                height: Math.max(this.minHeight, this.originalSize.height + deltaY)
            };
            this.draw();
        }
    }

    private handlePointerUp(): void {
        this.isDragging = false;
        this.isResizing = false;
    }

    private addNote(noteData: IMidiNote): void {
        const note = new Note(
            noteData,
            this.gridSize,
            this.noteHeight,
            () => this.removeNote(noteData)
        );
        
        const noteId = `${noteData.pitch}-${noteData.time}`;
        this.notes.set(noteId, note);
        this.notesContainer.addChild(note.getContainer());
        
        // 發送音符添加事件
        this.eventManager.emit('daw:midi:note:added', { note: noteData });
    }

    private removeNote(noteData: IMidiNote): void {
        const noteId = `${noteData.pitch}-${noteData.time}`;
        const note = this.notes.get(noteId);
        if (note) {
            note.destroy();
            this.notes.delete(noteId);
            this.eventManager.emit('daw:midi:note:removed', { note: noteData });
        }
    }

    private getMidiNoteName(midiNumber: number): string {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midiNumber / 12) - 1;
        const noteName = noteNames[midiNumber % 12];
        return `${noteName}${octave}`;
    }

    public getNotes(): IMidiNote[] {
        return Array.from(this.notes.values()).map(note => note.getData());
    }

    public update(): void {
        // 實現更新邏輯
    }

    public getContentContainer(): PIXI.Container {
        return this.contentContainer;
    }

    public enableDrag(): void {
        this.titleBar.eventMode = 'static';
        this.titleBar.cursor = 'move';
    }

    public enableResize(): void {
        // 已經在 setupEvents 中實現
    }

    public enableClose(): void {
        this.closeButton.eventMode = 'static';
        this.closeButton.cursor = 'pointer';
    }

    public enableMinimize(): void {
        this.minimizeButton.eventMode = 'static';
        this.minimizeButton.cursor = 'pointer';
    }

    public toggleMinimize(): void {
        this.minimized = !this.minimized;
        this.contentContainer.visible = !this.minimized;
        this.size.height = this.minimized ? this.titleHeight : this.originalSize.height;
        this.draw();
    }

    public close(): void {
        this.container.visible = false;
        this.eventManager.emit('daw:window:remove', { window: this });
    }

    public bringToFront(): void {
        this.container.zIndex = 1000;
    }

    public destroy(): void {
        this.notes.forEach(note => note.destroy());
        this.background.destroy();
        this.gridContainer.destroy({ children: true });
        this.notesContainer.destroy({ children: true });
        this.pianoRoll.destroy({ children: true });
        this.container.destroy({ children: true });
    }
} 