import React, { useEffect, useRef } from "react";
import { PixiManager } from "./PixiManager";
import { FloatingWindow } from "../window/FloatingWindow";
import { EventManager } from "../../utils/EventManager";
import * as PIXI from "pixi.js";

const PixiCanvas: React.FC = () => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const pixiManagerRef = useRef<PixiManager | null>(null);
    const contextMenuRef = useRef<PIXI.Container | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        if (!pixiManagerRef.current) {
            pixiManagerRef.current = new PixiManager(containerRef.current);
            pixiManagerRef.current.init().then(() => {
                // 創建初始視窗
                new FloatingWindow(pixiManagerRef.current!.app!);
                // 設置右鍵選單
                setupContextMenu();
            });
        }

        const handleResize = () => {
            pixiManagerRef.current?.handleResize(window.innerWidth, window.innerHeight);
        };
        
        window.addEventListener("resize", handleResize);

        return () => {
            pixiManagerRef.current?.destroy();
            pixiManagerRef.current = null;
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const setupContextMenu = () => {
        if (!pixiManagerRef.current?.app) return;

        const app = pixiManagerRef.current.app;
        app.stage.eventMode = 'static';
        app.stage.hitArea = app.screen;
        
        // 監聽右鍵點擊，使用 rightdown 而不是 rightclick
        app.stage.on('rightdown', (event: PIXI.FederatedPointerEvent) => {
            event.preventDefault?.();  // 防止預設的右鍵選單
            hideContextMenu();
            showContextMenu(event.global.x, event.global.y);
        });

        // 監聽左鍵點擊，用於隱藏選單
        app.stage.on('pointerdown', hideContextMenu);
    };

    const hideContextMenu = () => {
        if (contextMenuRef.current) {
            pixiManagerRef.current?.app?.stage.removeChild(contextMenuRef.current);
            contextMenuRef.current = null;
        }
    };

    const showContextMenu = (x: number, y: number) => {
        if (!pixiManagerRef.current?.app) return;

        const menu = new PIXI.Container();
        contextMenuRef.current = menu;

        // 創建選單背景
        const menuBg = new PIXI.Graphics();
        menuBg.beginFill(0x2c2c2c);
        menuBg.drawRoundedRect(0, 0, 120, 30, 4);
        menuBg.endFill();
        menuBg.alpha = 0.9;

        // 創建選單項目
        const menuItem = new PIXI.Text('新增視窗', {
            fontSize: 14,
            fill: 0xFFFFFF,
            fontFamily: 'Arial'
        });
        menuItem.x = 8;
        menuItem.y = 6;

        // 創建一個可點擊的區域
        const hitArea = new PIXI.Graphics();
        hitArea.beginFill(0xFFFFFF, 0);  // 透明填充
        hitArea.drawRect(0, 0, 120, 30);
        hitArea.endFill();
        hitArea.eventMode = 'static';
        hitArea.cursor = 'pointer';

        // 設置互動效果
        hitArea.on('pointerover', () => {
            menuBg.alpha = 1;
        });
        
        hitArea.on('pointerout', () => {
            menuBg.alpha = 0.9;
        });
        
        hitArea.on('pointerdown', () => {
            if (pixiManagerRef.current?.app) {
                // 創建新視窗
                new FloatingWindow(pixiManagerRef.current.app);
                // 隱藏選單
                hideContextMenu();
            }
        });

        // 組裝選單 (順序很重要)
        menu.addChild(menuBg);      // 背景在最底層
        menu.addChild(menuItem);    // 文字在中間
        menu.addChild(hitArea);     // 點擊區域在最上層

        // 設置選單位置
        menu.x = Math.min(x, window.innerWidth - 120);
        menu.y = Math.min(y, window.innerHeight - 30);

        // 將選單加入舞台
        pixiManagerRef.current.app.stage.addChild(menu);
    };

    return (
        <div
            ref={containerRef}
            onContextMenu={(e) => e.preventDefault()}
            style={{
                width: "100vw",
                height: "100vh",
                position: "fixed",
                top: 0,
                left: 0,
            }}
        />
    );
};

export default PixiCanvas; 