import * as PIXI from 'pixi.js';
import { DAWConstants } from '../../config/constants';

export class Button extends PIXI.Container {
    private background: PIXI.Graphics;
    private labelText: PIXI.Text;

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

        this.labelText = new PIXI.Text({
            text,
            style: {
                fill: textColor,
                fontSize: 14,
                fontFamily: 'Arial'
            }
        });

        this.labelText.anchor.set(0.5);
        this.labelText.position.set(width / 2, height / 2);

        this.addChild(this.background, this.labelText);
        
        this.eventMode = 'static';
        this.cursor = 'pointer';
    }

    public setEnabled(enabled: boolean): void {
        this.eventMode = enabled ? 'static' : 'none';
        this.alpha = enabled ? 1 : 0.5;
    }
} 