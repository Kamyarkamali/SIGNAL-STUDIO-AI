import type { EnvironmentDefinition, EnvironmentPropInstance, PropDefinition, TransformConfig, Vec3 } from "./environment-registry.ts";
import { studioChairVisualSpec } from "./studio-visual-spec.ts";

export const STUDIO_01_ID = "environment:studio-01";

const props: PropDefinition[] = [
  { id: "prop:room-shell", displayName: "ساختار اتاق", rendererKey: "room-shell", editable: false },
  { id: "prop:acoustic-wall", displayName: "دیوار آکوستیک", rendererKey: "acoustic-wall", editable: false },
  { id: "prop:desk", displayName: "میز پادکست", rendererKey: "desk", material: { color: "#81543b", roughness: 0.63, metalness: 0 } },
  { id: "prop:chair", displayName: "صندلی", rendererKey: "chair" },
  { id: "prop:bookshelf", displayName: "قفسهٔ کتاب", rendererKey: "bookshelf" },
  { id: "prop:laptop", displayName: "لپ‌تاپ", rendererKey: "laptop" },
  { id: "prop:microphone", displayName: "میکروفون", rendererKey: "microphone" },
  { id: "prop:side-table", displayName: "میز کنار مهمان", rendererKey: "side-table" },
  { id: "prop:practical-lights", displayName: "تابلو دیواری و چراغ‌های دکوراتیو", rendererKey: "practical-lights" },
  { id: "prop:plant", displayName: "گیاه", rendererKey: "plant" },
  { id: "prop:rug", displayName: "فرش", rendererKey: "rug" },
  { id: "prop:wall-art", displayName: "دکور دیوار", rendererKey: "wall-art" },
];

function instance(id: string, definitionId: string, position: Vec3, rotation: Vec3 = [0, 0, 0], scale: Vec3 = [1, 1, 1]): EnvironmentPropInstance {
  const transform: TransformConfig = { position, rotation, scale };
  return { id: `studio-01:${id}`, definitionId, transform, visible: true };
}

