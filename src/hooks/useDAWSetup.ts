import { useEffect } from 'react';
import { DAWManager } from '../components/daw/DAWManager';

export const useDAWSetup = (dawManager: DAWManager | null) => {
    useEffect(() => {
        if (!dawManager) return;

        console.log("Setting up test clips...");

        requestAnimationFrame(() => {
            // 添加三個測試片段，位置更靠前
            dawManager.addClip({
                id: 'clip1',
                trackId: '1',
                startTime: 1,    // 從第一個網格開始
                duration: 4,     
                color: 0x4CAF50, // 亮綠色
                name: '片段 1'
            });

            dawManager.addClip({
                id: 'clip2',
                trackId: '1',
                startTime: 6,    // 在第一個片段後留一個空格
                duration: 3,
                color: 0x2196F3, // 亮藍色
                name: '片段 2'
            });

            dawManager.addClip({
                id: 'clip3',
                trackId: '1',
                startTime: 10,   // 在第二個片段後留一個空格
                duration: 2,
                color: 0xFF5722, // 橙色
                name: '片段 3'
            });

            console.log("Test clips added with adjusted positions");
        });
    }, [dawManager]);
}; 