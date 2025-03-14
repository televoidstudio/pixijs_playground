import * as PIXI from "pixi.js";
import { IFloatingWindow } from "./IFloatingWindow";

interface IResizableHandle {
    handle: PIXI.Graphics;
    parent: IFloatingWindow;
    draw(): void;
    enableResize(): void;
}

export class ResizableHandle implements IResizableHandle {
    public handle: PIXI.Graphics;

    constructor(public parent: IFloatingWindow) {
        this.handle = new PIXI.Graphics();
        this.draw();
        this.enableResize();
    }

    draw() {
        this.handle.clear();
        this.handle.beginFill(0x444444);
        this.handle.drawRect(this.parent.width - 16, this.parent.height - 16, 16, 16);
        this.handle.endFill();
    }

    enableResize() {
        let resizing = false;
        const offset = { x: 0, y: 0 };

        this.handle.eventMode = "static";
        this.handle.on("pointerdown", (e) => {
            resizing = true;
            offset.x = e.global.x - (this.parent.container.x + this.parent.width);
            offset.y = e.global.y - (this.parent.container.y + this.parent.height);
        });

        this.parent.container.on("pointermove", (e) => {
            if (resizing) {
                this.parent.width = Math.max(this.parent.minWidth, e.global.x - this.parent.container.x - offset.x);
                this.parent.height = Math.max(this.parent.minHeight, e.global.y - this.parent.container.y - offset.y);
                this.parent.draw();
                this.draw();
            }
        });

        this.parent.container.on("pointerup", () => {
            resizing = false;
        });

        this.parent.container.on("pointerupoutside", () => {
            resizing = false;
        });
    }
}