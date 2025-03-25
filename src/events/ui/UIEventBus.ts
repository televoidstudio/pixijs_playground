import { EventBus } from '../core/EventBus';
import { UIEventPayload } from '../core/types';

/**
 * UI 事件總線
 * 處理所有用戶界面相關的事件
 */
export class UIEventBus extends EventBus<UIEventPayload> {
    private static instance: UIEventBus;

    private constructor() {
        super();
    }

    /**
     * 獲取 UIEventBus 單例
     */
    public static getInstance(): UIEventBus {
        if (!UIEventBus.instance) {
            UIEventBus.instance = new UIEventBus();
        }
        return UIEventBus.instance;
    }
} 