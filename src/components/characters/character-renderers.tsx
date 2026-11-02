import { BoxGeometry, CapsuleGeometry, Color, CylinderGeometry, MeshStandardMaterial, PlaneGeometry, Shape, ShapeGeometry, SphereGeometry, TorusGeometry } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useTexture } from "@react-three/drei";
import {
  createKamyarBeardDetailGeometry, createKamyarBeardGeometry, createKamyarEyebrowGeometry, createKamyarGlassesBridgeGeometry,
  createKamyarGlassesFrameGeometry, createKamyarGlassesTempleGeometry, createKamyarHairGeometry,
  createKamyarHeadGeometry, createKamyarMouthGeometry, createKamyarMustacheGeometry, createKamyarUpperEyelidGeometry, kamyarFacePosition,
} from "./kamyar-geometry";
import type { KamyarBeardStyle, KamyarHairStyle } from "./kamyar-geometry";
import { createHamidHeadGeometry, createHamidTorsoGeometry, hamidBellyFullness, type HamidBellyProfile } from "./hamid-geometry";
import { chatGptExpressionPresets, resolveChatGptExpression, type ChatGptExpression } from "@/lib/characters/chatgpt-expression-presets";
import { normalizeCharacterCustomization, type CharacterCustomization, type CharacterModelDefinition } from "@/lib/characters/character-registry";
import { GlbCharacterRenderer } from "./glb-character-renderer";

// Low-segment immutable primitives are shared; each instance receives its own material values.
const sphere = new SphereGeometry(1, 16, 12);
const capsule = new CapsuleGeometry(1, 1, 3, 8);
const cylinder = new CylinderGeometry(1, 1, 1, 10);
const torus = new TorusGeometry(1, 0.12, 6, 16);
const claudeCube = new RoundedBoxGeometry(0.94, 0.9, 0.78, 3, 0.035);
const claudeLimb = new BoxGeometry(0.16, 0.48, 0.48);
const claudeEye = new BoxGeometry(0.11, 0.19, 0.028);
const claudeMouth = new BoxGeometry(0.18, 0.045, 0.03);
const claudeHeadband = new TorusGeometry(0.49, 0.055, 6, 24, Math.PI);
const claudeHeadphoneCup = new RoundedBoxGeometry(0.19, 0.35, 0.2, 3, 0.035);
const claudeSquareHeadphoneCup = new BoxGeometry(0.19, 0.35, 0.2);
const claudeHeadphonePad = new RoundedBoxGeometry(0.08, 0.25, 0.22, 3, 0.025);
const chatGPTHeadShell = new RoundedBoxGeometry(0.78, 0.66, 0.58, 5, 0.2);
const chatGPTFaceScreen = new RoundedBoxGeometry(0.57, 0.42, 0.07, 5, 0.105);
const chatGPTBodyShell = new RoundedBoxGeometry(0.62, 0.66, 0.46, 5, 0.14);
const smileShape = new Shape();
smileShape.moveTo(-0.12, -0.025);
smileShape.quadraticCurveTo(0, 0.105, 0.12, -0.025);
smileShape.quadraticCurveTo(0, -0.075, -0.12, -0.025);
const chatGPTSmile = new ShapeGeometry(smileShape, 20);
const chatGPTOpenMouth = new TorusGeometry(0.042, 0.012, 8, 20);
const chatGPTMouthLine = new RoundedBoxGeometry(0.12, 0.016, 0.018, 3, 0.007);
const chatGPTLogoPlane = new PlaneGeometry(0.22, 0.22);
const kamyarHeadGeometry = createKamyarHeadGeometry();
const hamidHeadGeometry = createHamidHeadGeometry();
const hamidTorsoGeometries = {
  natural: createHamidTorsoGeometry(hamidBellyFullness.natural),
  fuller: createHamidTorsoGeometry(hamidBellyFullness.fuller),
  full: createHamidTorsoGeometry(hamidBellyFullness.full),
};
const kamyarHairGeometries = {
  "modern-textured-quiff": createKamyarHairGeometry("modern-textured-quiff"), "side-part": createKamyarHairGeometry("side-part"),
  "curly-short": createKamyarHairGeometry("curly-short"), "medium-wavy": createKamyarHairGeometry("medium-wavy"),
  "slicked-back": createKamyarHairGeometry("slicked-back"), "short-fade": createKamyarHairGeometry("short-fade"),
  "crew-cut": createKamyarHairGeometry("crew-cut"), "buzz-cut": createKamyarHairGeometry("buzz-cut"),
};
const kamyarBeardGeometries = {
  "light-stubble": createKamyarBeardGeometry("light-stubble"), "medium-stubble": createKamyarBeardGeometry("medium-stubble"),
  "short-boxed-beard": createKamyarBeardGeometry("short-boxed-beard"), "full-trimmed-beard": createKamyarBeardGeometry("full-trimmed-beard"),
  goatee: createKamyarBeardGeometry("goatee"), mustache: createKamyarBeardGeometry("mustache"),
  "mustache-light-stubble": createKamyarBeardGeometry("mustache-light-stubble"),
};
const kamyarBeardDetails = {
  "light-stubble": createKamyarBeardDetailGeometry("light-stubble"), "medium-stubble": createKamyarBeardDetailGeometry("medium-stubble"),
  "short-boxed-beard": createKamyarBeardDetailGeometry("short-boxed-beard"), "full-trimmed-beard": createKamyarBeardDetailGeometry("full-trimmed-beard"),
  goatee: createKamyarBeardDetailGeometry("goatee"), mustache: createKamyarBeardDetailGeometry("mustache"),
  "mustache-light-stubble": createKamyarBeardDetailGeometry("mustache-light-stubble"),
};
const kamyarMustacheGeometries = {
  standard: { left: createKamyarMustacheGeometry(-1), right: createKamyarMustacheGeometry(1) },
  light: { left: createKamyarMustacheGeometry(-1, "light"), right: createKamyarMustacheGeometry(1, "light") },
};
const kamyarEyebrowGeometry = createKamyarEyebrowGeometry();
const kamyarUpperEyelidGeometry = createKamyarUpperEyelidGeometry();
const kamyarMouthGeometry = createKamyarMouthGeometry();
const kamyarGlassesFrameGeometry = createKamyarGlassesFrameGeometry();
const kamyarGlassesBridgeGeometry = createKamyarGlassesBridgeGeometry();
const kamyarGlassesTempleGeometry = createKamyarGlassesTempleGeometry();
const kamyarHoodieTorso = new RoundedBoxGeometry(0.68, 0.58, 0.42, 6, 0.13);
const kamyarHoodieDrawstring = new RoundedBoxGeometry(0.007, 0.085, 0.007, 2, 0.003);
const kamyarHoodieZipper = new RoundedBoxGeometry(0.007, 0.20, 0.007, 2, 0.003);
const kamyarUpperSleeve = new CapsuleGeometry(0.086, 0.22, 5, 10);
const kamyarLowerSleeve = new CapsuleGeometry(0.072, 0.145, 5, 10);
const kamyarGlassesLens = new RoundedBoxGeometry(0.105, 0.066, 0.004, 4, 0.014);
const missingMaterial = new MeshStandardMaterial({ color: "#d4779d", wireframe: true });

