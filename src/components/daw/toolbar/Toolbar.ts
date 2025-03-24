import * as PIXI from "pixi.js";
import { BaseComponent } from "../../core/BaseComponent";
import { DAWConfig } from "../../../../config/DAWConfig";

export class ToolBar extends BaseComponent {
    public static readonly HEIGHT = 40;
    private background: PIXI.Graphics;
    private toolContainer: PIXI.Container;
    private currentTool: string = 'select';

    constructor(width: number) {
        super();
        this.init(width);
    }

    private init(width: number): void {
        // 創建背景
        this.background = new PIXI.Graphics();
        this.background
            .fill({ color: 0x2a2a2a })
            .rect(0, 0, width, ToolBar.HEIGHT);
        this.container.addChild(this.background);

        // 創建工具容器
        this.toolContainer = new PIXI.Container();
        this.toolContainer.position.set(10, 5);  // 留出邊距
        this.container.addChild(this.toolContainer);

        // 創建基本工具
        this.createTools();
    }

    private createTools(): void {
        const tools = [
            { name: 'select', label: '選擇', shortcut: 'V' },
            { name: 'cut', label: '剪切', shortcut: 'C' },
            { name: 'erase', label: '擦除', shortcut: 'E' }
        ];

        tools.forEach((tool, index) => {
            const button = this.createToolButton(tool);
            button.position.x = index * 40;  // 工具按鈕間距
            this.toolContainer.addChild(button);
        });
    }

    private createToolButton(tool: { name: string; label: string; shortcut: string }): PIXI.Container {
        const button = new PIXI.Container();
        
        // 按鈕背景
        const background = new PIXI.Graphics();
        background
            .fill({ color: this.currentTool === tool.name ? 0x3a3a3a : 0x2a2a2a })
            .rect(0, 0, 30, 30);
        
        // 按鈕文字
        const text = new PIXI.Text({
            text: tool.label[0],  // 只顯示第一個字
            style: {
                fontSize: 12,
                fill: 0xffffff
            }
        });
        text.position.set(
            (30 - text.width) / 2,
            (30 - text.height) / 2
        );

        button.addChild(background, text);
        button.eventMode = 'static';
        button.cursor = 'pointer';

        // 添加事件監聽
        button.on('pointerdown', () => {
            this.setCurrentTool(tool.name);
            this.eventManager.emit('tool:changed', { tool: tool.name });
        });

        button.on('pointerover', () => {
            background.fill({ color: 0x3a3a3a });
        });

        button.on('pointerout', () => {
            background.fill({ color: this.currentTool === tool.name ? 0x3a3a3a : 0x2a2a2a });
        });

        return button;
    }

    private setCurrentTool(toolName: string): void {
        this.currentTool = toolName;
        // 更新所有工具按鈕的外觀
        this.toolContainer.children.forEach((button, index) => {
            const background = button.getChildAt(0) as PIXI.Graphics;
            background.fill({ color: this.currentTool === ['select', 'cut', 'erase'][index] ? 0x3a3a3a : 0x2a2a2a });
        });
    }
} 