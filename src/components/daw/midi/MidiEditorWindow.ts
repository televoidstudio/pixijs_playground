import * as PIXI from 'pixi.js';
import { BaseComponent } from '../core/BaseComponent';
import { MidiEditor } from './MidiEditor';
import { IClip } from '../../../types/daw';

export default class MidiEditorWindow extends BaseComponent {
    private static readonly WINDOW_WIDTH = 1000;
    private static readonly WINDOW_HEIGHT = 700;
    private static readonly HEADER_HEIGHT = 40;
    private static readonly COLORS = {
        BACKGROUND: 0x1A1D2E,      // 更深的藍色背景
        HEADER: 0x242943,          // 更深的標題欄
        BORDER: 0x3A4466,          // 更亮的邊框
        GRID: 0x2A324F,            // 更亮的網格線
        TEXT: 0xFFFFFF,            // 文字
        CLOSE_HOVER: 0xFF3B3B      // 關閉按鈕懸停
    };

    private midiEditor: MidiEditor;
    private windowContainer: PIXI.Container;
    private overlay: PIXI.Graphics;
    private onClose: () => void;

    constructor(clipData: IClip, onClose: () => void) {
        super();
        this.onClose = onClose;
        this.container = new PIXI.Container();
        this.container.zIndex = 9999;  // 確保容器在最上層
        
        // 初始化組件
        this.initOverlay();
        this.initWindow();
        this.initMidiEditor(clipData);
        this.setupEventListeners();
        
        // 設置初始位置和動畫
        this.setInitialPosition();
        this.animateOpen();
    }

    private initOverlay(): void {
        const overlayContainer = new PIXI.Container();
        overlayContainer.zIndex = 9998;  // 遮罩層在編輯器下方
        
        this.overlay = new PIXI.Graphics();
        this.overlay
            .fill({ color: 0x000000, alpha: 0.92 })
            .rect(0, 0, window.innerWidth, window.innerHeight);
        
        this.overlay.eventMode = 'static';
        this.overlay.cursor = 'default';
        this.overlay.on('pointerdown', () => this.close());
        
        overlayContainer.addChild(this.overlay);
        this.container.addChild(overlayContainer);
        this.container.sortableChildren = true;  // 啟用子元素排序
    }

    private initWindow(): void {
        const windowWrapper = new PIXI.Container();
        windowWrapper.zIndex = 9999;  // 視窗容器在最上層
        windowWrapper.sortableChildren = true;
        
        this.windowContainer = new PIXI.Container();
        this.windowContainer.zIndex = 1;  // 在 wrapper 中的層級
        this.windowContainer.sortableChildren = true;
        this.windowContainer.eventMode = 'static';
        
        const graphicsContainer = new PIXI.Container();
        graphicsContainer.zIndex = 1;
        graphicsContainer.sortableChildren = true;
        
        // 主背景
        const background = new PIXI.Graphics();
        background.zIndex = 1;
        background
            .fill({ color: MidiEditorWindow.COLORS.BACKGROUND })
            .roundRect(0, 0, MidiEditorWindow.WINDOW_WIDTH, MidiEditorWindow.WINDOW_HEIGHT, 12);

        // 標題欄
        const header = new PIXI.Graphics();
        header.zIndex = 3;
        header
            .fill({ color: MidiEditorWindow.COLORS.HEADER })
            .roundRect(0, 0, MidiEditorWindow.WINDOW_WIDTH, MidiEditorWindow.HEADER_HEIGHT, 12);

        // 深色背景效果
        const darkOverlay = new PIXI.Graphics();
        darkOverlay.zIndex = 2;
        darkOverlay
            .fill({ color: 0x000000, alpha: 0.2 })
            .roundRect(0, MidiEditorWindow.HEADER_HEIGHT, MidiEditorWindow.WINDOW_WIDTH, 
                      MidiEditorWindow.WINDOW_HEIGHT - MidiEditorWindow.HEADER_HEIGHT, 12);

        // 標題欄分隔線
        const headerBorder = new PIXI.Graphics();
        headerBorder.zIndex = 4;
        headerBorder
            .fill({ color: MidiEditorWindow.COLORS.BORDER, alpha: 0.8 })
            .rect(0, MidiEditorWindow.HEADER_HEIGHT - 1, MidiEditorWindow.WINDOW_WIDTH, 1);

        // 視窗邊框
        const border = new PIXI.Graphics();
        border.zIndex = 5;
        border
            .fill({ color: MidiEditorWindow.COLORS.BORDER, alpha: 0.8 })
            .roundRect(0, 0, MidiEditorWindow.WINDOW_WIDTH, MidiEditorWindow.WINDOW_HEIGHT, 12);

        // 網格背景
        const grid = this.createGrid();
        grid.zIndex = 2;

        // 關閉按鈕
        const closeButton = this.createCloseButton();
        closeButton.zIndex = 6;

        // 組裝視窗（更新繪製順序）
        graphicsContainer.addChild(background);
        graphicsContainer.addChild(darkOverlay);
        graphicsContainer.addChild(grid);
        graphicsContainer.addChild(header);
        graphicsContainer.addChild(headerBorder);
        graphicsContainer.addChild(border);
        graphicsContainer.addChild(closeButton);

        this.windowContainer.addChild(graphicsContainer);
        windowWrapper.addChild(this.windowContainer);
        this.container.addChild(windowWrapper);
    }

