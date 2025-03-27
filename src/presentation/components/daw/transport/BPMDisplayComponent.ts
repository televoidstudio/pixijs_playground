import * as PIXI from "pixi.js";
import { BaseComponent } from "../../../core/BaseComponent";

/**
 * BPM 顯示組件
 * 負責顯示和控制 DAW 的 BPM 值
 */
export class BPMDisplayComponent extends BaseComponent {
    private static readonly MIN_BPM = 20;
    private static readonly MAX_BPM = 300;
    private static readonly COMPONENT_WIDTH = 90;
    private static readonly COMPONENT_HEIGHT = 40;

    private bpmText: PIXI.Text;
    private background: PIXI.Graphics;
    private currentBPM: number = 120;
    private currentInput: HTMLInputElement | null = null;

    constructor(id: string) {
        super(id);
        this.init();
    }

    private init(): void {
        // 創建背景
        this.background = new PIXI.Graphics();
        this.container.addChild(this.background);

        // 創建 BPM 文字
        this.bpmText = new PIXI.Text({
            text: "120 BPM",
            style: {
                fontSize: 16,
                fill: 0xffffff,
                fontFamily: 'Arial',
                fontWeight: 'bold'
            }
        });

        // 設置文字位置
        this.bpmText.anchor.set(0.5);
        this.bpmText.position.set(45, 20);

        // 繪製背景
        this.drawBackground();

        this.container.addChild(this.bpmText);

        // 設置互動
        this.container.eventMode = 'static';
        this.container.cursor = 'pointer';
        this.container.on('click', this.onClick.bind(this));
    }

    private drawBackground(): void {
        this.background
            .clear()
            .fill({ color: 0x2d2d2d })
            .roundRect(0, 0, BPMDisplayComponent.COMPONENT_WIDTH, BPMDisplayComponent.COMPONENT_HEIGHT, 4);
    }

    private onClick(): void {
        if (this.currentInput) {
            this.removeInput();
            return;
        }
        this.showInput();
    }

    private showInput(): void {
        this.currentInput = document.createElement('input');
        Object.assign(this.currentInput.style, {
            position: 'absolute',
            width: `${BPMDisplayComponent.COMPONENT_WIDTH}px`,
            height: `${BPMDisplayComponent.COMPONENT_HEIGHT}px`,
            fontSize: '16px',
            textAlign: 'center',
            border: '1px solid #666',
            borderRadius: '4px',
            backgroundColor: '#2d2d2d',
            color: '#ffffff',
            fontWeight: 'bold',
            padding: '0',
            margin: '0',
            boxSizing: 'border-box',
            outline: 'none'
        });

        this.currentInput.type = 'number';
        this.currentInput.value = this.currentBPM.toString();
        this.currentInput.min = BPMDisplayComponent.MIN_BPM.toString();
        this.currentInput.max = BPMDisplayComponent.MAX_BPM.toString();

        // 定位輸入框
        const globalPosition = this.container.getGlobalPosition();
        this.currentInput.style.left = `${globalPosition.x}px`;
        this.currentInput.style.top = `${globalPosition.y}px`;

        // 設置事件處理
        this.currentInput.onblur = () => {
            requestAnimationFrame(() => this.handleInputComplete());
        };

        this.currentInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                this.handleInputComplete();
            } else if (e.key === 'Escape') {
                this.removeInput();
            }
        };

        document.body.appendChild(this.currentInput);
        this.currentInput.focus();
        this.currentInput.select();
    }

    private handleInputComplete(): void {
        if (!this.currentInput) return;

        const newBPM = parseInt(this.currentInput.value);
        if (!isNaN(newBPM) && newBPM >= BPMDisplayComponent.MIN_BPM && newBPM <= BPMDisplayComponent.MAX_BPM) {
            this.setBPM(newBPM);
            this.uiEventBus.emit('ui:transport:bpm:update', { bpm: this.currentBPM });
        }

        this.removeInput();
    }

    private removeInput(): void {
        if (!this.currentInput) return;

        this.currentInput.onblur = null;
        this.currentInput.onkeydown = null;
        
        if (this.currentInput.parentNode) {
            this.currentInput.parentNode.removeChild(this.currentInput);
        }
        
        this.currentInput = null;
    }

    public setBPM(bpm: number): void {
        this.currentBPM = bpm;
        this.bpmText.text = `${bpm} BPM`;
    }

    public getWidth(): number {
        return BPMDisplayComponent.COMPONENT_WIDTH;
    }

    public destroy(): void {
        this.removeInput();
        this.container.destroy({ children: true });
        super.destroy();
    }

    public update(): void {
        this.drawBackground();
    }

    // 為了與現有系統兼容的方法
    public initialize(): void {
        // 已在構造函數中調用 init()
    }

    protected setupComponent(): void {
        // 已在 init() 中實現
    }

    protected setupEventHandlers(): void {
        // 已在 init() 中實現
    }
} 