function Ball({ at, size, color, roughness = 0.68 }: { at: [number, number, number]; size: [number, number, number]; color: string; roughness?: number }) {
  return <mesh geometry={sphere} position={at} scale={size} castShadow receiveShadow><meshStandardMaterial color={color} roughness={roughness} /></mesh>;
}
function Tube({ at, size, color, rotation = [0, 0, 0] as [number, number, number] }: { at: [number, number, number]; size: [number, number, number]; color: string; rotation?: [number, number, number] }) {
  return <mesh geometry={capsule} position={at} scale={size} rotation={rotation} castShadow><meshStandardMaterial color={color} roughness={0.74} /></mesh>;
}
function Cuff({ at, color, rotation = [0, 0, 0] as [number, number, number], size = [0.105, 0.10, 0.105] as [number, number, number] }: {
  at: [number, number, number]; color: string; rotation?: [number, number, number]; size?: [number, number, number];
}) {
  return <mesh geometry={cylinder} position={at} scale={size} rotation={rotation} castShadow><meshStandardMaterial color={color} roughness={0.42} metalness={0.16} /></mesh>;
}
function Eye({ at, color, size = [0.04, 0.052, 0.025] as [number, number, number] }: { at: [number, number, number]; color: string; size?: [number, number, number] }) {
  return <Ball at={at} size={size} color={color} roughness={0.25} />;
}