    private createGrid(): PIXI.Container {
        const gridContainer = new PIXI.Container();
        const grid = new PIXI.Graphics();
        
        // 垂直線
        for (let x = 0; x <= MidiEditorWindow.WINDOW_WIDTH; x += 40) {
            grid
                .fill({ color: MidiEditorWindow.COLORS.GRID, alpha: 0.3 })
                .rect(x, MidiEditorWindow.HEADER_HEIGHT, 1, 
                      MidiEditorWindow.WINDOW_HEIGHT - MidiEditorWindow.HEADER_HEIGHT);
        }
        
        // 水平線
        for (let y = MidiEditorWindow.HEADER_HEIGHT; y <= MidiEditorWindow.WINDOW_HEIGHT; y += 40) {
            grid
                .fill({ color: MidiEditorWindow.COLORS.GRID, alpha: 0.3 })
                .rect(0, y, MidiEditorWindow.WINDOW_WIDTH, 1);
        }

        // 強調線
        for (let x = 0; x <= MidiEditorWindow.WINDOW_WIDTH; x += 160) {
            grid
                .fill({ color: MidiEditorWindow.COLORS.GRID, alpha: 0.5 })
                .rect(x, MidiEditorWindow.HEADER_HEIGHT, 2, 
                      MidiEditorWindow.WINDOW_HEIGHT - MidiEditorWindow.HEADER_HEIGHT);
        }
        
        gridContainer.addChild(grid);
        return gridContainer;
    }

    private createCloseButton(): PIXI.Container {
        const buttonContainer = new PIXI.Container();
        buttonContainer.eventMode = 'static';
        buttonContainer.cursor = 'pointer';

        const button = new PIXI.Graphics();
        button
            .fill({ color: MidiEditorWindow.COLORS.HEADER })
            .circle(0, 0, 15);

        const cross = new PIXI.Text({
            text: '×',
            style: {
                fontSize: 24,
                fill: MidiEditorWindow.COLORS.TEXT,
                fontWeight: 'bold'
            }
        });
        cross.anchor.set(0.5);

        buttonContainer.addChild(button);
        buttonContainer.addChild(cross);
        
        buttonContainer.position.set(MidiEditorWindow.WINDOW_WIDTH - 30, 20);

        buttonContainer
            .on('pointerover', () => {
                button.clear();
                button
                    .fill({ color: MidiEditorWindow.COLORS.CLOSE_HOVER })
                    .circle(0, 0, 15);
            })
            .on('pointerout', () => {
                button.clear();
                button
                    .fill({ color: MidiEditorWindow.COLORS.HEADER })
                    .circle(0, 0, 15);
            })
            .on('pointerdown', () => this.close());

        return buttonContainer;
    }

    private initMidiEditor(clipData: IClip): void {
        const editorContainer = new PIXI.Container();
        editorContainer.zIndex = 3;  // 確保編輯器在適當的層級
        editorContainer.sortableChildren = true;
        
        this.midiEditor = new MidiEditor(
            MidiEditorWindow.WINDOW_WIDTH,
            MidiEditorWindow.WINDOW_HEIGHT - MidiEditorWindow.HEADER_HEIGHT
        );
        
        const editor = this.midiEditor.getContainer();
        editor.position.set(0, MidiEditorWindow.HEADER_HEIGHT);
        editor.zIndex = 1;
        
        editorContainer.addChild(editor);
        this.windowContainer.addChild(editorContainer);
    }

    private setupEventListeners(): void {
        // 防止點擊視窗時關閉
        this.windowContainer.on('pointerdown', (event) => {
            event.stopPropagation();
        });

        // ESC 鍵關閉
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                this.close();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        this.container.on('destroyed', () => {
            window.removeEventListener('keydown', handleKeyDown);
        });
    }

    private setInitialPosition(): void {
        this.windowContainer.position.set(
            (window.innerWidth - MidiEditorWindow.WINDOW_WIDTH) / 2,
            (window.innerHeight - MidiEditorWindow.WINDOW_HEIGHT) / 2
        );
        this.windowContainer.alpha = 0;
    }

    private animateOpen(): void {
        const animate = () => {
            if (this.windowContainer.alpha < 1) {
                this.windowContainer.alpha += 0.1;
                requestAnimationFrame(animate);
            }
        };
        animate();
    }

    private close(): void {
        const animate = () => {
            if (this.windowContainer.alpha > 0) {
                this.windowContainer.alpha -= 0.1;
                requestAnimationFrame(animate);
            } else {
                this.onClose();
                this.destroy();
            }
        };
        animate();
    }

    public destroy(): void {
        this.midiEditor.destroy();
        this.container.destroy({ children: true });
    }

    public update(): void {
        // 實現 BaseComponent 的抽象方法
        // 目前不需要更新邏輯
    }

    public getMidiEditor(): MidiEditor {
        return this.midiEditor;
    }
} 