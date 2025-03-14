import * as PIXI from "pixi.js";
import { IFloatingWindow } from "./IFloatingWindow";
import { Draggable } from "./Draggable";
import { ResizableHandle } from "./ResizableHandle";

export class FloatingWindow implements IFloatingWindow {
    public container: PIXI.Container;
    public width: number;
    public height: number;
    public titleHeight: number = 40;
    public minWidth: number = 100;
    public minHeight: number = 80;

    private bg: PIXI.Graphics;
    private titleBar: PIXI.Graphics;
    private contentArea: PIXI.Container;  // 用來包裝內容的容器
    private minimized = false;            // 是否已最小化

    constructor(private app: PIXI.Application, width: number, height: number) {
        this.width = width;
        this.height = height;

        this.container = new PIXI.Container();
        this.app.stage.addChild(this.container);

        // 背景 & 標題欄
        this.bg = new PIXI.Graphics();
        this.titleBar = new PIXI.Graphics();
        // 內容容器
        this.contentArea = new PIXI.Container();

        this.draw();
        this.enableDrag();
        this.enableResize();
        this.enableClose();      // 加上關閉
        this.enableMinimize();   // 加上最小化
    }

    draw() {
        // 1) 視窗背景
        this.bg.clear();
        this.bg.beginFill(0x8aa6a3);
        this.bg.drawRoundedRect(0, 0, this.width, this.height, 10);
        this.bg.endFill();

        // 2) 標題欄
        this.titleBar.clear();
        this.titleBar.beginFill(0x10403b);
        this.titleBar.drawRoundedRect(0, 0, this.width, this.titleHeight, 10);
        this.titleBar.endFill();

        // 重新將物件加到容器，避免重疊順序混亂
        this.container.removeChildren();
        this.container.addChild(this.bg);
        this.container.addChild(this.titleBar);

        // 3) 內容區域
        this.contentArea.y = this.titleHeight;
        if (!this.minimized) {
            this.container.addChild(this.contentArea);
        }
    }

    enableDrag() {
        new Draggable(this.container);
    }

    enableResize() {
        new ResizableHandle(this);
    }

    /** 📌 關閉功能：在右上角加一個按鈕 */
    enableClose() {
        const closeBtn = new PIXI.Graphics();
        closeBtn.beginFill(0xff4444);
        // 畫一個小圓 / 小方塊
        const btnSize = 16;
        closeBtn.drawCircle(this.width - btnSize - 8, this.titleHeight / 2, btnSize / 2);
        closeBtn.endFill();

        // 在上面畫個 X
        closeBtn.lineStyle(2, 0xffffff);
        const cx = this.width - btnSize - 8;
        const cy = this.titleHeight / 2;
        closeBtn.moveTo(cx - 4, cy - 4);
        closeBtn.lineTo(cx + 4, cy + 4);
        closeBtn.moveTo(cx + 4, cy - 4);
        closeBtn.lineTo(cx - 4, cy + 4);

        closeBtn.eventMode = "static";
        closeBtn.on("pointerdown", () => {
            // 把整個 container 從 stage 移除
            this.app.stage.removeChild(this.container);
        });

        this.titleBar.addChild(closeBtn);
    }

    /** 📌 最小化功能：在右上角加一個按鈕 */
    enableMinimize() {
        const minimizeBtn = new PIXI.Graphics();
        minimizeBtn.beginFill(0x4444ff);
        // 畫一個小方塊
        const btnSize = 16;
        minimizeBtn.drawRect(this.width - btnSize * 2 - 16, this.titleHeight / 2 - btnSize / 2, btnSize, btnSize);
        minimizeBtn.endFill();

        minimizeBtn.eventMode = "static";
        minimizeBtn.on("pointerdown", () => {
            this.toggleMinimize();
        });

        this.titleBar.addChild(minimizeBtn);
    }

    /** 📌 切換最小化 / 還原 */
    private toggleMinimize() {
        this.minimized = !this.minimized;
        if (this.minimized) {
            // 最小化後高度只顯示標題欄
            this.height = this.titleHeight;
        } else {
            // 還原高度
            this.height = 200; // 可以記住原本高度
        }
        // 重新繪製
        this.draw();
    }

    // 你可在這裡往 contentArea 加內容
    getContentContainer(): PIXI.Container {
        return this.contentArea;
    }
}
