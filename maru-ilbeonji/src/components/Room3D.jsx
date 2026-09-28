import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, RoundedBox } from '@react-three/drei';
import { getFloorTexture } from '../lib/floorTexture.js';

const WALL_H = 3;
const WALL_T = 0.15;

/* 바닥: 새 재질을 즉시 적용하고, 이전 재질을 위에 겹쳐 서서히 페이드아웃 → 부드러운 전환 */
function Floor({ material, width, depth }) {
  const baseTex = useMemo(() => getFloorTexture(material), [material]);
  const overlayRef = useRef();
  const prevTexRef = useRef(null);
  const fade = useRef(0);

  useEffect(() => {
    const repeatX = width / 4;
    const repeatY = depth / 4;
    baseTex.repeat.set(repeatX, repeatY);
    baseTex.needsUpdate = true;
  }, [baseTex, width, depth]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (prevTexRef.current && prevTexRef.current !== baseTex && overlay) {
      overlay.material.map = prevTexRef.current;
      overlay.material.needsUpdate = true;
      fade.current = 1;
    }
    prevTexRef.current = baseTex;
  }, [baseTex]);

  useFrame((_, delta) => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    if (fade.current > 0) {
      fade.current = Math.max(0, fade.current - delta * 2.2);
      overlay.material.opacity = fade.current;
      overlay.visible = true;
    } else if (overlay.visible) {
      overlay.visible = false;
    }
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial map={baseTex} roughness={material.type === 'stone' ? 0.35 : 0.6} metalness={0.02} />
      </mesh>
      <mesh ref={overlayRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} visible={false}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial transparent opacity={0} depthWrite={false} roughness={0.6} />
      </mesh>
    </group>
  );
}

function Walls({ width, depth }) {
  const wallColor = '#ece6dc';
  return (
    <group>
      {/* 뒤쪽 벽 */}
      <mesh position={[0, WALL_H / 2, -depth / 2 - WALL_T / 2]} receiveShadow castShadow>
        <boxGeometry args={[width + WALL_T * 2, WALL_H, WALL_T]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      {/* 왼쪽 벽 */}
      <mesh position={[-width / 2 - WALL_T / 2, WALL_H / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[WALL_T, WALL_H, depth]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      {/* 걸레받이 */}
      <mesh position={[0, 0.06, -depth / 2 + 0.01]}>
        <boxGeometry args={[width, 0.12, 0.03]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-width / 2 + 0.01, 0.06, 0]}>
        <boxGeometry args={[0.03, 0.12, depth]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* 창문 (왼쪽 벽) */}
      <mesh position={[-width / 2 + 0.02, 1.65, 0.3]}>
        <boxGeometry args={[0.04, 1.4, 2.2]} />
        <meshStandardMaterial color="#cfe0ea" emissive="#bcd6e6" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[-width / 2 + 0.04, 1.65, 0.3]}>
        <boxGeometry args={[0.02, 1.4, 0.05]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
      {/* 액자 (뒤쪽 벽) */}
      <mesh position={[-0.6, 1.9, -depth / 2 + 0.03]}>
        <boxGeometry args={[1.2, 0.8, 0.04]} />
        <meshStandardMaterial color="#c9a36b" />
      </mesh>
    </group>
  );
}

function Sofa({ position }) {
  const fabric = '#4a4a4f';
  return (
    <group position={position}>
      <RoundedBox args={[2.6, 0.45, 0.95]} radius={0.06} position={[0, 0.32, 0]} castShadow>
        <meshStandardMaterial color={fabric} roughness={0.95} />
      </RoundedBox>
      <RoundedBox args={[2.6, 0.7, 0.25]} radius={0.06} position={[0, 0.75, -0.36]} castShadow>
        <meshStandardMaterial color={fabric} roughness={0.95} />
      </RoundedBox>
      {[-1.2, 1.2].map((x) => (
        <RoundedBox key={x} args={[0.22, 0.6, 0.95]} radius={0.05} position={[x, 0.45, 0]} castShadow>
          <meshStandardMaterial color={fabric} roughness={0.95} />
        </RoundedBox>
      ))}
      {[-0.55, 0.55].map((x) => (
        <RoundedBox key={x} args={[1.0, 0.14, 0.7]} radius={0.05} position={[x, 0.6, 0.05]} castShadow>
          <meshStandardMaterial color="#5a5a60" roughness={1} />
        </RoundedBox>
      ))}
      <RoundedBox args={[0.45, 0.4, 0.14]} radius={0.05} position={[-0.8, 0.85, -0.18]} rotation={[-0.2, 0.2, 0]} castShadow>
        <meshStandardMaterial color="#c9a36b" roughness={1} />
      </RoundedBox>
      {/* 다리 */}
      {[[-1.2, -0.4], [1.2, -0.4], [-1.2, 0.4], [1.2, 0.4]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.05, z]}>
          <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}
    </group>
  );
}

function CoffeeTable({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.05, 40]} />
        <meshStandardMaterial color="#2b2b2b" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.18, 0.38, 16]} />
        <meshStandardMaterial color="#2b2b2b" />
      </mesh>
      <mesh position={[0.15, 0.48, 0.05]} castShadow>
        <cylinderGeometry args={[0.07, 0.06, 0.12, 16]} />
        <meshStandardMaterial color="#e8dcc8" />
      </mesh>
    </group>
  );
}

