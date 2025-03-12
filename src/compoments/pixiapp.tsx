import React, { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";

/** 📌 高 DPI Canvas 适配 */
function createHDCanvas(canvas: HTMLCanvasElement, w: number, h: number) {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = w * ratio;
    canvas.height = h * ratio;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    return canvas;
}

const PixiCanvas: React.FC = () => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const appRef = useRef<PIXI.Application | null>(null);
    const ratio = window.devicePixelRatio || 1;

    // **存储窗口尺寸**
    const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        if (!containerRef.current) return;

        if (appRef.current) {
            console.log("Pixi.js 已初始化，跳过重复创建");
            return;
        }

        const initPixi = async () => {
            try {
                console.log(`🎨 初始化 Pixi.js (全屏模式: ${canvasSize.width}x${canvasSize.height})`);

                const canvas = document.createElement("canvas");
                createHDCanvas(canvas, canvasSize.width, canvasSize.height);

                const app = new PIXI.Application();
                await app.init({
                    view: canvas,
                    width: canvasSize.width,
                    height: canvasSize.height,
                    backgroundColor: 0x1a1a1a,
                    resolution: ratio,
                    autoDensity: true,
                });

                console.log("✅ Pixi App Initialized");

                if (containerRef.current && containerRef.current.childNodes.length === 0) {
                    containerRef.current.appendChild(app.canvas);
                }

                appRef.current = app;

                // **初始化可拖動視窗**
                createFloatingWindow(app);

            } catch (error) {
                console.error("Pixi.js Initialization Error:", error);
            }
        };

        initPixi();

        return () => {
            if (appRef.current) {
                console.log("🧹 销毁 Pixi 应用");
                appRef.current.destroy(true);
                appRef.current = null;
            }
        };
    }, [canvasSize]);

    // **监听窗口大小变化**
    useEffect(() => {
        const handleResize = () => {
            setCanvasSize({ width: window.innerWidth, height: window.innerHeight });

            // **如果 Pixi.js 已经初始化，则更新大小**
            if (appRef.current) {
                appRef.current.renderer.resize(window.innerWidth, window.innerHeight);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return <div ref={containerRef} style={{ width: "100vw", height: "100vh", position: "fixed", top: 0, left: 0 }} />;
};

/** 📌 创建可拖动 + 可缩放窗口 */
function createFloatingWindow(app: PIXI.Application) {
    const container = new PIXI.Container();
    app.stage.addChild(container);

    // **窗口参数**
    let width = 300, height = 200;
    let dragging = false, resizing = false;
    let dragOffset = { x: 0, y: 0 };
    let resizeOffset = { x: 0, y: 0 };

    // **窗口背景**
    const bg = new PIXI.Graphics();
    function drawWindow() {
        bg.clear();
        bg.beginFill(0x8aa6a3);
        bg.drawRoundedRect(0, 0, width, height, 10);
        bg.endFill();
    }
    drawWindow();

    container.addChild(bg);

    // **窗口标题栏**
    const titleBar = new PIXI.Graphics();
    titleBar.beginFill(0x10403b);
    titleBar.drawRoundedRect(0, 0, width, 40, 10);
    titleBar.endFill();
    container.addChild(titleBar);

    // **窗口标题**
    const titleText = new PIXI.Text("Floating Window", {
        fill: "#ffffff",
        fontSize: 18,
        fontWeight: "bold",
    });
    titleText.x = 15;
    titleText.y = 10;
    container.addChild(titleText);

    // **右下角拖动控制点**
    const resizeHandle = new PIXI.Graphics();
    function drawResizeHandle() {
        resizeHandle.clear();
        resizeHandle.beginFill(0x444444);
        resizeHandle.drawRect(width - 16, height - 16, 16, 16);
        resizeHandle.endFill();
    }
    drawResizeHandle();
    container.addChild(resizeHandle);

    // **事件监听**
    titleBar.eventMode = "static";
    titleBar.on("pointerdown", (e) => {
        dragging = true;
        dragOffset.x = e.global.x - container.x;
        dragOffset.y = e.global.y - container.y;
    });

    resizeHandle.eventMode = "static";
    resizeHandle.on("pointerdown", (e) => {
        resizing = true;
        resizeOffset.x = e.global.x - (container.x + width);
        resizeOffset.y = e.global.y - (container.y + height);
    });

    app.stage.eventMode = "static";
    app.stage.on("pointermove", (e) => {
        if (dragging) {
            container.x = e.global.x - dragOffset.x;
            container.y = e.global.y - dragOffset.y;
        }
        if (resizing) {
            width = Math.max(100, e.global.x - container.x - resizeOffset.x);
            height = Math.max(80, e.global.y - container.y - resizeOffset.y);
            drawWindow();
            drawResizeHandle();
        }
    });

    app.stage.on("pointerup", () => {
        dragging = false;
        resizing = false;
    });

    app.stage.on("pointerupoutside", () => {
        dragging = false;
        resizing = false;
    });

    container.x = (app.renderer.width - width) / 2;
    container.y = (app.renderer.height - height) / 2;
}

export default PixiCanvas;
