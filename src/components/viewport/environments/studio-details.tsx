"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { BoxPart, CylinderPart, RoundedBoxPart } from "./parts";
import { laptopVisualSpec } from "@/lib/environments/studio-visual-spec";
import { DisplaySurface } from "./display-surface";
import type { ProjectDocument } from "@/lib/projects/project-schema";
import { ArtworkSurface } from "./artwork-surface";
import { defaultFrameCustomization, defaultSignCustomization, type FrameCustomization, type SignCustomization } from "@/lib/environments/studio-decoration";

const graphite = { color: "#1b252b", roughness: 0.56, metalness: 0.45 };

function LaptopKeyboardSurface() {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 1200; canvas.height = 520;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.fillStyle = "#202a30";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const rows: Array<{ latin: string[]; persian?: string[]; weights?: number[] }> = [
      { latin: ["Esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "⌫"] },
      { latin: [..."QWERTYUIOP", "[", "]", "\\"], persian: [..."ضصثقفغعهخحجچ", "\\"] },
      { latin: ["Tab", ..."ASDFGHJKL", ";", "'", "↵"], persian: ["ط", ..."شسيبلاتنم", "گ", "پ", "↵"], weights: [1.5, ...Array(11).fill(1), 1.6] },
      { latin: ["Shift", ..."ZXCVBNM", ",", ".", "/", "Shift"], persian: ["Shift", ..."ظطزرذدئ", "،", ".", "/", "Shift"], weights: [1.8, ...Array(7).fill(1), 1, 1, 1, 1.8] },
      { latin: ["Ctrl", "Fn", "Win", "Alt", "Space", "Alt", "←", "↓", "↑", "→"], weights: [1.2, 1, 1.2, 1, 4.8, 1, 1, 1, 1, 1] },
    ];
    const marginX = 20; const marginY = 18; const gapX = 8; const gapY = 8;
    const rowHeight = (canvas.height - marginY * 2 - gapY * 4) / 5;
    rows.forEach((row, rowIndex) => {
      const y = marginY + rowIndex * (rowHeight + gapY);
      const totalWeight = row.weights?.reduce((sum, value) => sum + value, 0) ?? row.latin.length;
      const unit = (canvas.width - marginX * 2 - gapX * (row.latin.length - 1)) / totalWeight;
      let offsetX = 0;
      row.latin.forEach((label, index) => {
        const width = unit * (row.weights?.[index] ?? 1);
        const x = marginX + offsetX;
        context.fillStyle = "#10181d";
        context.beginPath(); context.roundRect(x, y + 4, width, rowHeight, 10); context.fill();
        context.fillStyle = "#53646b";
        context.beginPath(); context.roundRect(x, y, width, rowHeight - 5, 9); context.fill();
        context.strokeStyle = "#718187"; context.lineWidth = 2; context.stroke();
        context.fillStyle = "#e2e9e8"; context.font = "600 23px sans-serif"; context.textAlign = "left";
        context.textBaseline = "top"; context.fillText(label, x + 8, y + 6, width - 16);
        const alternate = row.persian?.[index];
        if (alternate) {
          context.fillStyle = "#a9dfd8"; context.font = "600 25px sans-serif"; context.textAlign = "right";
          context.textBaseline = "bottom"; context.direction = "rtl";
          context.fillText(alternate, x + width - 8, y + rowHeight - 11, width - 16);
          context.direction = "ltr";
        }
        offsetX += width + gapX;
      });
    });
    const next = new CanvasTexture(canvas); next.colorSpace = SRGBColorSpace;
    return next;
  }, []);
  useEffect(() => () => texture?.dispose(), [texture]);
  if (!texture) return null;
  return <mesh name="bilingual-keyboard-legends" position={[0, 0.0785, laptopVisualSpec.keyboardCenterZ - 0.022]} rotation={[-Math.PI / 2, 0, 0]}>
    <planeGeometry args={[0.78, 0.31]} /><meshBasicMaterial map={texture} toneMapped={false} />
  </mesh>;
}