function Kamyar({ appearance }: { appearance: CharacterCustomization }) {
  const hair = appearance.hairColor ?? "#211d1d";
  const hairRoot = new Color(hair).multiplyScalar(0.78);
  const hairHighlight = new Color(hair).offsetHSL(0.008, 0.035, 0.075);
  const skin = appearance.skinTone ?? "#c98f70";
  const eyes = appearance.eyeColor ?? "#39281e";
  const beard = appearance.beardColor ?? "#302521";
  const beardDetail = new Color(beard).offsetHSL(0.005, 0.025, 0.09);
  const hoodie = appearance.clothingColor ?? "#171b21";
  const normalizedAppearance = normalizeCharacterCustomization("character-model:kamyar", appearance);
  const hairStyle = normalizedAppearance.hairStyle as KamyarHairStyle;
  const beardStyle = normalizedAppearance.beardStyle as KamyarBeardStyle | "clean-shaven";
  const beardVisible = normalizedAppearance.beardVisibility !== "hidden" && beardStyle !== "clean-shaven";
  const accessory = appearance.accessory ?? "none";
  const hairGeometry = hairStyle === "bald" ? null : kamyarHairGeometries[hairStyle];
  const beardGeometry = beardStyle === "clean-shaven" ? null : kamyarBeardGeometries[beardStyle];
  const beardDetailGeometry = beardStyle === "clean-shaven" ? null : kamyarBeardDetails[beardStyle];
  const hasMustache = ["short-boxed-beard", "full-trimmed-beard", "goatee", "mustache", "mustache-light-stubble"].includes(beardStyle);
  const browY = 0.074;
  const eyeY = 0.018;
  const mouthY = -0.112;
  const bridgeZ = kamyarFacePosition(0, 0.016, 0.012)[2];
  const mouthZ = kamyarFacePosition(0, mouthY, 0.009)[2];
  return <group dispose={null} name="kamyar-model-forward-positive-z">
    <group name="body-root">
      <mesh name="hoodie-torso" geometry={kamyarHoodieTorso} position={[0, 0.93, -0.015]} castShadow receiveShadow>
        <meshStandardMaterial color={hoodie} roughness={0.82} />
      </mesh>
      {[-1, 1].map((side) => <Ball key={side} at={[side * 0.255, 1.105, -0.015]} size={[0.17, 0.14, 0.205]} color={hoodie} />)}
      <Ball at={[0, 1.19, -0.12]} size={[0.215, 0.17, 0.13]} color={hoodie} />
      <Ball at={[0, 0.48, -0.005]} size={[0.29, 0.16, 0.21]} color="#252a31" />
      {[-1, 1].map((side) => <group key={side} name={side < 0 ? "left-leg-pivot" : "right-leg-pivot"}>
        <Tube at={[side * 0.17, 0.43, 0.21]} size={[0.115, 0.32, 0.115]} color="#252a31" rotation={[Math.PI / 2, 0, 0]} />
        <Tube at={[side * 0.17, 0.23, 0.43]} size={[0.09, 0.25, 0.09]} color="#20242b" />
        <Ball at={[side * 0.17, 0.105, 0.48]} size={[0.115, 0.07, 0.19]} color="#171b20" />
      </group>)}
      {[-1, 1].map((side) => <group key={side} name={side < 0 ? "left-arm-pivot" : "right-arm-pivot"} position={[side * 0.31, 1.105, 0.005]}>
        <group position={[-side * 0.31, -1.105, -0.005]}>
        <Ball at={[side * 0.31, 1.105, 0.005]} size={[0.145, 0.15, 0.17]} color={hoodie} />
        <mesh geometry={kamyarUpperSleeve} position={[side * 0.35, 0.96, 0.035]} rotation={[0, 0, side * 0.34]} castShadow>
          <meshStandardMaterial color={hoodie} roughness={0.82} />
        </mesh>
        <mesh geometry={kamyarLowerSleeve} position={[side * 0.405, 0.69, 0.145]} rotation={[-0.42, 0, side * 0.035]} castShadow>
          <meshStandardMaterial color={hoodie} roughness={0.82} />
        </mesh>
        <group name={side < 0 ? "left-hand-pivot" : "right-hand-pivot"} position={[side * 0.405, 0.535, 0.222]}>
          <Cuff at={[0, 0.025, 0]} color="#343b45" size={[0.075, 0.055, 0.075]} />
          <Ball at={[0, -0.025, 0.025]} size={[0.064, 0.05, 0.075]} color={skin} />
          <Ball at={[0, -0.033, 0.078]} size={[0.045, 0.019, 0.028]} color={skin} />
        </group>
        </group>
      </group>)}
      <Ball at={[0, 1.23, -0.005]} size={[0.078, 0.13, 0.082]} color={skin} />
      <group name="head-pivot" position={[0, 1.43, 0]}>
        <mesh name="sculpted-head" geometry={kamyarHeadGeometry} castShadow receiveShadow>
          <meshStandardMaterial color={skin} roughness={0.66} metalness={0} />
        </mesh>
        {hairGeometry && <group name="sculpted-hairstyle">
          <mesh name="scalp-following-hair-base" geometry={hairGeometry.cap} castShadow receiveShadow>
            <meshStandardMaterial color={hairRoot} roughness={0.78} side={2} />
          </mesh>
          {hairGeometry.locks.map((geometry, index) => <mesh key={index} name={`raised-swept-hair-lock-${index + 1}`} geometry={geometry} castShadow receiveShadow>
            <meshStandardMaterial color={index % 3 === 1 ? hairHighlight : hair} roughness={0.64} metalness={0.015} side={2} />
          </mesh>)}
        </group>}
        {[-1, 1].map((side) => <Ball key={side} at={[side * 0.226, 0.005, 0.008]} size={[0.038, 0.056, 0.041]} color={skin} />)}
        <group name="facial-hair-pivot">
          {beardVisible && beardGeometry && <mesh name="beard-following-jaw" geometry={beardGeometry} castShadow>
            <meshStandardMaterial color={beard} roughness={0.92} side={2} />
          </mesh>}
          {beardVisible && beardDetailGeometry && <mesh name="fine-facial-hair-strokes" geometry={beardDetailGeometry}>
            <meshStandardMaterial color={beardDetail} roughness={0.96} side={2} />
          </mesh>}
          {beardVisible && hasMustache && [-1, 1].map((side) => <mesh key={side} name={side < 0 ? "left-mustache" : "right-mustache"}
            geometry={beardStyle === "mustache-light-stubble"
              ? side < 0 ? kamyarMustacheGeometries.light.left : kamyarMustacheGeometries.light.right
              : side < 0 ? kamyarMustacheGeometries.standard.left : kamyarMustacheGeometries.standard.right}>
            <meshStandardMaterial color={beard} roughness={0.88} side={2} />
          </mesh>)}
        </group>
        {[-1, 1].map((side) => {
          const eyePosition = kamyarFacePosition(side * 0.088, eyeY, 0.007);
          const browPosition = kamyarFacePosition(side * 0.088, browY, 0.007);
          return <group key={side}>
            <group name={side < 0 ? "left-eyebrow" : "right-eyebrow"} position={[side * 0.088, browY, browPosition[2]]} scale={[side, 1, 1]}>
              <mesh geometry={kamyarEyebrowGeometry}>
                <meshStandardMaterial color={hair} roughness={0.82} />
              </mesh>
            </group>
            <group name={side < 0 ? "left-eye" : "right-eye"} position={[side * 0.088, eyeY, eyePosition[2]]}>
              <Ball at={[0, 0, 0]} size={[0.044, 0.027, 0.011]} color="#fff8ef" roughness={0.32} />
              <Ball at={[0, -0.001, 0.01]} size={[0.014, 0.018, 0.009]} color={eyes} roughness={0.28} />
              <Ball at={[0.001, -0.001, 0.017]} size={[0.006, 0.009, 0.004]} color="#171413" roughness={0.2} />
              <Ball at={[-0.004, 0.006, 0.019]} size={[0.0035, 0.004, 0.0025]} color="#ffffff" roughness={0.16} />
              <mesh name="upper-eyelid-definition" geometry={kamyarUpperEyelidGeometry} position={[0, 0.001, 0.016]}>
                <meshStandardMaterial color={beard} roughness={0.78} />
              </mesh>
            </group>
          </group>;
        })}
        <group name="nose-bridge" position={[0, 0.005, kamyarFacePosition(0, 0.005, 0.006)[2]]}>
          <Ball at={[0, 0.004, 0.005]} size={[0.019, 0.047, 0.019]} color={skin} roughness={0.74} />
          <Ball at={[0, -0.031, 0.019]} size={[0.027, 0.021, 0.021]} color={skin} roughness={0.74} />
        </group>
        <group name="mouth" position={[0, mouthY, mouthZ]}>
          <mesh name="natural-mouth-line" geometry={kamyarMouthGeometry}>
            <meshStandardMaterial color="#744b43" roughness={0.78} />
          </mesh>
        </group>
        {accessory === "glasses" && <group name="glasses-accessory">
          {[-1, 1].map((side) => {
            const lensPosition = kamyarFacePosition(side * 0.088, 0.018, 0.014);
            return <group key={side} name={side < 0 ? "left-glasses-lens" : "right-glasses-lens"}
              position={[side * 0.088, 0.018, lensPosition[2]]}>
              <mesh geometry={kamyarGlassesLens} position={[0, 0, -0.002]}>
                <meshStandardMaterial color="#91b7c0" transparent opacity={0.14} roughness={0.2} depthWrite={false} />
              </mesh>
              <mesh name="glasses-frame" geometry={kamyarGlassesFrameGeometry}>
                <meshStandardMaterial color="#2c343b" roughness={0.35} metalness={0.42} />
              </mesh>
              <mesh geometry={kamyarGlassesTempleGeometry} position={[side * 0.061, 0, -0.003]} scale={[side, 1, 1]}>
                <meshStandardMaterial color="#2c343b" roughness={0.38} metalness={0.34} />
              </mesh>
            </group>;
          })}
          <mesh geometry={kamyarGlassesBridgeGeometry} position={[0, 0.018, bridgeZ]}>
            <meshStandardMaterial color="#2c343b" roughness={0.35} metalness={0.42} />
          </mesh>
        </group>}
      </group>
      {/* Small drawstrings and zipper details distinguish the hoodie without a heavy texture. */}
      <mesh geometry={kamyarHoodieDrawstring} position={[-0.075, 1.025, 0.199]}><meshStandardMaterial color="#c8c0b3" roughness={0.8} /></mesh>
      <mesh geometry={kamyarHoodieDrawstring} position={[0.075, 1.025, 0.199]}><meshStandardMaterial color="#c8c0b3" roughness={0.8} /></mesh>
      <mesh geometry={kamyarHoodieZipper} position={[0, 0.93, 0.201]}><meshStandardMaterial color="#707782" roughness={0.65} metalness={0.25} /></mesh>
    </group>
  </group>;
}

