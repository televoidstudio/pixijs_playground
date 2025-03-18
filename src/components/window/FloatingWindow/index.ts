import * as PIXI from 'pixi.js';
import { IFloatingWindow, IWindowSize } from '../../../types/window';
import { theme } from '../../../config/theme';

export class FloatingWindow implements IFloatingWindow {
    private bg: PIXI.Graphics;
    private titleBar: PIXI.Graphics;
    private titleText: PIXI.Text;
    private size: IWindowSize;

    // ... 其他屬性 ...

    private drawBackground(): void {
        this.bg.clear();
        
        // 繪製陰影效果
        const shadowSize = 4;
        this.bg.beginFill(0x000000, 0.2);
        this.bg.drawRoundedRect(
            shadowSize, 
            shadowSize, 
            this.size.width, 
            this.size.height, 
            theme.dimensions.borderRadius
        );
        this.bg.endFill();

        // 繪製主要背景
        this.bg.lineStyle(
            theme.dimensions.borderWidth,
            theme.colors.window.border,
            0.8  // 半透明邊框
        );
        this.bg.beginFill(theme.colors.window.background);
        this.bg.drawRoundedRect(
            0,
            0,
            this.size.width,
            this.size.height,
            theme.dimensions.borderRadius
        );
        this.bg.endFill();
    }

    private drawTitleBar(): void {
        this.titleBar.clear();
        
        // 標題欄背景漸層效果
        const gradient = this.titleBar.createLinearGradient(
            0, 0, 0, theme.dimensions.titleHeight,
            [
                { offset: 0, color: theme.colors.window.titleBar },
                { offset: 1, color: theme.colors.window.titleBarHover }
            ]
        );
        
        this.titleBar.beginFill(gradient);
        this.titleBar.drawRoundedRect(
            0,
            0,
            this.size.width,
            theme.dimensions.titleHeight,
            theme.dimensions.borderRadius
        );
        this.titleBar.endFill();

        // 添加標題文字
        if (!this.titleText) {
            this.titleText = new PIXI.Text('Window', {
                fontFamily: 'Arial',
                fontSize: 14,
                fill: theme.colors.text.primary,
                fontWeight: 'bold'
            });
            this.titleText.x = theme.spacing.padding;
            this.titleText.y = (theme.dimensions.titleHeight - this.titleText.height) / 2;
            this.titleBar.addChild(this.titleText);
        }
    }

    public enableClose(): void {
        const closeBtn = new PIXI.Graphics();
        const btnSize = theme.dimensions.buttonSize;
        const padding = theme.spacing.padding;
        
        const drawCloseButton = (color: number) => {
            closeBtn.clear();
            
            // 按鈕背景
            closeBtn.beginFill(color);
            closeBtn.drawCircle(
                this.size.width - padding - btnSize/2,
                theme.dimensions.titleHeight/2,
                btnSize/2
            );
            closeBtn.endFill();

            // 繪製 X 符號
            closeBtn.lineStyle(2, 0xFFFFFF, 0.8);
            const x = this.size.width - padding - btnSize/2;
            const y = theme.dimensions.titleHeight/2;
            const offset = btnSize/4;
            
            closeBtn.moveTo(x - offset, y - offset);
            closeBtn.lineTo(x + offset, y + offset);
            closeBtn.moveTo(x + offset, y - offset);
            closeBtn.lineTo(x - offset, y + offset);
        };

        // 初始狀態
        drawCloseButton(theme.colors.window.buttons.close.default);

        // 互動效果
        closeBtn.eventMode = 'static';
        closeBtn.cursor = 'pointer';
        
        closeBtn.on('pointerover', () => {
            drawCloseButton(theme.colors.window.buttons.close.hover);
            closeBtn.scale.set(1.1);  // 放大效果
        });
        
        closeBtn.on('pointerout', () => {
            drawCloseButton(theme.colors.window.buttons.close.default);
            closeBtn.scale.set(1.0);
        });
        
        closeBtn.on('pointerdown', () => {
            closeBtn.scale.set(0.9);  // 按下效果
        });
        
        closeBtn.on('pointerup', () => {
            this.destroy();
        });

        this.titleBar.addChild(closeBtn);
    }

    public enableMinimize(): void {
        const minimizeBtn = new PIXI.Graphics();
        const btnSize = theme.dimensions.buttonSize;
        const padding = theme.spacing.padding;
        const gap = theme.spacing.buttonGap;
        
        const drawMinimizeButton = (color: number) => {
            minimizeBtn.clear();
            
            // 按鈕背景
            minimizeBtn.beginFill(color);
            minimizeBtn.drawCircle(
                this.size.width - padding - btnSize/2 - (btnSize + gap),
                theme.dimensions.titleHeight/2,
                btnSize/2
            );
            minimizeBtn.endFill();

            // 繪製最小化符號
            minimizeBtn.lineStyle(2, 0xFFFFFF, 0.8);
            const x = this.size.width - padding - btnSize - (btnSize + gap);
            const y = theme.dimensions.titleHeight/2;
            minimizeBtn.moveTo(x - btnSize/4, y);
            minimizeBtn.lineTo(x + btnSize/4, y);
        };

        // 初始狀態
        drawMinimizeButton(theme.colors.window.buttons.minimize.default);

        // 互動效果
        minimizeBtn.eventMode = 'static';
        minimizeBtn.cursor = 'pointer';
        
        minimizeBtn.on('pointerover', () => {
            drawMinimizeButton(theme.colors.window.buttons.minimize.hover);
            minimizeBtn.scale.set(1.1);
        });
        
        minimizeBtn.on('pointerout', () => {
            drawMinimizeButton(theme.colors.window.buttons.minimize.default);
            minimizeBtn.scale.set(1.0);
        });
        
        minimizeBtn.on('pointerdown', () => {
            minimizeBtn.scale.set(0.9);
        });
        
        minimizeBtn.on('pointerup', () => {
            this.toggleMinimize();
        });

        this.titleBar.addChild(minimizeBtn);
    }
} 