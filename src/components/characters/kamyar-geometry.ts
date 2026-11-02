import { BufferGeometry, Float32BufferAttribute, Vector3, CatmullRomCurve3, TubeGeometry } from "three";

const headWidth = 0.235;
const headHeight = 0.285;
const headDepth = 0.215;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/** Surface coordinates are shared by the head, hairline and facial-hair shells. */
export function kamyarHeadSurfacePoint(theta: number, phi: number, offset = 0): [number, number, number] {
  const sinTheta = Math.sin(theta);
  const cosTheta = Math.cos(theta);
  const jawTaper = 1 - 0.12 * clamp(-cosTheta, 0, 1) + 0.015 * clamp(cosTheta, 0, 1);
  const depthTaper = 1 - 0.07 * clamp(-cosTheta, 0, 1);
  const x = sinTheta * Math.sin(phi) * headWidth * jawTaper;
  const y = cosTheta * headHeight;
  const front = Math.max(0, Math.cos(phi));
  const bridgeBlend = Math.exp(-Math.pow((theta - 1.52) / 0.42, 2));
  const cheekBlend = Math.exp(-Math.pow((theta - 1.86) / 0.24, 2));
  const z = sinTheta * Math.cos(phi) * headDepth * depthTaper
    + 0.014 * bridgeBlend * Math.pow(front, 10)
    + 0.005 * cheekBlend * Math.pow(front, 3);
  const normal = new Vector3(x / (headWidth * headWidth), y / (headHeight * headHeight), z / (headDepth * headDepth)).normalize();
  return [x + normal.x * offset, y + normal.y * offset, z + normal.z * offset];
}

export function kamyarFacePosition(x: number, y: number, offset = 0) {
  const theta = Math.acos(clamp(y / headHeight, -0.98, 0.98));
  const cosTheta = Math.cos(theta);
  const jawTaper = 1 - 0.12 * clamp(-cosTheta, 0, 1) + 0.015 * clamp(cosTheta, 0, 1);
  const phi = Math.asin(clamp(x / (Math.sin(theta) * headWidth * jawTaper), -0.98, 0.98));
  return kamyarHeadSurfacePoint(theta, phi, offset);
}

