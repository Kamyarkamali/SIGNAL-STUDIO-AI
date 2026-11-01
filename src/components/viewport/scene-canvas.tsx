"use client";

import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EDITOR_CAMERA } from "./camera-config";
import { watchContextLoss } from "./webgl-support";

function EditorCameraControls() {
  return <OrbitControls target={EDITOR_CAMERA.target} minDistance={EDITOR_CAMERA.minDistance}
    maxDistance={EDITOR_CAMERA.maxDistance} enablePan={false} enableDamping={false} />;
}

function SceneLighting() {
  return <>
    <ambientLight intensity={1.2} />
    <directionalLight position={[4, 7, 5]} intensity={2.2} />
  </>;
}

function GroundReference() {
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
    <planeGeometry args={[12, 12]} />
    <meshStandardMaterial color="#253644" roughness={1} />
  </mesh>;
}

function DevelopmentObject() {
  return <mesh position={[0, 0.75, 0]} rotation={[0, Math.PI / 5, 0]}>
    <boxGeometry args={[1.5, 1.5, 1.5]} />
    <meshStandardMaterial color="#40d7c5" roughness={0.6} metalness={0.05} />
  </mesh>;
}

function ContextLossMonitor({ onFailure }: { onFailure: () => void }) {
  const canvas = useThree((state) => state.gl.domElement);
  useEffect(() => watchContextLoss(canvas, onFailure), [canvas, onFailure]);
  return null;
}

export default function SceneCanvas({ onFailure }: { onFailure: () => void }) {
  return <Canvas
    frameloop="demand"
    dpr={[1, 1.5]}
    gl={{ antialias: false, alpha: false, stencil: false, powerPreference: "low-power" }}
    camera={{ position: EDITOR_CAMERA.position, fov: EDITOR_CAMERA.fov, near: EDITOR_CAMERA.near, far: EDITOR_CAMERA.far }}
    onCreated={({ gl }) => gl.setClearColor("#14212c")}
    aria-label="نمای سه‌بعدی آزمایشی"
  >
    <ContextLossMonitor onFailure={onFailure} />
    <EditorCameraControls />
    <SceneLighting />
    <GroundReference />
    <DevelopmentObject />
  </Canvas>;
}
