import { productionCameraSchema, type ProductionCameraConfig } from "../camera/production-camera.ts";

export type Vec3 = [number, number, number];
export type TransformConfig = { position: Vec3; rotation: Vec3; scale: Vec3 };
export type PropRendererKey =
  | "room-shell" | "acoustic-wall" | "desk" | "chair" | "bookshelf"
  | "laptop" | "microphone" | "side-table" | "practical-lights" | "plant" | "rug" | "wall-art";

export type PropDefinition = {
  id: string;
  displayName: string;
  rendererKey: PropRendererKey;
  editable?: boolean;
  material?: { color: string; roughness: number; metalness: number };
};

export type EnvironmentPropInstance = {
  id: string;
  definitionId: string;
  transform: TransformConfig;
  visible: boolean;
};

export type CharacterAnchor = {
  id: string;
  role: "host" | "co-host" | "guest";
  position: Vec3;
  facingRadians: number; // yaw around +Y, zero faces +Z
  clearanceRadius: number;
};

export type CameraAnchorMetadata = {
  framing: "studio" | "conversation" | "single-seat" | "group";
  subjectAnchorIds: readonly string[]; // placement IDs, never character or speaker names
  aspectRatios: readonly ("16:9" | "9:16")[];
};

export type EnvironmentDefinition = {
  id: string;
  displayName: string;
  category: string; // classification is separate from the stable environment ID
  propDefinitions: readonly PropDefinition[];
  defaultProps: readonly EnvironmentPropInstance[];
  cameraAnchors: Readonly<Record<string, ProductionCameraConfig>>;
  cameraAnchorMetadata: Readonly<Record<string, CameraAnchorMetadata>>;
  characterAnchors: readonly CharacterAnchor[];
};

export function createEnvironmentRegistry(definitions: readonly EnvironmentDefinition[]) {
  const environments = new Map<string, EnvironmentDefinition>();
  for (const environment of definitions) {
    if (environments.has(environment.id)) throw new Error(`Duplicate environment ID: ${environment.id}`);
    const propIds = new Set<string>();
    const instanceIds = new Set<string>();
    for (const prop of environment.propDefinitions) {
      if (propIds.has(prop.id)) throw new Error(`Duplicate prop ID: ${prop.id}`);
      propIds.add(prop.id);
    }
    for (const instance of environment.defaultProps) {
      if (!propIds.has(instance.definitionId)) throw new Error(`Unknown prop definition: ${instance.definitionId}`);
      if (instanceIds.has(instance.id)) throw new Error(`Duplicate prop instance ID: ${instance.id}`);
      instanceIds.add(instance.id);
      const { position, rotation, scale } = instance.transform;
      if (![...position, ...rotation, ...scale].every(Number.isFinite) || scale.some((value) => value <= 0)) {
        throw new Error(`Invalid prop transform: ${instance.id}`);
      }
    }
    const anchorIds = new Set<string>();
    for (const anchor of environment.characterAnchors) {
      if (anchorIds.has(anchor.id)) throw new Error(`Duplicate character anchor ID: ${anchor.id}`);
      anchorIds.add(anchor.id);
      if (![...anchor.position, anchor.facingRadians, anchor.clearanceRadius].every(Number.isFinite) || anchor.clearanceRadius <= 0) {
        throw new Error(`Invalid character anchor: ${anchor.id}`);
      }
    }
    for (const [id, camera] of Object.entries(environment.cameraAnchors)) {
      if (!productionCameraSchema.safeParse(camera).success) throw new Error(`Invalid camera anchor: ${id}`);
      const metadata = environment.cameraAnchorMetadata[id];
      const expectedSubjects = metadata && { studio: 0, conversation: 2, "single-seat": 1, group: 3 }[metadata.framing];
      if (!metadata || !["studio", "conversation", "single-seat", "group"].includes(metadata.framing)
        || metadata.subjectAnchorIds.length !== expectedSubjects
        || metadata.aspectRatios.length === 0 || metadata.aspectRatios.some((ratio) => ratio !== "16:9" && ratio !== "9:16")
        || new Set(metadata.aspectRatios).size !== metadata.aspectRatios.length
        || metadata.subjectAnchorIds.some((subjectId) => !anchorIds.has(subjectId))
        || new Set(metadata.subjectAnchorIds).size !== metadata.subjectAnchorIds.length) {
        throw new Error(`Invalid camera anchor metadata: ${id}`);
      }
    }
    for (const id of Object.keys(environment.cameraAnchorMetadata)) {
      if (!(id in environment.cameraAnchors)) throw new Error(`Unknown camera anchor metadata: ${id}`);
    }
    environments.set(environment.id, environment);
  }
  return {
    get: (id: string) => environments.get(id),
    list: () => [...environments.values()],
  };
}

// Copies nested tuples so scene-local edits never mutate the reusable default arrangement.
export function copyDefaultProps(environment: EnvironmentDefinition): EnvironmentPropInstance[] {
  return environment.defaultProps.map((instance) => ({
    ...instance,
    transform: {
      position: [...instance.transform.position],
      rotation: [...instance.transform.rotation],
      scale: [...instance.transform.scale],
    },
  }));
}