function Hamid({ appearance }: { appearance: CharacterCustomization }) {
  const normalized = normalizeCharacterCustomization("character-model:hamid", appearance);
  const skin = normalized.skinTone ?? "#c98f70";
  const hair = normalized.hairColor ?? "#211d1d";
  const beard = normalized.beardColor ?? "#302521";
  const eyeColor = normalized.eyeColor ?? "#39281e";
  const shirt = normalized.clothingColor ?? "#111315";
  const hairStyle = normalized.hairStyle as KamyarHairStyle;
  const beardStyle = normalized.beardStyle as KamyarBeardStyle | "clean-shaven";
  const bellyProfile = (normalized.bellyFullness ?? "fuller") as HamidBellyProfile;
  const hairGeometry = hairStyle === "bald" ? null : kamyarHairGeometries[hairStyle];
  const beardGeometry = beardStyle === "clean-shaven" || normalized.beardVisibility === "hidden"
    ? null
    : kamyarBeardGeometries[beardStyle];
  const beardDetail = beardStyle === "clean-shaven" || normalized.beardVisibility === "hidden"
    ? null
    : kamyarBeardDetails[beardStyle];
  const hasMustache = ["short-boxed-beard", "full-trimmed-beard", "goatee", "mustache", "mustache-light-stubble"].includes(beardStyle);
  const torso = hamidTorsoGeometries[bellyProfile] ?? hamidTorsoGeometries.fuller;
  const eyeY = 0.02;
  const browY = 0.078;
  const mouthY = -0.112;
  return <group dispose={null} name="hamid-model-forward-positive-z">
    <group name="body-root">
      <mesh name="continuous-fuller-tshirt-torso" geometry={torso} castShadow receiveShadow>
        <meshStandardMaterial color={shirt} roughness={0.86} />
      </mesh>
      <Ball at={[0, 0.475, -0.015]} size={[0.31, 0.16, 0.235]} color="#25292e" />
      {[-1, 1].map((side) => <group key={side} name={side < 0 ? "left-leg-pivot" : "right-leg-pivot"}>
        <Tube at={[side * 0.175, 0.425, 0.21]} size={[0.12, 0.32, 0.12]} color="#25292e" rotation={[Math.PI / 2, 0, 0]} />
        <Tube at={[side * 0.175, 0.225, 0.425]} size={[0.095, 0.25, 0.095]} color="#20242a" />
        <Ball at={[side * 0.175, 0.105, 0.48]} size={[0.12, 0.072, 0.19]} color="#17191c" />
      </group>)}
      {[-1, 1].map((side) => <group key={side} name={side < 0 ? "left-arm-pivot" : "right-arm-pivot"} position={[side * 0.305, 1.155, -0.005]}>
        <group position={[-side * 0.305, -1.155, 0.005]}>
        <Ball at={[side * 0.305, 1.155, -0.005]} size={[0.145, 0.145, 0.16]} color={shirt} />
        <mesh geometry={kamyarUpperSleeve} position={[side * 0.345, 1.04, 0.015]} rotation={[0, 0, side * 0.3]} castShadow>
          <meshStandardMaterial color={shirt} roughness={0.86} />
        </mesh>
        <mesh geometry={kamyarLowerSleeve} position={[side * 0.405, 0.79, 0.105]} rotation={[-0.38, 0, side * 0.025]} castShadow>
          <meshStandardMaterial color={skin} roughness={0.7} />
        </mesh>
        <group name={side < 0 ? "left-hand-pivot" : "right-hand-pivot"} position={[side * 0.405, 0.64, 0.18]}>
          <Ball at={[0, 0, 0]} size={[0.065, 0.052, 0.075]} color={skin} />
          <Ball at={[0, -0.008, 0.058]} size={[0.045, 0.018, 0.027]} color={skin} />
        </group>
        </group>
      </group>)}
      <Ball at={[0, 1.29, -0.005]} size={[0.076, 0.13, 0.078]} color={skin} />
      <group name="head-pivot" position={[0, 1.515, 0]}>
        <mesh name="hamid-broad-natural-head" geometry={hamidHeadGeometry} castShadow receiveShadow>
          <meshStandardMaterial color={skin} roughness={0.68} />
        </mesh>
        {hairGeometry && <group name="hamid-short-hairstyle">
          <mesh geometry={hairGeometry.cap} castShadow receiveShadow>
            <meshStandardMaterial color={new Color(hair).multiplyScalar(0.78)} roughness={0.78} side={2} />
          </mesh>
          {hairGeometry.locks.map((geometry, index) => <mesh key={index} geometry={geometry} castShadow receiveShadow>
            <meshStandardMaterial color={index % 3 === 1 ? new Color(hair).offsetHSL(0.008, 0.025, 0.055) : hair} roughness={0.67} side={2} />
          </mesh>)}
        </group>}
        {[-1, 1].map((side) => <Ball key={side} at={[side * 0.224, -0.006, 0.006]} size={[0.04, 0.057, 0.04]} color={skin} />)}
        <group name="facial-hair-pivot">
          {beardGeometry && <mesh name="hamid-jaw-stubble" geometry={beardGeometry} castShadow>
            <meshStandardMaterial color={beard} roughness={0.94} side={2} />
          </mesh>}
          {beardDetail && <mesh geometry={beardDetail}>
            <meshStandardMaterial color={new Color(beard).offsetHSL(0.004, 0.02, 0.075)} roughness={0.95} side={2} />
          </mesh>}
          {beardGeometry && hasMustache && [-1, 1].map((side) => <mesh key={side} geometry={kamyarMustacheGeometries.standard[side < 0 ? "left" : "right"]}>
            <meshStandardMaterial color={beard} roughness={0.9} side={2} />
          </mesh>)}
        </group>
        {[-1, 1].map((side) => {
          const eye = kamyarFacePosition(side * 0.087, eyeY, 0.008);
          const brow = kamyarFacePosition(side * 0.088, browY, 0.006);
          return <group key={side}>
            <group name={side < 0 ? "left-eyebrow" : "right-eyebrow"} position={[side * 0.088, browY, brow[2]]} scale={[side, 1, 1]}>
              <mesh geometry={kamyarEyebrowGeometry}><meshStandardMaterial color={hair} roughness={0.82} /></mesh>
            </group>
            <group name={side < 0 ? "left-eye" : "right-eye"} position={[side * 0.087, eyeY, eye[2]]}>
              <Ball at={[0, 0, 0]} size={[0.041, 0.026, 0.011]} color="#fff8ef" roughness={0.32} />
              <Ball at={[0, -0.001, 0.01]} size={[0.013, 0.017, 0.009]} color={eyeColor} roughness={0.28} />
              <Ball at={[0.001, -0.001, 0.017]} size={[0.0055, 0.008, 0.004]} color="#171413" roughness={0.2} />
              <Ball at={[-0.004, 0.006, 0.019]} size={[0.003, 0.004, 0.002]} color="#ffffff" roughness={0.16} />
            </group>
          </group>;
        })}
        <group name="nose-bridge" position={[0, 0.004, kamyarFacePosition(0, 0.004, 0.012)[2]]}>
          <Ball at={[0, 0.004, 0.005]} size={[0.02, 0.046, 0.02]} color={skin} />
          <Ball at={[0, -0.03, 0.019]} size={[0.028, 0.021, 0.022]} color={skin} />
        </group>
        <group name="mouth" position={[0, mouthY, kamyarFacePosition(0, mouthY, 0.009)[2]]}>
          <mesh geometry={kamyarMouthGeometry}><meshStandardMaterial color="#744b43" roughness={0.8} /></mesh>
        </group>
      </group>
    </group>
  </group>;
}

