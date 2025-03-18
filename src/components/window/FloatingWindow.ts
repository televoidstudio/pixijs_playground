import * as PIXI from "pixi.js";
import { IFloatingWindow, IWindowPosition, IWindowSize } from "../../types/IFloatingWindow";
import { Draggable } from "./Draggable";
import { ResizableHandle } from "./ResizableHandle";
import { theme } from "../../config/theme";
import { WINDOW_DEFAULTS } from "../../config/constants";
import { EventManager } from "../../utils/EventManager";

export class FloatingWindow implements IFloatingWindow {
  public readonly id!: string;
  public container!: PIXI.Container;
  public position!: IWindowPosition;
  public size!: IWindowSize;
  public titleHeight!: number;
  public minWidth!: number;
  public minHeight!: number;
  public minimized!: boolean;

  private bg = new PIXI.Graphics();
  private titleBar = new PIXI.Graphics();
  private contentArea = new PIXI.Container();
  private eventManager = EventManager.getInstance();
  private resizeHandle: ResizableHandle | null = null;

  constructor(
    private readonly app: PIXI.Application,
    width: number = WINDOW_DEFAULTS.DEFAULT_WIDTH,
    height: number = WINDOW_DEFAULTS.DEFAULT_HEIGHT
  ) {
    this.initializeProperties(width, height);
    this.initializeComponents();
    this.setupEventListeners();
  }

  private initializeProperties(width: number, height: number): void {
    (this as any).id = crypto.randomUUID();
    this.position = { x: 0, y: 0 };
    this.size = { width, height };
    this.titleHeight = theme.dimensions.titleHeight;
    this.minWidth = theme.dimensions.minWidth;
    this.minHeight = theme.dimensions.minHeight;
    this.minimized = false;
  }

  private initializeComponents(): void {
    this.container = new PIXI.Container();
    
    this.container.eventMode = 'static';
    this.app.stage.addChild(this.container);
    this.updatePosition();
  }

  private setupEventListeners(): void {
    this.container.on('pointerdown', this.bringToFront.bind(this));
    this.setupResizeListener();
    
    this.draw();
    this.enableDrag();
    this.enableResize();
    this.enableClose();
    this.enableMinimize();

    this.eventManager.emit('window:added', { id: this.id });
  }

  private setupResizeListener(): void {
    this.eventManager.on('resize:move', ({ window, size }) => {
      if (window.id === this.id) {
        const currentPosition = this.getCurrentPosition();
        this.size = size;
        this.draw();
        this.restorePosition(currentPosition);
      }
    });
  }

  private getCurrentPosition(): IWindowPosition {
    return {
      x: this.container.x,
      y: this.container.y
    };
  }

  private updatePosition(): void {
    this.container.x = this.position.x;
    this.container.y = this.position.y;
  }

  private restorePosition(position: IWindowPosition): void {
    this.container.x = position.x;
    this.container.y = position.y;
    this.position = position;
  }

  public draw(): void {
    const currentPosition = this.getCurrentPosition();
    
    this.drawBackground();
    this.drawTitleBar();
    this.updateContainer();
    
    this.restorePosition(currentPosition);
  }

  private drawBackground(): void {
    this.bg.clear();
    this.bg.beginFill(theme.colors.window.background);
    this.bg.drawRoundedRect(0, 0, this.size.width, this.size.height, WINDOW_DEFAULTS.CORNER_RADIUS);
    this.bg.endFill();
  }

  private drawTitleBar(): void {
    this.titleBar.clear();
    this.titleBar.beginFill(theme.colors.window.titleBar);
    this.titleBar.drawRoundedRect(0, 0, this.size.width, this.titleHeight, WINDOW_DEFAULTS.CORNER_RADIUS);
    this.titleBar.endFill();
  }

  private updateContainer(): void {
    this.container.removeChildren();
    this.container.addChild(this.bg);
    this.container.addChild(this.titleBar);

    if (!this.minimized) {
      this.setupContentArea();
    }
  }

  private setupContentArea(): void {
    this.contentArea.x = 0;
    this.contentArea.y = this.titleHeight;
    
    const mask = this.createContentMask();
    this.contentArea.mask = mask;
    
    this.container.addChild(this.contentArea);
    this.container.addChild(mask);
  }

  private createContentMask(): PIXI.Graphics {
    const mask = new PIXI.Graphics();
    mask.beginFill(0xFFFFFF);
    mask.drawRect(0, this.titleHeight, this.size.width, this.size.height - this.titleHeight);
    mask.endFill();
    return mask;
  }

  public destroy(): void {
    this.eventManager.emit('window:destroyed', { id: this.id });
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
    
    const x = this.size.width - padding - btnSize;
    const y = this.titleHeight / 2;

    closeBtn.beginFill(theme.colors.window.buttons.close.default);
    closeBtn.drawCircle(x, y, btnSize / 2);
    closeBtn.endFill();

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
    
    const x = this.size.width - padding * 2 - btnSize * 2;
    const y = this.titleHeight / 2 - btnSize / 2;

    minimizeBtn.beginFill(theme.colors.window.buttons.minimize.default);
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
    this.size.height = this.minimized ? this.titleHeight : WINDOW_DEFAULTS.DEFAULT_HEIGHT;
    this.draw();
  }

  public getContentContainer(): PIXI.Container {
    return this.contentArea;
  }

  public bringToFront(): void {
    if (this.container.parent) {
      this.container.parent.addChild(this.container);
    }
  }
} 