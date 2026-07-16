/**
 * 파일: src/components/weather/rain/RainEffect.jsx
 * 분류: 날씨 시각 효과 모듈
 *
 * 역할
 * - Canvas/WebGL 기반 빗방울 애니메이션의 생명주기를 관리합니다.
 *
 * 사용 기술
 * - Canvas, WebGL, useEffect cleanup
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
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

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default function RainEffect({
  backgroundImageUrl = "/assets/rainycolor.png",
  type = "rain",
  className = "",
}) {
  // 렌더링을 발생시키지 않고 DOM 또는 이전 실행 여부를 기억하기 위해 useRef를 사용합니다.
  const containerRef = useRef(null);
  // 렌더링을 발생시키지 않고 DOM 또는 이전 실행 여부를 기억하기 위해 useRef를 사용합니다.
  const canvasRef = useRef(null);

  // 컴포넌트 렌더링 이후 API 호출, DOM 동기화 또는 이벤트 정리가 필요할 때 실행합니다.
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

  // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
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