function ChatGPT({ appearance, previewExpression }: { appearance: CharacterCustomization; previewExpression?: ChatGptExpression }) {
  const body = appearance.bodyColor ?? "#edf2f4";
  const accent = appearance.accentColor ?? "#52d7ca";
  const eye = appearance.eyeColor ?? "#8cfff0";
  const face = previewExpression ?? resolveChatGptExpression(appearance.faceStyle);
  const expression = chatGptExpressionPresets[face];
  const openAiMark = useTexture("/characters/openai-mark.svg");
  return <group dispose={null} name="chatgpt-robot-forward-positive-z">
    <group name="body-root">
      <mesh name="robot-body-shell" geometry={chatGPTBodyShell} position={[0, 0.53, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={body} roughness={0.32} metalness={0.035} />
      </mesh>
      <mesh name="openai-chest-logo" geometry={chatGPTLogoPlane} position={[0, 0.55, 0.235]}>
        <meshBasicMaterial map={openAiMark} transparent alphaTest={0.04} toneMapped={false} side={2} />
      </mesh>
      <Ball at={[0, 0.87, 0]} size={[0.12, 0.115, 0.12]} color="#cbd6db" roughness={0.36} />
      {[-1, 1].map((side) => <group key={side} name={side < 0 ? "left-arm-pivot" : "right-arm-pivot"} position={[side * 0.31, 0.73, 0]}>
        <group position={[-side * 0.31, -0.73, 0]}>
        <Ball at={[side * 0.31, 0.73, 0]} size={[0.12, 0.12, 0.12]} color="#cbd6db" roughness={0.4} />
        <Tube at={[side * 0.37, 0.59, 0.015]} size={[0.075, 0.17, 0.075]} color={body} rotation={[0, 0, side * 0.24]} />
        <Ball at={[side * 0.405, 0.45, 0.02]} size={[0.085, 0.085, 0.085]} color="#b9c8ce" roughness={0.4} />
        <Tube at={[side * 0.41, 0.34, 0.035]} size={[0.065, 0.13, 0.065]} color={body} rotation={[0, 0, side * 0.18]} />
        <Cuff at={[side * 0.415, 0.245, 0.06]} color="#c4d0d5" />
        <group name={side < 0 ? "left-hand-pivot" : "right-hand-pivot"} position={[side * 0.415, 0.19, 0.075]}>
          <Ball at={[0, 0, 0]} size={[0.075, 0.065, 0.075]} color={body} roughness={0.36} />
          {[-1, 0, 1].map((finger) => <Tube key={finger} at={[finger * 0.035, -0.045, 0.025]} size={[0.018, 0.035, 0.018]} color={body} />)}
        </group>
        </group>
      </group>)}
      {[-1, 1].map((side) => <group key={side} name={side < 0 ? "left-leg-pivot" : "right-leg-pivot"}>
        <Tube at={[side * 0.16, 0.18, 0]} size={[0.085, 0.19, 0.085]} color={body} />
        <Ball at={[side * 0.16, 0.075, 0.07]} size={[0.10, 0.065, 0.15]} color="#d7e0e4" roughness={0.4} />
      </group>)}
      <group name="head-pivot" position={[0, 1.02, 0]}>
        <mesh name="rounded-head-shell" geometry={chatGPTHeadShell} castShadow receiveShadow>
          <meshStandardMaterial color={body} roughness={0.3} metalness={0.025} />
        </mesh>
        <mesh name="polished-dark-face-screen" geometry={chatGPTFaceScreen} position={[0, 0, 0.31]}>
          <meshStandardMaterial color="#172631" roughness={0.22} metalness={0.12} />
        </mesh>
        <group name="face-display" position={[0, 0, 0.35]}>
          {[-1, 1].map((side) => {
            const eyeIndex = side < 0 ? 0 : 1;
            return <group key={side} name={side < 0 ? "left-eye" : "right-eye"} position={[side * 0.115, 0.025 + expression.eyeYOffset[eyeIndex], 0]}>
            <group name="eyebrow" position={[0, 0.115 + expression.browLift, 0]}>
              <Tube at={[0, 0, 0]} size={[0.058, 0.014, 0.012]} color={eye} rotation={[0, 0, expression.browAngle[eyeIndex]]} />
            </group>
            <group name="eye-shape" scale={[1, expression.eyeScaleY, 1]}>
              <Ball at={[0, 0, 0]} size={[0.079, 0.094, 0.025]} color="#31c8c9" roughness={0.3} />
              <Ball at={[0, 0, 0.018]} size={[0.061, 0.075, 0.019]} color="#101b25" roughness={0.22} />
              <group name={eyeIndex === 0 ? "left-iris-gaze" : "right-iris-gaze"} position={[expression.pupilOffsetX[eyeIndex], 0, 0]}>
                <group name="iris">
                  <Ball at={[0.005, -0.008, 0.039]} size={[0.033, 0.045, 0.014]} color={eye} roughness={0.2} />
                </group>
              </group>
              <Ball at={[-0.021, 0.028, 0.052]} size={[0.018, 0.021, 0.009]} color="#f4ffff" roughness={0.14} />
              <Ball at={[0.02, -0.033, 0.051]} size={[0.008, 0.01, 0.005]} color="#dcffff" roughness={0.16} />
            </group>
          </group>;
          })}
          <group name="mouth-display" position={[0, -0.092, 0.008]}>
            {expression.mouth === "smile" || expression.mouth === "frown" ? <mesh name={expression.mouth === "smile" ? "friendly-smile" : "expression-frown"}
              geometry={chatGPTSmile} rotation={[0, 0, expression.mouthRotation]} scale={[expression.mouthScale[0], expression.mouthScale[1], 0.72]}>
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.08} roughness={0.3} />
            </mesh> : expression.mouth === "open" || expression.mouth === "small-open" ? <group name={`${expression.mouth}-mouth-shape`} rotation={[0, 0, expression.mouthRotation]}>
              <Ball at={[0, 0, 0]} size={[0.012, 0.018, 0.008]} color="#0c141c" />
              <mesh geometry={chatGPTOpenMouth} scale={[expression.mouthScale[0], expression.mouthScale[1], 0.72]}>
                <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.07} roughness={0.32} />
              </mesh>
            </group> : <mesh name={expression.mouth === "line" ? "neutral-mouth-line" : "tilted-mouth-line"}
              geometry={chatGPTMouthLine} rotation={[0, 0, expression.mouthRotation]} scale={[expression.mouthScale[0], expression.mouthScale[1], 1]}>
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.06} roughness={0.3} />
            </mesh>}
          </group>
        </group>
        <mesh geometry={cylinder} position={[0, 0.355, 0]} scale={[0.035, 0.11, 0.035]} castShadow><meshStandardMaterial color={accent} /></mesh>
        <Eye at={[0, 0.44, 0]} color={eye} size={[0.07, 0.07, 0.07]} />
        {appearance.accessory === "headset" && <group name="headset-accessory">
          <mesh geometry={torus} position={[0, 0.015, -0.02]} scale={[0.42, 0.37, 0.065]} rotation={[Math.PI / 2, 0, 0]}><meshStandardMaterial color="#516574" metalness={0.35} roughness={0.42} /></mesh>
          {[-1, 1].map((side) => <Ball key={side} at={[side * 0.37, -0.02, 0.02]} size={[0.07, 0.13, 0.09]} color={accent} />)}
        </group>}
      </group>
    </group>
  </group>;
}

