// 新增錯誤處理機制
export class PixiError extends Error {
    constructor(
        message: string,
        public code: string,
        public details?: any
    ) {
        super(message);
        this.name = 'PixiError';
    }
}

export const errorHandler = (error: unknown) => {
    if (error instanceof PixiError) {
        console.error(`[${error.code}] ${error.message}`, error.details);
    } else {
        console.error('Unexpected error:', error);
    }
}; 