function makeGridGeometry(rows: number, columns: number, pointAt: (row: number, column: number) => [number, number, number], wrapColumns = false) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rows; row += 1) {
    for (let column = 0; column <= columns; column += 1) {
      const point = pointAt(row, column);
      positions.push(...point);
      uvs.push(column / columns, row / rows);
    }
  }
  const stride = columns + 1;
  const columnSegments = wrapColumns ? columns : columns;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columnSegments; column += 1) {
      const nextColumn = wrapColumns ? (column + 1) % columns : column + 1;
      const a = row * stride + column;
      const b = row * stride + nextColumn;
      const c = (row + 1) * stride + column;
      const d = (row + 1) * stride + nextColumn;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createKamyarHeadGeometry() {
  const rows = 40;
  const columns = 64;
  return makeGridGeometry(rows, columns, (row, column) => {
    const theta = Math.PI * row / rows;
    const phi = -Math.PI + 2 * Math.PI * column / columns;
    return kamyarHeadSurfacePoint(theta, phi);
  }, true);
}

export type KamyarHairStyle = "modern-textured-quiff" | "side-part" | "curly-short" | "medium-wavy" | "slicked-back" | "short-fade" | "crew-cut" | "buzz-cut" | "bald";
export type KamyarBeardStyle = "clean-shaven" | "light-stubble" | "medium-stubble" | "short-boxed-beard" | "full-trimmed-beard" | "goatee" | "mustache" | "mustache-light-stubble";
export interface KamyarHairMeshes { cap: BufferGeometry; locks: BufferGeometry[] }

const hairAliases: Record<string, KamyarHairStyle> = {
  short: "crew-cut", parted: "side-part", "short-classic": "crew-cut", "crew-cut": "crew-cut",
  textured: "modern-textured-quiff", "textured-quiff": "modern-textured-quiff", "slight-wavy": "medium-wavy",
  "longer-styled": "slicked-back",
};
const beardAliases: Record<string, KamyarBeardStyle> = {
  short: "short-boxed-beard", stubble: "light-stubble", trimmed: "short-boxed-beard",
  "short-beard": "short-boxed-beard", "trimmed-full-beard": "full-trimmed-beard", "full-short": "full-trimmed-beard",
  "moustache-light": "mustache", "mustache-only": "mustache",
};

export function canonicalKamyarHairStyle(style: string): KamyarHairStyle {
  const canonical = hairAliases[style] ?? style;
  return ["modern-textured-quiff", "side-part", "curly-short", "medium-wavy", "slicked-back", "short-fade", "crew-cut", "buzz-cut", "bald"].includes(canonical)
    ? canonical as KamyarHairStyle : "side-part";
}
export function canonicalKamyarBeardStyle(style: string): KamyarBeardStyle {
  const canonical = beardAliases[style] ?? style;
  return ["clean-shaven", "light-stubble", "medium-stubble", "short-boxed-beard", "full-trimmed-beard", "goatee", "mustache", "mustache-light-stubble"].includes(canonical)
    ? canonical as KamyarBeardStyle : "short-boxed-beard";
}

interface HairStyleConfig {
  front: number; side: number; rear: number; offset: number; volume: number;
  strandCount: number; strandWidth: number; sweep: number; wave: number; curl: number; peak: number;
}

const hairStyleConfig: Record<Exclude<KamyarHairStyle, "bald">, HairStyleConfig> = {
  "modern-textured-quiff": { front: 1.25, side: 0.82, rear: 1.03, offset: 0.004, volume: 0.072, strandCount: 9, strandWidth: 0.24, sweep: 0.14, wave: 0.05, curl: 0, peak: 0.72 },
  "side-part": { front: 1.24, side: 0.83, rear: 1.07, offset: 0.004, volume: 0.050, strandCount: 7, strandWidth: 0.22, sweep: 0.24, wave: 0.02, curl: 0, peak: 0.54 },
  "curly-short": { front: 1.27, side: 1.01, rear: 1.19, offset: 0.006, volume: 0.055, strandCount: 11, strandWidth: 0.21, sweep: 0.06, wave: 0.10, curl: 0.13, peak: 0.50 },
  "medium-wavy": { front: 1.38, side: 1.02, rear: 1.29, offset: 0.007, volume: 0.055, strandCount: 8, strandWidth: 0.25, sweep: 0.15, wave: 0.14, curl: 0, peak: 0.58 },
  "slicked-back": { front: 1.34, side: 0.89, rear: 1.17, offset: 0.005, volume: 0.045, strandCount: 7, strandWidth: 0.25, sweep: -0.22, wave: 0.015, curl: 0, peak: 0.38 },
  "short-fade": { front: 1.18, side: 0.72, rear: 0.91, offset: 0.003, volume: 0.033, strandCount: 6, strandWidth: 0.20, sweep: 0.10, wave: 0.025, curl: 0, peak: 0.58 },
  "crew-cut": { front: 1.18, side: 0.86, rear: 1.00, offset: 0.003, volume: 0.020, strandCount: 5, strandWidth: 0.25, sweep: 0.03, wave: 0.01, curl: 0, peak: 0.50 },
  "buzz-cut": { front: 1.15, side: 0.85, rear: 0.99, offset: 0.0018, volume: 0, strandCount: 0, strandWidth: 0.2, sweep: 0, wave: 0, curl: 0, peak: 0.5 },
};

function hairlineTheta(phi: number, config: HairStyleConfig) {
  const frontBack = Math.cos(phi);
  return frontBack >= 0
    ? config.side + frontBack * (config.front - config.side)
    : config.side + -frontBack * (config.rear - config.side);
}

/** Fitted under-layer plus individually raised, tapered clumps with a bounded low-poly mesh budget. */
export function createKamyarHairGeometry(style: string): KamyarHairMeshes | null {
  const canonical = canonicalKamyarHairStyle(style);
  if (canonical === "bald") return null;
  const config = hairStyleConfig[canonical];
  const rows = 24;
  const columns = 56;
  const cap = makeGridGeometry(rows, columns, (row, column) => {
    const phi = -Math.PI + 2 * Math.PI * column / columns;
    const thetaEnd = hairlineTheta(phi, config);
    const theta = (row / rows) * thetaEnd;
    const curls = config.curl * 0.055 * Math.cos(phi * 10) * Math.sin(theta * 4);
    const waves = config.wave * 0.05 * Math.sin(phi * 5 + theta * 5);
    const partGroove = canonical === "side-part" ? -0.008 * Math.exp(-Math.pow((phi + 0.18) / 0.06, 2)) * Math.sin(theta) : 0;
    const fadeTaper = canonical === "short-fade" ? 0.002 * Math.sin(phi * 10 + theta * 7) : 0;
    return kamyarHeadSurfacePoint(theta, phi, config.offset + curls + waves + partGroove + fadeTaper);
  }, true);
  const locks: BufferGeometry[] = [];
  for (let index = 0; index < config.strandCount; index += 1) {
    const lane = config.strandCount === 1 ? 0 : index / (config.strandCount - 1) * 2 - 1;
    const lock = makeGridGeometry(18, 8, (row, column) => {
      const t = row / 18;
      const across = column / 8 * 2 - 1;
      const theta = 0.25 + t * (config.front - 0.25);
      const stylePhase = index * 1.71;
      let phi = lane * 0.82 + config.sweep * t;
      phi += config.wave * Math.sin(t * Math.PI * 2 + stylePhase) * 0.55;
      phi += config.curl * Math.sin(t * Math.PI * 3 + stylePhase) * 0.55;
      if (canonical === "side-part") phi += 0.11 * Math.sin(t * Math.PI) * (lane < 0 ? -1 : 1);
      if (canonical === "slicked-back") phi += 0.08 * Math.sin(t * Math.PI * 0.8 + lane);
      const thetaEnd = hairlineTheta(phi, config);
      const shapedTheta = Math.min(theta, thetaEnd + 0.035);
      const width = config.strandWidth * (0.76 + 0.24 * Math.sin(Math.PI * t));
      const waveRidge = config.wave * 0.008 * Math.sin(t * Math.PI * 2 + across * 3 + stylePhase);
      const curlLobe = config.curl * 0.012 * Math.cos(across * Math.PI * 2 + stylePhase);
      const peak = Math.exp(-Math.pow((t - config.peak) / 0.34, 2));
      const taper = Math.pow(Math.max(0, Math.sin(Math.PI * (0.06 + t * 0.88))), 0.35);
      const cross = Math.sqrt(Math.max(0, 1 - across * across));
      const crownRise = 0.82 * Math.exp(-t / 0.17);
      const ridge = config.volume * (crownRise + peak * taper) * Math.pow(cross, 0.8);
      return kamyarHeadSurfacePoint(shapedTheta, phi + across * width, config.offset + 0.004 + ridge + waveRidge + curlLobe);
    });
    locks.push(lock);
  }
  return { cap, locks };
}

interface BeardStyleConfig { width: number; top: number; topDrop: number; bottom: number; bottomLift: number; offset: number; detailCount: number; }
const beardStyleConfig: Partial<Record<KamyarBeardStyle, BeardStyleConfig>> = {
  "light-stubble": { width: 1.24, top: 2.24, topDrop: 0.34, bottom: 2.72, bottomLift: 0.20, offset: 0.002, detailCount: 110 },
  "medium-stubble": { width: 1.32, top: 2.12, topDrop: 0.40, bottom: 2.82, bottomLift: 0.22, offset: 0.003, detailCount: 150 },
  "short-boxed-beard": { width: 1.29, top: 2.03, topDrop: 0.52, bottom: 2.88, bottomLift: 0.28, offset: 0.004, detailCount: 74 },
  "full-trimmed-beard": { width: 1.43, top: 1.89, topDrop: 0.40, bottom: 2.99, bottomLift: 0.26, offset: 0.005, detailCount: 90 },
  goatee: { width: 0.55, top: 2.10, topDrop: 0.06, bottom: 2.96, bottomLift: 0.08, offset: 0.004, detailCount: 54 },
  "mustache-light-stubble": { width: 1.20, top: 2.27, topDrop: 0.30, bottom: 2.73, bottomLift: 0.20, offset: 0.0025, detailCount: 100 },
};

/** Cheek-to-jaw patches with bounded coverage; thin sculpted strokes add a restrained groomed texture. */
export function createKamyarBeardGeometry(style: string): BufferGeometry | null {
  const canonical = canonicalKamyarBeardStyle(style);
  const config = beardStyleConfig[canonical];
  if (!config) return null;
  return makeGridGeometry(30, 64, (row, column) => {
    const phi = -config.width + 2 * config.width * column / 64;
    const sideAmount = Math.abs(phi) / config.width;
    const top = config.top + config.topDrop * Math.pow(sideAmount, 1.25);
    const bottom = config.bottom - config.bottomLift * Math.pow(sideAmount, 1.7);
    const theta = top + (bottom - top) * row / 30;
    const fineTexture = config.detailCount > 100 ? 0.0007 * Math.sin(phi * 115 + theta * 71) : 0;
    return kamyarHeadSurfacePoint(theta, phi, config.offset + fineTexture);
  });
}

export function createKamyarBeardDetailGeometry(style: string): BufferGeometry | null {
  const config = beardStyleConfig[canonicalKamyarBeardStyle(style)];
  if (!config) return null;
  const positions: number[] = [];
  for (let index = 0; index < config.detailCount; index += 1) {
    const seed = index + 1;
    const randomA = (Math.sin(seed * 127.1) * 43758.5453) % 1;
    const randomB = (Math.sin(seed * 311.7) * 24634.6345) % 1;
    const u = Math.abs(randomA);
    const v = Math.abs(randomB);
    const phi = (u * 2 - 1) * config.width * 0.94;
    const side = Math.abs(phi) / config.width;
    const top = config.top + config.topDrop * Math.pow(side, 1.25) + 0.035;
    const bottom = config.bottom - config.bottomLift * Math.pow(side, 1.7) - 0.025;
    const theta = top + (bottom - top) * v;
    const length = 0.016 + (seed % 5) * 0.003;
    const halfWidth = 0.004 + (seed % 3) * 0.0007;
    const surfaceOffset = config.offset + 0.003;
    const left = kamyarHeadSurfacePoint(theta, phi - halfWidth, surfaceOffset);
    const center = kamyarHeadSurfacePoint(theta + length * 0.5, phi, surfaceOffset + 0.0006);
    const right = kamyarHeadSurfacePoint(theta, phi + halfWidth, surfaceOffset);
    positions.push(...left, ...center, ...right);
  }
  if (positions.length === 0) return null;
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createKamyarMustacheGeometry(side: -1 | 1, style: "standard" | "light" = "standard") {
  const rows = style === "light" ? 6 : 8;
  const columns = 14;
  return makeGridGeometry(rows, columns, (row, column) => {
    const range = style === "light" ? 0.34 : 0.43;
    const center = side < 0 ? -0.29 : 0.29;
    const phi = center - range / 2 + range * column / columns;
    const theta = (style === "light" ? 1.66 : 1.62) + (style === "light" ? 0.12 : 0.15) * row / rows;
    return kamyarHeadSurfacePoint(theta, phi, style === "light" ? 0.0045 : 0.006);
  });
}

function curveTube(points: [number, number, number][], radius: number, segments = 28) {
  const curve = new CatmullRomCurve3(points.map((point) => new Vector3(...point)));
  return new TubeGeometry(curve, segments, radius, 6, false);
}

export function createKamyarEyebrowGeometry() {
  return curveTube([[-0.061, -0.002, 0], [-0.03, 0.009, 0], [0.012, 0.011, 0], [0.061, 0, 0]], 0.0058, 20);
}

export function createKamyarUpperEyelidGeometry() {
  return curveTube([[-0.041, 0.002, 0], [-0.026, 0.018, 0], [0, 0.023, 0], [0.026, 0.018, 0], [0.041, 0.002, 0]], 0.0022, 24);
}

export function createKamyarMouthGeometry() {
  return curveTube([[-0.04, 0.008, 0], [-0.02, -0.008, 0], [0, -0.012, 0], [0.02, -0.008, 0], [0.04, 0.008, 0]], 0.0035, 24);
}

export function createKamyarGlassesFrameGeometry() {
  const width = 0.122;
  const height = 0.083;
  const radius = 0.018;
  const points: Vector3[] = [];
  const corners: [number, number, number][] = [
    [width / 2 - radius, height / 2 - radius, 0],
    [-width / 2 + radius, height / 2 - radius, 90],
    [-width / 2 + radius, -height / 2 + radius, 180],
    [width / 2 - radius, -height / 2 + radius, 270],
  ];
  for (const [centerX, centerY, startDegrees] of corners) {
    for (let step = 0; step <= 8; step += 1) {
      const angle = (startDegrees + step * 90 / 8) * Math.PI / 180;
      points.push(new Vector3(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle), 0));
    }
  }
  return new TubeGeometry(new CatmullRomCurve3(points, true, "centripetal"), 72, 0.0045, 6, true);
}

export function createKamyarGlassesBridgeGeometry() {
  return curveTube([[-0.031, 0, 0], [-0.016, 0.008, 0], [0, 0.006, 0], [0.016, 0.008, 0], [0.031, 0, 0]], 0.0045, 16);
}

export function createKamyarGlassesTempleGeometry() {
  return curveTube([[0, 0, 0], [0.035, -0.005, -0.018], [0.065, -0.015, -0.068], [0.064, -0.023, -0.12]], 0.0045, 24);
}
