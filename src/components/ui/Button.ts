import * as PIXI from 'pixi.js';
import { DAWConstants } from '../../config/constants';

export class Button extends PIXI.Container {
    private background: PIXI.Graphics;
    private label: PIXI.Text;

    constructor(text: string, options: {
        width?: number;
        height?: number;
        backgroundColor?: number;
        textColor?: number;
    } = {}) {
        super();
        
        const {
            width = 80,
            height = 30,
            backgroundColor = DAWConstants.COLORS.BACKGROUND,
            textColor = 0xffffff
        } = options;

        this.background = new PIXI.Graphics()
            .fill({ color: backgroundColor })
            .roundRect(0, 0, width, height, 4);

        this.label = new PIXI.Text({
            text,
            style: {
                fill: textColor,
                fontSize: 14,
                fontFamily: 'Arial'
            }
        });

        this.label.anchor.set(0.5);
        this.label.position.set(width / 2, height / 2);

        this.addChild(this.background, this.label);
        
        this.eventMode = 'static';
        this.cursor = 'pointer';
    }

    public setEnabled(enabled: boolean): void {
        this.eventMode = enabled ? 'static' : 'none';
        this.alpha = enabled ? 1 : 0.5;
    }
} 