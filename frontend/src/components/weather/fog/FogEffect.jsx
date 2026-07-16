/**
 * 파일: src/components/weather/fog/FogEffect.jsx
 * 분류: 날씨 시각 효과 모듈
 *
 * 역할
 * - 안개 시각 효과 레이어를 렌더링합니다.
 *
 * 사용 기술
 * - CSS animation, 프레젠테이션 컴포넌트
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import { useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

import fogElementUrl from "./fog-element.png";
import denseFogElementUrl from "./dense-fog-element.png";

const SETTINGS = {
  light: {
    count: 18,
    fogElementRatio: 0.8,
    alphaMin: 0.18,
    alphaMax: 0.32,
    scaleMin: 0.7,
    scaleMax: 1.7,
    moveSpeed: 0.02,
  },
  dense: {
    count: 38,
    fogElementRatio: 0.35,
    alphaMin: 0.1,
    alphaMax: 0.22,
    scaleMin: 1,
    scaleMax: 2.2,
    moveSpeed: 0.04,
  },
};

function seededRandom(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function FogSprite({ texture, initial, windOffset }) {
  // 렌더링을 발생시키지 않고 DOM 또는 이전 실행 여부를 기억하기 위해 useRef를 사용합니다.
  const meshRef = useRef(null);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const time = state.clock.getElapsedTime();
    let x =
      initial.x +
      windOffset.current.x +
      Math.sin(time * initial.driftSpeedX + initial.driftPhaseX) *
        initial.driftAmountX;
    let y =
      initial.y +
      windOffset.current.y +
      Math.cos(time * initial.driftSpeedY + initial.driftPhaseY) *
        initial.driftAmountY;

    if (x > 1.2) x -= 2.4;
    if (x < -1.2) x += 2.4;
    if (y > 1.2) y -= 2.4;
    if (y < -1.2) y += 2.4;

    mesh.position.set(x, y, initial.z);

    const edgeFadeX = Math.min(1, Math.max(0, (1.15 - Math.abs(x)) * 6));
    const edgeFadeY = Math.min(1, Math.max(0, (1.15 - Math.abs(y)) * 6));
    mesh.material.opacity = initial.alpha * edgeFadeX * edgeFadeY;
  });

  // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
  return (
    <mesh ref={meshRef} position={[initial.x, initial.y, initial.z]}>
      <planeGeometry args={[initial.scale, initial.scale]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </mesh>
  );
}

function FogScene({ type }) {
  const textures = useLoader(THREE.TextureLoader, [
    fogElementUrl,
    denseFogElementUrl,
  ]);
  const windOffset = useRef({ x: 0, y: 0 });
  const settings = SETTINGS[type] ?? SETTINGS.light;

  const sprites = useMemo(
    () =>
      Array.from({ length: settings.count }, (_, index) => {
        const random = (offset) => seededRandom(index * 17 + offset);
        return {
          id: index,
          texture:
            random(1) < settings.fogElementRatio ? textures[0] : textures[1],
          x: (random(2) - 0.5) * 2.4,
          y: (random(3) - 0.5) * 2.4,
          z: -0.15 + random(4) * 0.3,
          scale:
            settings.scaleMin +
            random(5) * (settings.scaleMax - settings.scaleMin),
          alpha:
            settings.alphaMin +
            random(6) * (settings.alphaMax - settings.alphaMin),
          driftAmountX: 0.08 + random(7) * 0.18,
          driftAmountY: 0.08 + random(8) * 0.18,
          driftSpeedX: settings.moveSpeed * (0.7 + random(9) * 0.6),
          driftSpeedY: settings.moveSpeed * (0.7 + random(10) * 0.6),
          driftPhaseX: random(11) * Math.PI * 2,
          driftPhaseY: random(12) * Math.PI * 2,
        };
      }),
    [settings, textures]
  );

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const angle = Math.sin(time * 0.035) * 0.45;
    const windSpeed = 0.018 * delta;
    windOffset.current.x += Math.cos(angle) * windSpeed;
    windOffset.current.y += Math.sin(angle) * windSpeed * 0.3;

    if (windOffset.current.x > 1.2) windOffset.current.x -= 2.4;
    if (windOffset.current.y > 1.2) windOffset.current.y -= 2.4;
  });

  return sprites.map((sprite) => (
    <FogSprite
      key={sprite.id}
      texture={sprite.texture}
      initial={sprite}
      windOffset={windOffset}
    />
  ));
}

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default function FogEffect({ type = "light", className = "" }) {
  // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
  return (
    <div
      className={`weather-effect-canvas ${className}`.trim()}
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 1], fov: 75 }}
        gl={{ alpha: true, antialias: true }}
      >
        <FogScene type={type} />
      </Canvas>
    </div>
  );
}