export const STUDIO_01: EnvironmentDefinition = {
  id: STUDIO_01_ID,
  displayName: "استودیوی پادکست مدرن · ۰۱",
  category: "podcast-studio",
  propDefinitions: props,
  defaultProps: [
    instance("room", "prop:room-shell", [0, 0, 0]),
    instance("acoustic-wall", "prop:acoustic-wall", [0, 0, 0]),
    instance("desk", "prop:desk", [0, 0, 0]),
    instance("host-chair", "prop:chair", [-1.4, 0, -1.35]),
    instance("cohost-chair", "prop:chair", [1.4, 0, -1.35]),
    instance("guest-chair", "prop:chair", [3.9, 0, 0.5], [0, -1.12, 0]),
    instance("bookshelf", "prop:bookshelf", [-4.05, 0, -3.72]),
    // Keyboard faces the host at negative Z; the screen is farther across the desktop.
    instance("laptop", "prop:laptop", [-1.4, 1.18, -0.43], [0, Math.PI, 0]),
    instance("microphone-left", "prop:microphone", [-2.05, 1.18, -0.4]),
    instance("microphone-right", "prop:microphone", [2.05, 1.18, -0.4]),
    instance("guest-table", "prop:side-table", [2.9, 0, 0.5]),
    instance("microphone-guest", "prop:microphone", [2.9, 1.05, 0.35], [0, -Math.PI / 2, 0]),
    instance("practical-lights", "prop:practical-lights", [0, 0, 0]),
    instance("plant", "prop:plant", [4.55, 0, -3.36]),
    instance("rug", "prop:rug", [0, 0, 0]),
    instance("wall-art", "prop:wall-art", [0, 0, 0]),
  ],
  cameraAnchors: {
    wide: { position: [4.9, 3.55, 9.2], target: [0, 1.6, -0.9], fov: 45, near: 0.1, far: 100 },
    front: { position: [0, 2.65, 7.6], target: [0, 1.5, -1], fov: 42, near: 0.1, far: 100 },
    conversation: { position: [0, 2.45, 5.5], target: [0, 1.65, -1.35], fov: 40, near: 0.1, far: 100 },
    "seat-left-close": { position: [-2.5, 2.25, 2.6], target: [-1.4, 1.7, -1.35], fov: 34, near: 0.1, far: 100 },
    "seat-right-close": { position: [2.5, 2.25, 2.6], target: [1.4, 1.7, -1.35], fov: 34, near: 0.1, far: 100 },
    "seat-guest-close": { position: [4.45, 2.25, 4.2], target: [3.9, 1.7, 0.5], fov: 34, near: 0.1, far: 100 },
    group: { position: [1.1, 2.8, 8.6], target: [1.05, 1.65, -0.65], fov: 43, near: 0.1, far: 100 },
    "conversation-vertical": { position: [0, 2.8, 9.7], target: [0, 1.65, -1.35], fov: 42, near: 0.1, far: 100 },
    "group-vertical": { position: [1.1, 3.3, 15], target: [1.05, 1.65, -0.65], fov: 50, near: 0.1, far: 100 },
    "studio-vertical": { position: [0, 4.2, 25], target: [0, 1.6, -0.9], fov: 50, near: 0.1, far: 100 },
  },
  cameraAnchorMetadata: {
    wide: { framing: "studio", subjectAnchorIds: [], aspectRatios: ["16:9"] },
    front: { framing: "studio", subjectAnchorIds: [], aspectRatios: ["16:9"] },
    conversation: { framing: "conversation", subjectAnchorIds: ["studio-01:host-seat", "studio-01:cohost-seat"], aspectRatios: ["16:9"] },
    "seat-left-close": { framing: "single-seat", subjectAnchorIds: ["studio-01:host-seat"], aspectRatios: ["16:9", "9:16"] },
    "seat-right-close": { framing: "single-seat", subjectAnchorIds: ["studio-01:cohost-seat"], aspectRatios: ["16:9", "9:16"] },
    "seat-guest-close": { framing: "single-seat", subjectAnchorIds: ["studio-01:guest-seat"], aspectRatios: ["16:9", "9:16"] },
    group: { framing: "group", subjectAnchorIds: ["studio-01:host-seat", "studio-01:cohost-seat", "studio-01:guest-seat"], aspectRatios: ["16:9"] },
    "conversation-vertical": { framing: "conversation", subjectAnchorIds: ["studio-01:host-seat", "studio-01:cohost-seat"], aspectRatios: ["9:16"] },
    "group-vertical": { framing: "group", subjectAnchorIds: ["studio-01:host-seat", "studio-01:cohost-seat", "studio-01:guest-seat"], aspectRatios: ["9:16"] },
    "studio-vertical": { framing: "studio", subjectAnchorIds: [], aspectRatios: ["9:16"] },
  },
  characterAnchors: [
    { id: "studio-01:host-seat", kind: "seat", displayName: "\u0635\u0646\u062f\u0644\u06cc \u0645\u06cc\u0632\u0628\u0627\u0646", role: "host", position: [-1.4, 0, -1.35], facingRadians: 0, clearanceRadius: 0.56, surfaceOffsetY: studioChairVisualSpec.seatSurfaceY, seatSurfaceOffsetY: studioChairVisualSpec.seatSurfaceY },
    { id: "studio-01:cohost-seat", kind: "seat", displayName: "\u0635\u0646\u062f\u0644\u06cc \u0647\u0645\u200c\u0645\u06cc\u0632\u0628\u0627\u0646", role: "co-host", position: [1.4, 0, -1.35], facingRadians: 0, clearanceRadius: 0.56, surfaceOffsetY: studioChairVisualSpec.seatSurfaceY, seatSurfaceOffsetY: studioChairVisualSpec.seatSurfaceY },
    { id: "studio-01:guest-seat", kind: "seat", displayName: "\u0635\u0646\u062f\u0644\u06cc \u0645\u0647\u0645\u0627\u0646", role: "guest", position: [3.9, 0, 0.5], facingRadians: -1.12, clearanceRadius: 0.56, surfaceOffsetY: studioChairVisualSpec.seatSurfaceY, seatSurfaceOffsetY: studioChairVisualSpec.seatSurfaceY },
    { id: "studio-01:desk-top-left", kind: "tabletop", displayName: "\u0645\u06cc\u0632 \u067e\u0627\u062f\u06a9\u0633\u062a \u00b7 \u0686\u067e", position: [-0.55, 0, -0.58], facingRadians: 0, clearanceRadius: 0.34, surfaceOffsetY: 1.2, maxCharacterScale: 0.62 },
    { id: "studio-01:desk-top-right", kind: "tabletop", displayName: "\u0645\u06cc\u0632 \u067e\u0627\u062f\u06a9\u0633\u062a \u00b7 \u0631\u0627\u0633\u062a", position: [0.55, 0, -0.58], facingRadians: 0, clearanceRadius: 0.34, surfaceOffsetY: 1.2, maxCharacterScale: 0.62 },
    { id: "studio-01:rug-platform", kind: "platform", displayName: "\u0633\u06a9\u0648\u06cc \u0641\u0631\u0634", position: [0, 0, 1.12], facingRadians: Math.PI, clearanceRadius: 0.5, surfaceOffsetY: 0.082 },
  ],
};
