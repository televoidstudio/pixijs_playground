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
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
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
                    backgroundColor: 0x000000,
                    resolution: ratio,
                    autoDensity: true,
                });

                console.log("✅ Pixi App Initialized");

                if (!app.canvas) {
                    throw new Error("Pixi.js canvas 仍然未初始化");
                }

                if (containerRef.current && containerRef.current.childNodes.length === 0) {
                    containerRef.current.appendChild(app.canvas);
                }

                appRef.current = app;

                // **初始化粒子爆炸**
                startParticleExplosions(app);

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

            if (intervalRef.current) {
                clearTimeout(intervalRef.current);
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

/** 📌 触发粒子爆炸 */
function startParticleExplosions(app: PIXI.Application) {
    const spawnParticles = () => {
        console.log("💥 触发炫酷粒子爆炸");

        const numParticles = 100; // 增加粒子数量
        const particles: PIXI.Graphics[] = [];

        // **随机爆炸位置**
        const explosionX = Math.random() * app.renderer.width;
        const explosionY = Math.random() * app.renderer.height;

        for (let i = 0; i < numParticles; i++) {
            const particle = new PIXI.Graphics();

            // **使用渐变颜色**
            const baseColor = PIXI.Color.shared.setValue([
                Math.random(),
                Math.random(),
                Math.random(),
            ]).toNumber();

            const glowColor = PIXI.Color.shared.setValue([
                Math.random(),
                Math.random(),
                Math.random(),
            ]).toNumber();

            // **光晕外圈**
            const glow = new PIXI.Graphics();
            glow.beginFill(glowColor, 0.3);
            glow.drawCircle(0, 0, Math.random() * 10 + 10);
            glow.endFill();

            // **粒子主体**
            particle.beginFill(baseColor);
            particle.drawCircle(0, 0, Math.random() * 4 + 2);
            particle.endFill();

            // **粒子初始位置**
            particle.x = explosionX;
            particle.y = explosionY;
            glow.x = explosionX;
            glow.y = explosionY;

            // **随机速度和方向**
            (particle as any).velocity = {
                x: (Math.random() - 0.5) * 12,
                y: (Math.random() - 0.5) * 12,
                rotation: (Math.random() - 0.5) * 0.2,
            };

            (glow as any).velocity = { ...((particle as any).velocity) };

            app.stage.addChild(glow);
            app.stage.addChild(particle);
            particles.push(particle);
            particles.push(glow);
        }

        // **粒子动画**
        app.ticker.add(() => {
            particles.forEach((particle) => {
                (particle as any).velocity.y += 0.1; // 模拟重力
                particle.x += (particle as any).velocity.x;
                particle.y += (particle as any).velocity.y;
                particle.alpha *= 0.97; // 渐渐消失
                particle.rotation += (particle as any).velocity.rotation; // 旋转粒子

                // **尾迹效果**
                (particle as any).velocity.x *= 0.98;
                (particle as any).velocity.y *= 0.98;

                // **如果粒子完全透明，则删除**
                if (particle.alpha < 0.05) {
                    app.stage.removeChild(particle);
                    particles.splice(particles.indexOf(particle), 1);
                }
            });
        });

        // **随机下一次爆炸时间（0.2 到 1.5 秒之间）**
        const nextExplosionTime = Math.random() * (500 - 100) + 100;
        setTimeout(spawnParticles, nextExplosionTime);
    };

    // **首次触发**
    spawnParticles();
}

export default PixiCanvas;
