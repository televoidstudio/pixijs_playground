import * as PIXI from "pixi.js";
import { IFloatingWindow, IWindowPosition, IWindowSize } from "../../types/IFloatingWindow";
import { Draggable } from "./Draggable";
import { ResizableHandle } from "./ResizableHandle";
import { theme } from "../../config/theme";
import { WINDOW_DEFAULTS } from "../../config/constants";
import { EventManager } from "../../utils/EventManager";

export class FloatingWindow implements IFloatingWindow {
  public readonly id: string;
  public container: PIXI.Container;
  public position: IWindowPosition;
  public size: IWindowSize;
  public titleHeight: number;
  public minWidth: number;
  public minHeight: number;
  public minimized: boolean;

  private bg: PIXI.Graphics;
  private titleBar: PIXI.Graphics;
  private contentArea: PIXI.Container;
  private eventManager: EventManager;
  private resizeHandle: ResizableHandle | null = null;

  constructor(
    private app: PIXI.Application,
    width: number = WINDOW_DEFAULTS.DEFAULT_WIDTH,
    height: number = WINDOW_DEFAULTS.DEFAULT_HEIGHT
  ) {
    this.id = crypto.randomUUID();
    this.container = new PIXI.Container();
    this.position = { x: 0, y: 0 };
    this.size = { width, height };
    this.titleHeight = theme.dimensions.titleHeight;
    this.minWidth = theme.dimensions.minWidth;
    this.minHeight = theme.dimensions.minHeight;
    this.minimized = false;
    
    this.bg = new PIXI.Graphics();
    this.titleBar = new PIXI.Graphics();
    this.contentArea = new PIXI.Container();
    this.eventManager = EventManager.getInstance();

    this.initialize();
  }

  private initialize(): void {
    this.app.stage.addChild(this.container);
    
    // 設置初始位置
    this.container.x = this.position.x;
    this.container.y = this.position.y;
    
    // 添加點擊事件監聽，將視窗移到最上層
    this.container.eventMode = 'static';
    this.container.on('pointerdown', this.bringToFront.bind(this));
    
    this.draw();
    this.enableDrag();
    this.enableResize();
    this.enableClose();
    this.enableMinimize();
    
    // 監聽 resize 事件時要保存位置
    this.eventManager.on('resize:move', ({ window, size }) => {
        if (window.id === this.id) {
            const currentPosition = {
                x: this.container.x,
                y: this.container.y
            };
            this.size = size;
            this.draw();
            // 恢復位置
            this.container.x = currentPosition.x;
            this.container.y = currentPosition.y;
            this.position = currentPosition;
        }
    });

    this.eventManager.emit('window:created', this.id);
  }

  public draw(): void {
    // 保存當前實際位置
    const currentPosition = {
        x: this.container.x,
        y: this.container.y
    };

    this.bg.clear();
    this.bg.beginFill(theme.colors.window.background);
    this.bg.drawRoundedRect(0, 0, this.size.width, this.size.height, WINDOW_DEFAULTS.CORNER_RADIUS);
    this.bg.endFill();

    this.titleBar.clear();
    this.titleBar.beginFill(theme.colors.window.titleBar);
    this.titleBar.drawRoundedRect(0, 0, this.size.width, this.titleHeight, WINDOW_DEFAULTS.CORNER_RADIUS);
    this.titleBar.endFill();

    this.container.removeChildren();
    this.container.addChild(this.bg);
    this.container.addChild(this.titleBar);

    if (!this.minimized) {
      this.contentArea.x = 0;
      this.contentArea.y = this.titleHeight;
      
      const mask = new PIXI.Graphics();
      mask.beginFill(0xFFFFFF);
      mask.drawRect(0, this.titleHeight, this.size.width, this.size.height - this.titleHeight);
      mask.endFill();
      this.contentArea.mask = mask;
      
      this.container.addChild(this.contentArea);
      this.container.addChild(mask);
    }

    // 恢復實際位置
    this.container.x = currentPosition.x;
    this.container.y = currentPosition.y;
    this.position = currentPosition;  // 更新 position 屬性
  }

  public destroy(): void {
    this.eventManager.emit('window:destroyed', this.id);
    this.app.stage.removeChild(this.container);
    this.container.destroy();
  }

  public enableDrag(): void {
    new Draggable(this.titleBar);
  }

  public enableResize(): void {
    if (!this.resizeHandle) {
      this.resizeHandle = new ResizableHandle(this);
    }
  }

  public enableClose(): void {
    const closeBtn = new PIXI.Graphics();
    const btnSize = theme.dimensions.buttonSize;
    const padding = WINDOW_DEFAULTS.BUTTON_PADDING;
    
    // 計算按鈕位置：靠右對齊，保留padding
    const x = this.size.width - padding - btnSize;
    const y = this.titleHeight / 2;

    // 繪製關閉按鈕
    closeBtn.beginFill(theme.colors.window.closeButton);
    closeBtn.drawCircle(x, y, btnSize / 2);
    closeBtn.endFill();

    // 繪製 X 符號
    closeBtn.lineStyle(2, 0xffffff);
    closeBtn.moveTo(x - 4, y - 4);
    closeBtn.lineTo(x + 4, y + 4);
    closeBtn.moveTo(x + 4, y - 4);
    closeBtn.lineTo(x - 4, y + 4);

    closeBtn.eventMode = "static";
    closeBtn.on("pointerdown", () => {
        this.destroy();
    });

    this.titleBar.addChild(closeBtn);
  }

  public enableMinimize(): void {
    const minimizeBtn = new PIXI.Graphics();
    const btnSize = theme.dimensions.buttonSize;
    const padding = WINDOW_DEFAULTS.BUTTON_PADDING;
    
    // 計算按鈕位置：在關閉按鈕左側
    const x = this.size.width - padding * 2 - btnSize * 2;
    const y = this.titleHeight / 2 - btnSize / 2;

    minimizeBtn.beginFill(theme.colors.window.minimizeButton);
    minimizeBtn.drawRect(x, y, btnSize, btnSize);
    minimizeBtn.endFill();

    minimizeBtn.eventMode = "static";
    minimizeBtn.on("pointerdown", () => {
        this.toggleMinimize();
    });

    this.titleBar.addChild(minimizeBtn);
  }

  public toggleMinimize(): void {
    this.minimized = !this.minimized;
    if (this.minimized) {
      this.size.height = this.titleHeight;
    } else {
      this.size.height = WINDOW_DEFAULTS.DEFAULT_HEIGHT;
    }
    this.draw();
  }

  public getContentContainer(): PIXI.Container {
    return this.contentArea;
  }

  // 新增 bringToFront 方法
  private bringToFront(): void {
    if (this.app.stage.children.includes(this.container)) {
      // 將容器從當前位置移除
      this.app.stage.removeChild(this.container);
      // 將容器添加到最上層
      this.app.stage.addChild(this.container);
    }
  }
} 