function Claude({ appearance }: { appearance: CharacterCustomization }) {
  const orange = appearance.furColor ?? "#f47920";
  const headphoneAccent = appearance.chestColor ?? "#d9d2c8";
  const eyes = appearance.eyeColor ?? "#21140f";
  const roundedCups = appearance.earStyle === "rounded";
  const cupGeometry = roundedCups ? claudeHeadphoneCup : claudeSquareHeadphoneCup;
  return <group dispose={null} name="claude-cube-forward-positive-z">
    <group name="body-root">
      <group name="head-pivot" position={[0, 0.93, 0]}>
        <mesh name="cube-head-body" geometry={claudeCube} castShadow receiveShadow>
          <meshStandardMaterial color={orange} roughness={0.62} />
        </mesh>
        <group name="headphones" position={[0, 0.36, -0.025]}>
          <mesh name="headphone-band" geometry={claudeHeadband} position={[0, 0, -0.015]} rotation={[0, 0, 0]} castShadow>
            <meshStandardMaterial color="#24262a" roughness={0.48} metalness={0.16} />
          </mesh>
          {[-1, 1].map((side) => <group key={side} position={[side * 0.47, -0.17, 0.36]}>
            <mesh name={side < 0 ? "left-headphone-cup" : "right-headphone-cup"} geometry={cupGeometry} castShadow>
              <meshStandardMaterial color="#282a2d" roughness={0.52} />
            </mesh>
            <mesh name={side < 0 ? "left-headphone-pad" : "right-headphone-pad"} geometry={claudeHeadphonePad} position={[0, 0, 0.105]}>
              <meshStandardMaterial color={headphoneAccent} roughness={0.72} />
            </mesh>
          </group>)}
        </group>
        <group name="face-elements">
          {[-1, 1].map((side) => <group key={side} name={side < 0 ? "left-eye" : "right-eye"} position={[side * 0.2, 0.045, 0.405]}>
            <mesh geometry={claudeEye} castShadow><meshStandardMaterial color={eyes} roughness={0.34} /></mesh>
          </group>)}
          <group name="mouth" position={[0, -0.19, 0.405]}>
            <mesh geometry={claudeMouth} castShadow><meshStandardMaterial color="#6c321c" roughness={0.45} /></mesh>
          </group>
        </group>
      </group>
      {[-0.31, -0.105, 0.105, 0.31].map((x, index) => <group key={x} name={`lower-limb-${index + 1}`} position={[x, 0.24, 0]}>
        <mesh geometry={claudeLimb} castShadow receiveShadow><meshStandardMaterial color={orange} roughness={0.66} /></mesh>
      </group>)}
    </group>
  </group>;
}

