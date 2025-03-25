import { EventBus } from '../core/EventBus';
import { DomainEventPayload } from '../core/types';

/**
 * 領域事件總線
 * 處理所有業務邏輯相關的事件
 */
export class DomainEventBus extends EventBus<DomainEventPayload> {
    private static instance: DomainEventBus;

    private constructor() {
        super();
    }

    /**
     * 獲取 DomainEventBus 單例
     */
    public static getInstance(): DomainEventBus {
        if (!DomainEventBus.instance) {
            DomainEventBus.instance = new DomainEventBus();
        }
        return DomainEventBus.instance;
    }
} 