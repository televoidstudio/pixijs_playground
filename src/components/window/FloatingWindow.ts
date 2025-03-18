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

  constructor(
    private app: PIXI.Application,
    width: number = WINDOW_DEFAULTS.DEFAULT_WIDTH,
    height: number = WINDOW_DEFAULTS.DEFAULT_HEIGHT
  ) {
    this.id = crypto.randomUUID();
    this.size = { width, height };
    this.position = { x: 0, y: 0 };
    this.titleHeight = theme.dimensions.titleHeight;
    this.minWidth = theme.dimensions.minWidth;
    this.minHeight = theme.dimensions.minHeight;
    this.minimized = false;
    
    this.container = new PIXI.Container();
    this.bg = new PIXI.Graphics();
    this.titleBar = new PIXI.Graphics();
    this.contentArea = new PIXI.Container();
    this.eventManager = EventManager.getInstance();

    this.initialize();
  }

  private initialize(): void {
    this.app.stage.addChild(this.container);
    this.draw();
    this.enableDrag();
    this.enableResize();
    this.enableClose();
    this.enableMinimize();
    
    this.eventManager.emit('window:created', this.id);
  }

  public draw(): void {
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
      this.contentArea.y = this.titleHeight;
      this.container.addChild(this.contentArea);
    }
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
    new ResizableHandle(this);
  }

  public enableClose(): void {
    const closeBtn = new PIXI.Graphics();
    closeBtn.beginFill(theme.colors.window.closeButton);
    const btnSize = theme.dimensions.buttonSize;
    closeBtn.drawCircle(this.size.width - btnSize - WINDOW_DEFAULTS.BUTTON_PADDING, this.titleHeight / 2, btnSize / 2);
    closeBtn.endFill();

    closeBtn.lineStyle(2, 0xffffff);
    const cx = this.size.width - btnSize - WINDOW_DEFAULTS.BUTTON_PADDING;
    const cy = this.titleHeight / 2;
    closeBtn.moveTo(cx - 4, cy - 4);
    closeBtn.lineTo(cx + 4, cy + 4);
    closeBtn.moveTo(cx + 4, cy - 4);
    closeBtn.lineTo(cx - 4, cy + 4);

    closeBtn.eventMode = "static";
    closeBtn.on("pointerdown", () => {
      this.destroy();
    });

    this.titleBar.addChild(closeBtn);
  }

  public enableMinimize(): void {
    const minimizeBtn = new PIXI.Graphics();
    minimizeBtn.beginFill(theme.colors.window.minimizeButton);
    const btnSize = theme.dimensions.buttonSize;
    minimizeBtn.drawRect(
      this.size.width - btnSize * 2 - WINDOW_DEFAULTS.BUTTON_PADDING * 2,
      this.titleHeight / 2 - btnSize / 2,
      btnSize,
      btnSize
    );
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
} 