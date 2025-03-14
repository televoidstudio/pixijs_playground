import * as PIXI from "pixi.js";

interface IDraggable {
    target: PIXI.Container;
    enableDrag(): void;
}

export class Draggable implements IDraggable {
    constructor(public target: PIXI.Container) {
        this.enableDrag();
    }

    enableDrag() {
        let dragging = false;
        let offset = { x: 0, y: 0 };

        this.target.eventMode = "static";
        this.target.on("pointerdown", (e) => {
            dragging = true;
            offset.x = e.global.x - this.target.x;
            offset.y = e.global.y - this.target.y;
        });

        this.target.on("pointermove", (e) => {
            if (dragging) {
                this.target.x = e.global.x - offset.x;
                this.target.y = e.global.y - offset.y;
            }
        });

        this.target.on("pointerup", () => {
            dragging = false;
        });

        this.target.on("pointerupoutside", () => {
            dragging = false;
        });
    }
}