function ProceduralCharacterRenderer({ model, customization, previewExpression }: { model: CharacterModelDefinition; customization: CharacterCustomization; previewExpression?: ChatGptExpression }) {
  if (model.rendererKey === "kamyar-stylized") return <Kamyar appearance={customization} />;
  if (model.rendererKey === "hamid-stylized") return <Hamid appearance={customization} />;
  if (model.rendererKey === "chatgpt-robot") return <ChatGPT appearance={customization} previewExpression={previewExpression} />;
  if (model.rendererKey === "claude-terracotta-mascot") return <Claude appearance={customization} />;
  return <mesh geometry={sphere} scale={[0.38, 0.62, 0.28]}><primitive object={missingMaterial} attach="material" /></mesh>;
}

export function CharacterModelRenderer({ model, customization = {}, previewExpression }: { model: CharacterModelDefinition | undefined; customization?: CharacterCustomization; previewExpression?: ChatGptExpression }) {
  if (!model) return <mesh geometry={sphere} scale={[0.38, 0.62, 0.28]}>
    <primitive object={missingMaterial} attach="material" />
  </mesh>;
  const fallback = <ProceduralCharacterRenderer model={model} customization={customization} previewExpression={previewExpression} />;
  return model.glb ? <GlbCharacterRenderer model={model} appearance={customization} fallback={fallback} /> : fallback;
}