function TvStand({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[2.2, 0.5, 0.45]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.2, -0.12]} castShadow>
        <boxGeometry args={[1.8, 1.0, 0.06]} />
        <meshStandardMaterial color="#111" roughness={0.2} metalness={0.3} />
      </mesh>
    </group>
  );
}

function Plant({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.16, 0.44, 20]} />
        <meshStandardMaterial color="#d9cbb3" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow>
        <sphereGeometry args={[0.38, 20, 20]} />
        <meshStandardMaterial color="#5f7a4f" roughness={0.9} />
      </mesh>
      <mesh position={[0.12, 1.15, 0.05]} castShadow>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshStandardMaterial color="#6d8a5b" roughness={0.9} />
      </mesh>
    </group>
  );
}

/* 뷰어 크기에 맞춰 아이소메트릭 줌 자동 조정 (반응형) */
function ResponsiveZoom({ roomSize }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const fit = Math.min(size.width / (roomSize * 2.1), size.height / (roomSize * 1.45));
    camera.zoom = Math.max(18, Math.min(90, fit));
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height, roomSize]);
  return null;
}

export default function Room3D({ material, livingArea = 12 }) {
  // 거실 면적에 비례해 룸 크기 조정 (12평 기준 7m x 5.5m)
  const scale = Math.sqrt(livingArea / 12);
  const width = +(7 * scale).toFixed(2);
  const depth = +(5.5 * scale).toFixed(2);

  return (
    <div className="room3d">
      <Canvas
        shadows
        orthographic
        dpr={[1, 2]}
        camera={{ position: [12, 10, 12], zoom: 55, near: 0.1, far: 200 }}
      >
        <ResponsiveZoom roomSize={Math.max(width, depth)} />
        <color attach="background" args={['#f3efe8']} />
        <ambientLight intensity={0.65} />
        <hemisphereLight args={['#fff8ee', '#b9a88f', 0.35]} />
        <directionalLight
          position={[6, 10, 5]}
          intensity={1.4}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <group position={[0, -0.8, 0]}>
          <Floor material={material} width={width} depth={depth} />
          <Walls width={width} depth={depth} />
          <Sofa position={[0.3, 0, -depth / 2 + 0.75]} />
          <CoffeeTable position={[0.3, 0, -depth / 2 + 2.2]} />
          <TvStand position={[0.3, 0, depth / 2 - 0.4]} />
          <Plant position={[-width / 2 + 0.5, 0, -depth / 2 + 0.5]} />
          <ContactShadows position={[0, 0.003, 0]} opacity={0.35} scale={Math.max(width, depth) + 2} blur={2.2} far={3} />
        </group>
        <OrbitControls
          makeDefault
          enablePan={false}
          minZoom={15}
          maxZoom={120}
          minPolarAngle={0.25}
          maxPolarAngle={Math.PI / 2.3}
          target={[0, 0, 0]}
        />
      </Canvas>
      <p className="room3d__hint">드래그하여 회전 · 스크롤하여 확대/축소</p>
    </div>
  );
}
