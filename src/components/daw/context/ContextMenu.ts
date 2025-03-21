import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";
import { DAWConfig } from "../../../config/DAWConfig";

interface IContextMenuItem {
    label: string;
    action: () => void;
    shortcut?: string;
}

export class ContextMenu extends BaseComponent {
    private menuItems: IContextMenuItem[] = [];
    private background: PIXI.Graphics;
    private itemContainer: PIXI.Container;

    constructor() {
        super();
        this.init();
    }

    private init(): void {
        this.background = new PIXI.Graphics();
        this.itemContainer = new PIXI.Container();
        this.container.addChild(this.background, this.itemContainer);
        this.container.visible = false;
        
        // 設置容器為可交互
        this.container.eventMode = 'static';
        
        // 阻止點擊選單時的事件冒泡
        this.container.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            event.stopPropagation();
        });
    }

    public show(items: IContextMenuItem[], x: number, y: number): void {
        this.menuItems = items;
        
        // 確保選單不會超出視窗範圍
        const menuWidth = 150;
        const menuHeight = this.menuItems.length * 25;
        
        // 調整 x 座標
        if (x + menuWidth > window.innerWidth) {
            x = window.innerWidth - menuWidth;
        }
        
        // 調整 y 座標
        if (y + menuHeight > window.innerHeight) {
            y = window.innerHeight - menuHeight;
        }
        
        this.container.position.set(x, y);
        this.container.visible = true;
        this.drawMenu();
        
        // 將選單移到最上層
        if (this.container.parent) {
            this.container.parent.addChild(this.container);
        }
    }

    public hide(): void {
        this.container.visible = false;
    }

    private drawMenu(): void {
        // 清除現有項目
        this.itemContainer.removeChildren();
        this.background.clear();

        // 繪製菜單背景
        const menuWidth = 150;
        const itemHeight = 25;
        const menuHeight = this.menuItems.length * itemHeight;

        this.background
            .beginFill(0x2a2a2a)
            .drawRect(0, 0, menuWidth, menuHeight)
            .endFill();

        // 創建菜單項
        this.menuItems.forEach((item, index) => {
            const itemContainer = new PIXI.Container();
            itemContainer.y = index * itemHeight;

            // 創建文字
            const text = new PIXI.Text({
                text: item.label,
                style: {
                    fontSize: 12,
                    fill: 0xffffff
                }
            });
            text.position.set(10, (itemHeight - text.height) / 2);

            // 如果有快捷鍵，添加快捷鍵文字
            if (item.shortcut) {
                const shortcutText = new PIXI.Text({
                    text: item.shortcut,
                    style: {
                        fontSize: 12,
                        fill: 0x808080
                    }
                });
                shortcutText.position.set(
                    menuWidth - shortcutText.width - 10,
                    (itemHeight - shortcutText.height) / 2
                );
                itemContainer.addChild(shortcutText);
            }

            itemContainer.addChild(text);
            itemContainer.eventMode = 'static';
            itemContainer.cursor = 'pointer';

            // 添加交互事件
            itemContainer.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
                // 阻止事件冒泡
                event.stopPropagation();
                // 執行動作
                item.action();
                // 隱藏選單
                this.hide();
            });

            itemContainer.on('pointerover', () => {
                const highlight = new PIXI.Graphics();
                highlight.beginFill(0x3a3a3a)
                    .drawRect(0, 0, menuWidth, itemHeight)
                    .endFill();
                itemContainer.addChildAt(highlight, 0);
            });

            itemContainer.on('pointerout', () => {
                itemContainer.removeChildAt(0);
            });

            this.itemContainer.addChild(itemContainer);
        });
    }
} 