/**
 * 파일: src/components/weather/snow/SnowEffect.jsx
 * 분류: 날씨 시각 효과 모듈
 *
 * 역할
 * - 눈 입자 애니메이션을 생성하고 컴포넌트 해제 시 정리합니다.
 *
 * 사용 기술
 * - Canvas animation, useEffect cleanup
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

import snowflakeUrl from "./snowflake.png";

const SETTINGS = {
  gentle: {
    count: 1800,
    gravity: 20,
    alphaMin: 0.2,
    alphaMax: 0.65,
    sizeMin: 5,
    sizeMax: 15,
    speedXMin: 0.2,
    speedXMax: 0.5,
    speedYMin: 0.5,
    speedYMax: 1,
    swayMax: 5,
  },
  storm: {
    count: 4200,
    gravity: 45,
    alphaMin: 0.25,
    alphaMax: 0.8,
    sizeMin: 7,
    sizeMax: 18,
    speedXMin: 0.4,
    speedXMax: 1,
    speedYMin: 1.2,
    speedYMax: 2,
    swayMax: 12,
  },
};

const vertexShader = `
  precision highp float;
  attribute float size;
  attribute vec3 speed;
  attribute float alpha;
  varying float vAlpha;
  uniform float uTime;
  uniform float uGravity;
  uniform float uWind;
  uniform vec3 uWorldSize;

  void main() {
    vAlpha = alpha;
    vec3 pos = position;
    pos.x = mod(pos.x + uTime * speed.x + uWind, uWorldSize.x * 2.0) - uWorldSize.x;
    pos.y = mod(pos.y - uTime * speed.y * uGravity, uWorldSize.y * 2.0) - uWorldSize.y;
    pos.x += sin(uTime * speed.z) * 3.0;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = size * (110.0 / -mvPosition.z);
  }
`;

const fragmentShader = `
  precision highp float;
  uniform sampler2D uTexture;
  varying float vAlpha;

  void main() {
    vec4 flake = texture2D(uTexture, gl_PointCoord);
    gl_FragColor = vec4(flake.rgb, flake.a * vAlpha);
  }
`;

function seededRandom(seed) {
  const value = Math.sin(seed * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function SnowParticles({ type }) {
  // 렌더링을 발생시키지 않고 DOM 또는 이전 실행 여부를 기억하기 위해 useRef를 사용합니다.
  const materialRef = useRef(null);
  const texture = useLoader(THREE.TextureLoader, snowflakeUrl);
  const settings = SETTINGS[type] ?? SETTINGS.gentle;
  const worldSize = useMemo(() => new THREE.Vector3(110, 110, 80), []);

  const attributes = useMemo(() => {
    const positions = new Float32Array(settings.count * 3);
    const speeds = new Float32Array(settings.count * 3);
    const sizes = new Float32Array(settings.count);
    const alphas = new Float32Array(settings.count);

    for (let index = 0; index < settings.count; index += 1) {
      const random = (offset) => seededRandom(index * 13 + offset);
      const p = index * 3;
      positions[p] = -110 + random(1) * 220;
      positions[p + 1] = -110 + random(2) * 220;
      positions[p + 2] = random(3) * 160;
      speeds[p] =
        settings.speedXMin +
        random(4) * (settings.speedXMax - settings.speedXMin);
      speeds[p + 1] =
        settings.speedYMin +
        random(5) * (settings.speedYMax - settings.speedYMin);
      speeds[p + 2] = random(6) * settings.swayMax;
      sizes[index] =
        settings.sizeMin + random(7) * (settings.sizeMax - settings.sizeMin);
      alphas[index] =
        settings.alphaMin + random(8) * (settings.alphaMax - settings.alphaMin);
    }

    return { positions, speeds, sizes, alphas };
  }, [settings]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTexture: { value: texture },
      uWorldSize: { value: worldSize },
      uGravity: { value: settings.gravity },
      uWind: { value: 0 },
    }),
    [settings.gravity, texture, worldSize]
  );

  useFrame((state) => {
    if (!materialRef.current) return;
    const time = state.clock.getElapsedTime();
    materialRef.current.uniforms.uTime.value = time;
    materialRef.current.uniforms.uWind.value =
      Math.sin(time * (type === "storm" ? 0.55 : 0.18)) *
      (type === "storm" ? 14 : 4);
  });

  // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[attributes.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-speed"
          args={[attributes.speeds, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[attributes.sizes, 1]}
        />
        <bufferAttribute
          attach="attributes-alpha"
          args={[attributes.alphas, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default function SnowEffect({ type = "gentle", className = "" }) {
  // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
  return (
    <div
      className={`weather-effect-canvas ${className}`.trim()}
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 100], fov: 75 }}
        gl={{ alpha: true, antialias: true }}
      >
        <SnowParticles type={type} />
      </Canvas>
    </div>
  );
}
