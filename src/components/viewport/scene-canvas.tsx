"use client";

import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EDITOR_CAMERA } from "./camera-config";
import { watchContextLoss } from "./webgl-support";
import { StudioEnvironment } from "./environments/studio-environment";

function EditorCameraControls() {
  return <OrbitControls target={EDITOR_CAMERA.target} minDistance={EDITOR_CAMERA.minDistance}
    maxDistance={EDITOR_CAMERA.maxDistance} maxPolarAngle={Math.PI / 2.03}
    enablePan={false} enableDamping={false} />;
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
    aria-label="نمای سه‌بعدی استودیوی پادکست مدرن"
  >
    <ContextLossMonitor onFailure={onFailure} />
    <EditorCameraControls />
    <StudioEnvironment />
  </Canvas>;
}
