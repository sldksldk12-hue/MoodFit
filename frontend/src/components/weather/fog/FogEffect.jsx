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

export default function FogEffect({ type = "light", className = "" }) {
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
