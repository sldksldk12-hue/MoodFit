import { useEffect, useRef } from "react";

import RainRenderer from "./rain-renderer.jsx";
import Raindrops from "./raindrops.jsx";
import loadImages from "./image-loader.jsx";
import createCanvas from "./create-canvas.jsx";
import { weatherData } from "./rain-utils.jsx";

import dropColorUrl from "./img/drop-color.png";
import dropAlphaUrl from "./img/drop-alpha.png";

function loadBackgroundImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`배경 이미지 로드 실패: ${url}`));
    image.src = url;
  });
}

export default function RainEffect({
  backgroundImageUrl = "/assets/rainycolor.png",
  type = "rain",
  className = "",
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || !backgroundImageUrl) return undefined;

    let cancelled = false;
    let raindrops = null;
    let renderer = null;
    let lightningInterval = null;
    let lightningResetTimer = null;
    let resizeObserver = null;

    const initialize = async () => {
      const [backgroundImage, images] = await Promise.all([
        loadBackgroundImage(backgroundImageUrl),
        loadImages([
          { name: "dropAlpha", src: dropAlphaUrl },
          { name: "dropColor", src: dropColorUrl },
        ]),
      ]);

      if (cancelled) return;

      const createEffect = () => {
        renderer?.destroy?.();
        raindrops?.destroy?.();

        const rect = container.getBoundingClientRect();
        const dpi = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(1, Math.floor(rect.width * dpi));
        const height = Math.max(1, Math.floor(rect.height * dpi));

        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        const weather = weatherData[type] ?? weatherData.rain;

        raindrops = new Raindrops(
          width,
          height,
          dpi,
          images.dropAlpha.img,
          images.dropColor.img,
          {
            trailRate: 1,
            trailScaleRange: [0.2, 0.45],
            collisionRadius: 0.45,
            dropletsCleaningRadiusMultiplier: 0.28,
            ...weather,
          }
        );

        const textureForeground = createCanvas(
          backgroundImage.naturalWidth,
          backgroundImage.naturalHeight
        );
        const textureBackground = createCanvas(
          backgroundImage.naturalWidth,
          backgroundImage.naturalHeight
        );

        textureForeground
          .getContext("2d")
          .drawImage(backgroundImage, 0, 0);
        textureBackground
          .getContext("2d")
          .drawImage(backgroundImage, 0, 0);

        renderer = new RainRenderer(
          canvas,
          raindrops.canvas,
          textureForeground,
          textureBackground,
          null,
          {
            brightness: 1.04,
            alphaMultiply: 16,
            alphaSubtract: 4,
            minRefraction: 128,
          }
        );

        if (type === "storm" || type === "fallout") {
          const flashChance = Number(weather.flashChance) || 0.35;
          const interval = 1000 + 4000 * (1 - flashChance);

          lightningInterval = window.setInterval(() => {
            if (!renderer?.gl) return;
            const flicker = Math.random() * 2;
            renderer.gl.useProgram(renderer.programWater);
            renderer.gl.createUniform("1f", "lightningFlash", flicker);

            window.clearTimeout(lightningResetTimer);
            lightningResetTimer = window.setTimeout(() => {
              if (!renderer?.gl) return;
              renderer.gl.useProgram(renderer.programWater);
              renderer.gl.createUniform("1f", "lightningFlash", 0);
            }, 100 + Math.random() * 200);
          }, interval);
        }
      };

      createEffect();
      resizeObserver = new ResizeObserver(createEffect);
      resizeObserver.observe(container);
    };

    initialize().catch((error) => {
      console.error("3D 비 효과 초기화 실패:", error);
    });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      window.clearInterval(lightningInterval);
      window.clearTimeout(lightningResetTimer);
      renderer?.destroy?.();
      raindrops?.destroy?.();
    };
  }, [backgroundImageUrl, type]);

  return (
    <div
      ref={containerRef}
      className={`weather-effect-canvas ${className}`.trim()}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
