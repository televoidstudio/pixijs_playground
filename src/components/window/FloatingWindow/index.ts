import { Container, Graphics, Text, Application } from 'pixi.js';
import { IFloatingWindow } from '../../../types/window';
import { EventManager } from '../../../utils/EventManager';
import { theme } from '../../../config/theme';
import { constants } from '../../../config/constants';

export class FloatingWindow implements IFloatingWindow {
  id: string;
  container: Container;
  position: { x: number; y: number };
  size: { width: number; height: number };
  titleHeight: number;
  minWidth: number;
  minHeight: number;
  minimized: boolean;
  bg: Graphics;
  titleBar: Graphics;
  titleText: Text;

  constructor(app: Application) {
    this.id = `window-${Date.now()}`;
    this.container = new Container();
    this.position = { x: 100, y: 100 };
    this.size = { 
      width: constants.window.defaultWidth, 
      height: constants.window.defaultHeight 
    };
    this.titleHeight = constants.window.titleHeight;
    this.minWidth = constants.window.minWidth;
    this.minHeight = constants.window.minHeight;
    this.minimized = false;

    this.bg = new Graphics();
    this.titleBar = new Graphics();
    this.titleText = new Text('Window', {
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xffffff,
    });

    this.initializeComponents();
    this.setupEvents();
    EventManager.emit('window:created', { id: this.id });
  }

  private initializeComponents(): void {
    // 創建背景
    this.bg.beginFill(theme.window.background);
    this.bg.drawRect(0, 0, this.size.width, this.size.height);
    this.bg.endFill();
    this.container.addChild(this.bg);

    // 創建標題欄
    this.titleBar.beginFill(theme.window.titleBar);
    this.titleBar.drawRect(0, 0, this.size.width, this.titleHeight);
    this.titleBar.endFill();
    this.container.addChild(this.titleBar);

    // 創建標題文字
    this.titleText.x = 10;
    this.titleText.y = 5;
    this.container.addChild(this.titleText);

    // 設置容器位置
    this.container.x = this.position.x;
    this.container.y = this.position.y;
  }

  private setupEvents(): void {
    // 設置拖動事件
    this.titleBar.eventMode = 'static';
    this.titleBar.cursor = 'pointer';

    let dragging = false;
    let dragData: any = null;

    this.titleBar.on('pointerdown', (event: any) => {
      dragging = true;
      dragData = event.data;
    });

    this.titleBar.on('pointerup', () => {
      dragging = false;
      dragData = null;
    });

    this.titleBar.on('pointerupoutside', () => {
      dragging = false;
      dragData = null;
    });

    this.titleBar.on('pointermove', (event: any) => {
      if (dragging) {
        const newPosition = dragData.getLocalPosition(this.container.parent);
        this.position = {
          x: newPosition.x - this.size.width / 2,
          y: newPosition.y - this.titleHeight / 2,
        };
        this.container.x = this.position.x;
        this.container.y = this.position.y;
      }
    });
  }

  public draw(): void {
    this.bg.clear();
    this.bg.beginFill(theme.window.background);
    this.bg.drawRect(0, 0, this.size.width, this.size.height);
    this.bg.endFill();

    this.titleBar.clear();
    this.titleBar.beginFill(theme.window.titleBar);
    this.titleBar.drawRect(0, 0, this.size.width, this.titleHeight);
    this.titleBar.endFill();
  }

  public bringToFront(): void {
    if (this.container.parent) {
      this.container.parent.addChild(this.container);
    }
  }

  public setTitle(title: string): void {
    this.titleText.text = title;
  }

  public setPosition(x: number, y: number): void {
    this.position = { x, y };
    this.container.x = x;
    this.container.y = y;
  }

  public setSize(width: number, height: number): void {
    this.size = { width, height };
    this.draw();
  }

  public toggleMinimize(): void {
    this.minimized = !this.minimized;
    this.container.visible = !this.minimized;
  }
} 