export function Laptop({ assignment, url, playing = true }: {
  assignment?: ProjectDocument["displayAssignments"][string]; url?: string; playing?: boolean;
}) {
  return <group>
    <RoundedBoxPart size={laptopVisualSpec.baseSize} position={[0, 0.045, 0.03]} radius={0.017}
      finish={{ color: "#68777d", roughness: 0.39, metalness: 0.62 }} />
    <RoundedBoxPart size={[0.88, 0.009, 0.42]} position={[0, 0.072, 0.075]} radius={0.004}
      finish={{ color: "#253036", roughness: 0.7 }} />
    <LaptopKeyboardSurface />
    <RoundedBoxPart size={[0.24, 0.004, 0.12]} position={[0, 0.079, 0.27]} radius={0.002}
      finish={{ color: "#89979a", roughness: 0.47, metalness: 0.42 }} />
    <BoxPart size={[0.25, 0.002, 0.006]} position={[0, 0.082, 0.212]} finish={{ color: "#c4d0cf", roughness: 0.42 }} />
    {[-0.3, -0.22, -0.14, -0.06, 0.02, 0.1, 0.18, 0.26].map((x) => <BoxPart key={`vent-${x}`}
      size={[0.045, 0.002, 0.006]} position={[x, 0.069, -0.217]} finish={{ color: "#172126", roughness: 0.82 }} />)}
    {[-1, 1].map((side) => <group key={side}>
      <BoxPart size={[0.006, 0.013, 0.045]} position={[side * 0.466, 0.049, -0.08]} finish={{ color: "#12191d", roughness: 0.74 }} />
      <BoxPart size={[0.006, 0.013, 0.027]} position={[side * 0.466, 0.049, 0.005]} finish={{ color: "#12191d", roughness: 0.74 }} />
      <BoxPart size={[0.006, 0.018, 0.018]} position={[side * 0.466, 0.05, 0.09]} finish={{ color: "#12191d", roughness: 0.74 }} />
    </group>)}
    {[-0.31, 0.31].map((x) => <CylinderPart key={x} radiusTop={0.023} height={0.2} position={[x, 0.09, laptopVisualSpec.hingeZ + 0.005]} rotation={[0, 0, Math.PI / 2]}
      finish={{ color: "#404c52", roughness: 0.4, metalness: 0.75 }} />)}
    <group position={[0, 0.11, laptopVisualSpec.hingeZ]} rotation={[laptopVisualSpec.screenTilt, 0, 0]}>
      <RoundedBoxPart size={laptopVisualSpec.screenFrameSize} position={[0, laptopVisualSpec.screenCenter[1], 0]} radius={0.014}
        finish={{ color: "#36434a", roughness: 0.42, metalness: 0.5 }} />
      <CylinderPart radiusTop={0.008} height={0.002} position={[0, 0.446, 0.022]} rotation={[Math.PI / 2, 0, 0]}
        finish={{ color: "#0b1115", roughness: 0.5 }} />
      {/* The display is on local +Z, facing the seated user after the laptop's 180° turn. */}
      <mesh name="display-surface" position={laptopVisualSpec.screenCenter}>
        <planeGeometry args={laptopVisualSpec.screenSurfaceSize} />
        <meshStandardMaterial color={!assignment || assignment.state === "off" ? "#050709" : "#122a34"}
          emissive={!assignment || assignment.state === "off" ? "#000000" : "#17414a"}
          emissiveIntensity={assignment?.state === "off" ? 0 : 0.12} roughness={0.47} metalness={0.08} />
      </mesh>
      <DisplaySurface assignment={assignment} url={url} playing={playing} />
      <CylinderPart radiusTop={0.006} height={0.003} position={[0, 0.453, 0.023]} rotation={[Math.PI / 2, 0, 0]}
        finish={{ color: "#687b81", roughness: 0.48 }} />
    </group>
  </group>;
}

export function PodcastMicrophone() {
  return <group>
    <CylinderPart radiusTop={0.14} height={0.035} position={[0, 0.025, 0]} finish={graphite} />
    <CylinderPart radiusTop={0.025} height={0.4} position={[0, 0.23, 0]} finish={graphite} />
    <CylinderPart radiusTop={0.036} height={0.045} position={[0, 0.42, 0]} finish={{ color: "#889b9d", roughness: 0.36, metalness: 0.7 }} />
    <CylinderPart radiusTop={0.024} height={0.5} position={[0, 0.43, -0.23]} rotation={[Math.PI / 2, 0, 0]} finish={graphite} />
    <CylinderPart radiusTop={0.09} radiusBottom={0.075} height={0.24} position={[0, 0.43, -0.49]} rotation={[Math.PI / 2, 0, 0]}
      finish={{ color: "#36434a", roughness: 0.73, metalness: 0.35 }} />
    <CylinderPart radiusTop={0.095} height={0.035} position={[0, 0.43, -0.61]} rotation={[Math.PI / 2, 0, 0]}
      finish={{ color: "#a0a9a4", roughness: 0.4, metalness: 0.6 }} />
    <CylinderPart radiusTop={0.077} height={0.006} position={[0, 0.43, -0.635]} rotation={[Math.PI / 2, 0, 0]}
      finish={{ color: "#202d32", roughness: 0.85 }} />
  </group>;
}

function SignTextSurface({ text, color }: { text: string; color: string }) {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas"); canvas.width = 1024; canvas.height = 160;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = color; context.font = "600 72px sans-serif"; context.textAlign = "center"; context.textBaseline = "middle";
    context.direction = /[\u0600-\u06ff]/.test(text) ? "rtl" : "ltr";
    context.fillText(text, canvas.width / 2, canvas.height / 2, 960);
    const next = new CanvasTexture(canvas); next.colorSpace = SRGBColorSpace;
    return next;
  }, [text, color]);
  useEffect(() => {
    return () => texture?.dispose();
  }, [texture]);
  if (!texture) return null;
  return <mesh position={[0, 4.23, -4.035]}>
    <planeGeometry args={[2.48, 0.34]} /><meshBasicMaterial map={texture} transparent toneMapped={false} />
  </mesh>;
}

