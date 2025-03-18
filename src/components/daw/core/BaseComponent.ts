import * as PIXI from "pixi.js";
import { EventManager } from "../../../utils/EventManager";

export abstract class BaseComponent {
    protected container: PIXI.Container;
    protected eventManager: EventManager;

    constructor() {
        this.container = new PIXI.Container();
        this.eventManager = EventManager.getInstance();
    }

    public getContainer(): PIXI.Container {
        return this.container;
    }

    public abstract update(...args: any[]): void;
    public abstract destroy(): void;
} 