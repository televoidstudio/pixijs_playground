// 統一配置管理
import { theme } from './theme';
import { constants } from './constants';

export const config = {
    theme,
    constants,
    debug: process.env.NODE_ENV === 'development',
    performance: {
        enableMonitoring: true,
        targetFPS: 60
    }
} as const; 