function WallSign({ customization, imageUrl }: { customization?: SignCustomization; imageUrl?: string }) {
  const sign = customization ?? defaultSignCustomization;
  if (!sign.visible) return null;
  return <group position={sign.transform.position} rotation={sign.transform.rotation} scale={sign.transform.scale}>
    <BoxPart size={[2.7, 0.05, 0.12]} position={[0, 4.23, -4.12]}
      finish={{ color: sign.backgroundColor, emissive: sign.glowColor, emissiveIntensity: sign.illumination, roughness: 0.48 }} />
    {sign.design !== "default" && <>
      <mesh position={[0, 4.23, -4.054]}>
        <planeGeometry args={[2.52, 0.38]} /><meshStandardMaterial color={sign.backgroundColor} emissive={sign.glowColor} emissiveIntensity={sign.illumination * 0.35} toneMapped={false} />
      </mesh>
      {sign.design === "text" && <SignTextSurface text={sign.text} color={sign.textColor} />}
      {sign.design === "image" && <ArtworkSurface url={imageUrl} size={[2.48, 0.34]} fit={sign.fit} z={-4.032} />}
    </>}
  </group>;
}

export function PracticalLights({ sign, signImageUrl, lightsEnabled = true }: { sign?: SignCustomization; signImageUrl?: string; lightsEnabled?: boolean }) {
  return <group>
    <WallSign customization={sign} imageUrl={signImageUrl} />
    {[-2.75, 2.75].map((x) => <group key={x}>
      <CylinderPart radiusTop={0.017} height={0.77} position={[x, 4.35, -1.7]} finish={graphite} />
      <CylinderPart radiusTop={0.24} radiusBottom={0.38} height={0.31} position={[x, 3.78, -1.7]}
        finish={{ color: "#6f513d", roughness: 0.6, metalness: 0.22 }} />
      <CylinderPart radiusTop={0.245} height={0.035} position={[x, 3.61, -1.7]}
        finish={{ color: "#e1ad70", emissive: "#d68d43", emissiveIntensity: lightsEnabled ? 1.2 : 0.08, roughness: 0.5 }} />
      {lightsEnabled && <pointLight position={[x, 3.46, -1.7]} color="#ffca88" intensity={0.48} distance={3.5} decay={2} />}
    </group>)}
  </group>;
}

export function Plant() {
  return <group>
    <CylinderPart radiusTop={0.31} radiusBottom={0.24} height={0.55} position={[0, 0.3, 0]}
      finish={{ color: "#9b8977", roughness: 0.95 }} />
    <CylinderPart radiusTop={0.285} height={0.045} position={[0, 0.55, 0]}
      finish={{ color: "#b1a08a", roughness: 0.78 }} />
    <CylinderPart radiusTop={0.045} height={1.0} position={[0, 0.92, 0]} finish={{ color: "#3f5b3b", roughness: 1 }} />
    {[-1.2, -0.6, 0, 0.6, 1.2].map((angle, index) => <group key={index} rotation={[0, angle, 0]}>
      <mesh position={[0.24, 1.06 + index * 0.095, 0]} rotation={[0, 0, -0.58]}>
        <coneGeometry args={[0.22, 0.7, 5]} />
        <meshStandardMaterial color={index % 2 ? "#4d7963" : "#426c58"} roughness={1} side={2} />
      </mesh>
    </group>)}
  </group>;
}

export function WallArt({ frames, imageUrls = [undefined, undefined] }: { frames?: [FrameCustomization, FrameCustomization]; imageUrls?: [string | undefined, string | undefined] }) {
  return <group>
    {[3.5, 4.65].map((x, index) => <group key={index}>
      {(() => {
        const frame = frames?.[index as 0 | 1] ?? defaultFrameCustomization();
        if (!frame.visible) return null;
        return <group position={[x + frame.transform.position[0], 2.8 + frame.transform.position[1], -4.24 + frame.transform.position[2]]}
          rotation={frame.transform.rotation} scale={frame.transform.scale}>
          <BoxPart size={[0.88, 1.18, 0.09]} position={[0, 0, 0]} finish={{ color: "#8e7157", roughness: 0.65 }} />
          <BoxPart size={[0.71, 1.0, 0.095]} position={[0, 0, 0.06]} finish={{ color: index === 0 ? "#26444b" : "#4e4940", roughness: 0.9 }} />
          {!frame.imageAssetId && <BoxPart size={[0.34, 0.5, 0.01]} position={[0.09, -0.07, 0.12]} rotation={[0, 0, index === 0 ? 0.35 : -0.3]}
            finish={{ color: index === 0 ? "#72aaa6" : "#c39c6d", roughness: 0.8 }} />}
          <ArtworkSurface url={imageUrls[index as 0 | 1]} size={[0.66, 0.94]} fit={frame.fit} z={0.126} />
        </group>;
      })()}
    </group>)}
  </group>;
}
