# Signal Studio AI — Data Models and Persistence Contracts

**Document:** `context/DATA_MODELS.md`  
**Project:** Signal Studio AI  
**Status:** Project schema v8 implemented. Versions v2-v5 add arrangement, display, character identity/instance/state and appearance validation; v6 adds ordered scenes and integer-frame time; v7 adds scene-local arrangements; v8 adds scene-local character action events. Audio/dialogue, camera, subtitle and educational events remain future work.
**Target:** Single-user, local Windows application  
**Language:** English for technical documentation; Persian (`fa-IR`) for all visible application UI

## Studio decoration customization (optional, backward compatible)

Studio 01 prop instances may carry optional `decoration` data. The practical-lights instance stores one sign customization (default/text/image design, colors, illumination, optional project `display-image` asset ID, fit, visibility and a local transform). The wall-art instance stores a two-entry `frames` tuple with per-frame optional image asset ID, contain/cover fit, visibility and local transform. Asset IDs are validated against the active project's manifest. Existing projects without this field retain built-in art; schema version is unchanged. Selection/edit UI state is transient and not serialized.

> This document defines the canonical data concepts and invariants. Implemented project contracts, Zod schemas, migrations, tests, and storage behavior are identified in phase-specific notes; future contracts remain proposals until implemented and accepted.

**Phase 05-A implementation note (2026-11-04):** Schema v6 stores ordered stable scene IDs and scene records with validated names, positive integer `durationFrames`, an optional environment reference, direction notes, per-scene serializable production-camera config, and empty extensible track headers. Project FPS supports 24/25/30/50/60; duration input converts seconds to nearest frame and a frame-rate change converts scene durations to preserve their seconds as closely as integer frames permit. Scene start offsets are derived prefix sums and are never stored. v1-v5 projects migrate in memory with empty scenes and 30 FPS; the original file is only rewritten by the existing backed-up project save path. Scene CRUD, sequence, FPS, and camera data are saved through the existing project revision/backup mechanism and naturally survive project duplication. Editor selection/playback state and mutable Three.js objects are not persisted.

**Phase 03-C implementation note (2026-11-02):** Project schema v2 adds one `environmentArrangement` at project scope for the built-in Studio 01. It holds `environmentId` and validated prop instances with stable IDs, definition IDs, position/rotation/positive scale and visibility. At this milestone, it did not represent scene independence. Scene-local prop arrangements remain planned for Phase 05-B.

**Phase 03-E implementation note (2026-11-02):** Project schema v3 adds `displayAssignments`, keyed by laptop prop-instance ID. Each serializable assignment holds a presentation state (`image`, `video`, or `off`), optional independently retained image/video asset IDs, fit mode (`contain`/`cover`), and brightness. Assets are stored in per-project `display-images`/`display-videos` folders and indexed in the existing asset manifest. v1 and v2 projects migrate in memory to v3; the original JSON is backed up before first write. The assignment references the laptop instance, not its reusable prop definition or mesh. Scene-specific and timeline-driven state remain unimplemented.

**Phase 04-A implementation note (2026-11-02):** Schema v4 stores `characterIdentities`, `characterInstances`, and `characterStates` as separate keyed serializable collections. Identity records reference a stable model ID and hold a custom name/customization data; instances hold their own IDs and identity reference; state records are keyed by instance ID and hold visibility, position/rotation/positive scale, initial placement, and optional anchor reference. The model registry and renderer capabilities are code-defined and are not copied into each project. Unavailable model IDs are retained so projects can load and display a missing-model fallback. v1-v3 migrate in memory to v4 and are backed up on first successful write. Character state remains project-level in v6; a later scene-editing phase must add scene-local presence/overrides with a safe migration policy. Forward direction is local +Z and yaw is rotation around +Y. Identities are reusable within a project; no cross-project global identity catalog is introduced.

**Kamyar grooming customization note (Phase 04-B3):** Hair and beard presets, colors, glasses and beard visibility remain model-supported string values on each reusable character identity; no schema bump is needed. Legacy grooming preset IDs are normalized to the expanded style set (`side-part` hair and `short-boxed-beard` facial hair are the reference-inspired defaults). Invalid hair/beard values safely resolve to those defaults. Preset mesh capabilities do not imply facial animation or rig support.

**Hamid prototype note (Phase 04-B4):** `character-model:hamid` is an independent built-in procedural definition with `hamid-stylized` renderer key. Hair, facial hair, color and supported `bellyFullness` (`natural`, `fuller`, `full`) values are validated against its model fields and stored on each identity. A continuous procedural torso surface changes profile with this setting. Existing schema v5 identity/instance/state contracts remain unchanged; placement assignments and transforms remain per instance and are not recomputed during load. Hamid declares no rig or animation capabilities and remains pending visual acceptance.

**Phase 04-B implementation note (2026-11-02):** Schema v5 keeps identity, instance and transform collections separate. Identity customization keys and values are validated against the selected model registry; renderer definitions remain code-owned. v4 projects migrate in memory to v5. A legacy `character-model:development-human` identity with empty customization maps to `character-model:kamyar` while preserving its identity ID, instance references, transforms and visibility. If legacy customization is non-empty, the model ID and values are retained so the missing-model fallback can load it without silently discarding user data. Existing v1-v3 migrations now produce v5 directly. Customized named identities are reusable project-local presets; they are not global presets shared between projects. No Three.js runtime objects are persisted.

**Phase 04-B3 GLB pipeline and import extension:** Imported definitions are stored as optional `characterModel` metadata on their existing `AssetRecord` in `assetManifest`, keyed by the stable UUID asset ID and paired with the project-local GLB file. This optional manifest field preserves schema v5 compatibility and requires no migration. The definition stores safe project-scoped URL, display name, source height/bounds, floor offset, orientation, seating offset, inspected mesh/material names and diagnostic skeleton/morph/clip metadata. Runtime animation capabilities remain empty until actual controls are implemented. Character identities continue to hold model IDs only; instances continue to reference identity IDs and save independent transforms/visibility/anchor assignments. Duplicate projects copy asset bytes and rewrite only the scoped URL; imported assets may be deleted only after no identity refers to their model ID.

**Character seating implementation note (2026-11-02):** Runtime model definitions include `seatContactY`, model-local `seatPositionOffset`, and `seatYawOffsetRadians`. Environment anchors may specify `seatSurfaceOffsetY` above their unchanged position and already carry a stable ID and facing yaw. Newly added instances have no seat assignment. An explicit assignment records the existing optional `placementAnchorId` on character state and calculates one aligned transform using the current scale and model/anchor offsets. Re-selecting the same seat is a no-op; unassigning preserves the current transform. Saved unknown anchor IDs remain valid so the editor can report an unavailable seat and let the user safely clear the assignment. This requires no project schema version change. Seating state currently follows project-level character state; scene-local assignments belong in future scene overrides.

**Character placement extension (Phase 04-B2):** The environment registry generalizes anchors with `kind` (`seat`, `tabletop`, or `platform`), optional display name/role, generic `surfaceOffsetY`, and optional compact-surface `maxCharacterScale`. Old seat anchors that omit `kind` still mean `seat`, and `seatSurfaceOffsetY` remains a supported alias. Built-in model definitions declare `placementKinds`, `placementContactY`, `placementPositionOffset`, `placementYawOffsetRadians`, and an approximate local `placementRadius`; seat placement continues using the established seat contact metadata, while other surfaces use placement metadata. Anchors remain code-owned environment data, and projects persist their stable ID through the existing optional `placementAnchorId`; no project schema migration is needed. Legacy assignment/resolution APIs remain wrappers. Unassigned characters keep free transforms. Unsupported model/surface combinations, oversized tabletop models, occupied anchors and near-overlap with other instances are rejected; manual transforms are never recomputed on load. These checks use anchor clearances and model radii as conservative editor placement validation, not full mesh collision detection.

**Studio lighting settings (Studio 01 realism extension):** The existing project-level `environmentArrangement` optionally stores validated `lighting` with key, fill and accent intensity, warm/neutral/cool temperature, and a decorative-practicals flag. Parsing older arrangements supplies the Studio 01 default; edits use the existing revision-checked save path, duplicate projects copy settings independently, and reset restores the same defaults. No schema version change is required. Room-wall/ceiling visibility is temporary editor state and is not part of project data. Scene-specific lighting overrides belong to the future scene environment override contract.

**Static expression and future camera note (Phase 04-B2):** ChatGPT's eleven static face presets are stored as the existing identity customization string and alter named eye, eyebrow, pupil and mouth components. Legacy `friendly`, `focused` and `curious` values map at render/UI time, with no project schema bump. Human models expose none of these robot-specific presets. Gaze targets, first-person camera anchors/controls and natural facial animation are design notes only; no project fields or runtime evaluation are added for them here.

**Phase 04-C1 preview state:** Animation preview playback is editor-only ephemeral state keyed by the stable character instance ID. Its action ID, monotonic playback start, duration and optional transient return-to-idle pose are never added to `CharacterProjectData` or project JSON. Persisted identity, appearance, transform, visibility and placement schemas are unchanged. The pure evaluator consumes an explicit scene source timestamp and returns model-local rotation offsets only; preview controls do not call character persistence operations. Future timeline behavior must use serializable instance-addressed events on the shared scene-time/frame clock, not this editor playback record.

**Phase 04-C3 gaze preview state:** Gaze is also editor-only, transient state keyed by stable character instance ID; no schema version or saved project data changed. The record contains a mode, optional stable target ID or numeric world point, local direction/attention preset, transition duration and monotonic preview start. Three.js objects and resolved world positions are never persisted. Future timeline gaze events must use stable instance/prop/camera/anchor references and serializable numeric parameters on the shared scene-time clock; they are not part of this preview contract.

## 1. Purpose and Source of Truth

- Persist only serializable, versioned domain data; never store React components, Three.js object instances, `AudioContext`, `HTMLAudioElement`, browser Blob URLs or mutable scene graph references.
- Separate reusable assets, model presets, character identities and scene character instances.
- Separate audio files, timeline audio clips, speaker identities and speaker-assignment intervals.
- Use stable opaque IDs, independent of human-readable names. Never use an array index or name as an ID.
- Each editing operation must preserve referential integrity and must not change unrelated objects.
- The saved project document is the authoritative source for content. Temporary UI selections and runtime playback time are separate.
- Refer to `context/ARCHITECTURE.md` for ownership/dependency boundaries and `context/BEHAVIOR_SYSTEM.md` for detailed behavior priority rules.

## 2. Common Types, IDs and Time

All IDs are opaque strings (e.g., generated UUIDs). They are intentionally separate types to avoid accidentally referencing the wrong entity.

```ts
type ID<Tag extends string> = string & { readonly __brand: Tag };
type ProjectId = ID<"Project">;
type AssetId = ID<"Asset">;
type ModelId = ID<"Model">;
type CharacterId = ID<"Character">;
type CharacterInstanceId = ID<"CharacterInstance">;
type EnvironmentId = ID<"Environment">;
type PropInstanceId = ID<"PropInstance">;
type SceneId = ID<"Scene">;
type TrackId = ID<"Track">;
type EventId = ID<"Event">;
type SpeakerId = ID<"Speaker">;
type AudioClipId = ID<"AudioClip">;
type CameraId = ID<"Camera">;

type Frame = number; // nonnegative safe integer
type FrameDuration = number; // positive safe integer
type Fps = { numerator: number; denominator: number }; // positive integers

type Vec3 = { x: number; y: number; z: number };
type Quaternion = { x: number; y: number; z: number; w: number };
type Transform = {
  position: Vec3;
  rotation: Quaternion; // canonical persisted orientation
  scale: Vec3;
};
```

**Timing rules**

- Use half-open intervals `[startFrame, endFrame)`; the start is inclusive and the end exclusive. `endFrame > startFrame` except for explicit zero-duration markers.
- All project timeline positions are in **project frames** at `project.fps`. Media source offsets use media seconds or sample positions and must be converted explicitly.
- The sum of ordered scene durations determines the project duration in the initial implementation. No overlapping scenes in the first milestone. Future overlapping transitions require a versioned, explicit timing policy.
- Scene start frames are **derived** by prefix sum of ordered durations, never edited or duplicated in stored scene objects.
- Scene-local frame = project frame − derived scene start frame; conversion must be centralized.
- Validate integer frame boundaries and valid FPS. Convert UI seconds using a documented rounding rule; do not accumulate floating-point seconds as the source of truth.
- Audio sample time may not land exactly on a video frame; preserve sample-accurate media offsets and define mapping to frame time without destroying original audio timing.

## 3. Versioned Project Document

**Phase 02 implementation note (2026-11-01):** Schema version 1 in `src/lib/projects/project-schema.ts` implements the document below with `revision` for optimistic saves, an `assetManifest` keyed by stable asset ID, and empty `events` as the single future event collection. Scene and entity collections are deliberately empty in this milestone because their schemas and behavior belong to later phases. The initial `fps` is 30 and resolution is 1280×720; export settings are stored but not exposed as working controls. Future entity writes require a versioned schema migration. Unknown versions and corrupt JSON are rejected without overwriting the original.

```ts
interface ProjectDocument {
  schemaVersion: number;
  id: ProjectId;
  title: string;
  createdAt: string; // ISO 8601
  updatedAt: string;
  fps: Fps;
  resolution: { width: number; height: number };
  sceneOrder: SceneId[];
  scenes: Record<string, SceneDefinition>;
  characters: Record<string, CharacterDefinition>;
  speakers: Record<string, SpeakerDefinition>;
  audioClips: Record<string, AudioClip>;
  tracks: Record<string, TimelineTrack>;
  exportSettings: ExportSettings;
}
```

- `sceneOrder` contains each existing scene ID exactly once. No duplicate or dangling scene IDs.
- Shared built-in and imported assets, model and environment definitions may live in a separate **local library manifest**. Project snapshots refer to stable IDs and include enough manifest/version information to resolve them deterministically.
- Project-scoped custom definitions may be included in the project only when their ownership is clear; do not maintain conflicting duplicates across a global library and project JSON.
- New projects contain no audio unless the user explicitly loads a demo asset.
- `schemaVersion` determines the migration path. Unknown newer schema versions must never be silently downgraded.

## 4. Asset Manifest and File References

```ts
type AssetKind =
  | "character-model"
  | "environment-model"
  | "prop-model"
  | "texture"
  | "display-image"
  | "display-video"
  | "audio"
  | "animation"
  | "thumbnail";

interface AssetRecord {
  id: AssetId;
  kind: AssetKind;
  displayName: string;
  mediaType: string;
  relativePath: string; // validated within an approved local asset root
  fileSizeBytes: number;
  sha256?: string;
  origin: "built-in" | "imported";
  characterModel?: CharacterModelDefinition; // optional project-local catalog entry; valid only for kind=character-model
  status?: "available" | "missing" | "unsupported"; // resolved runtime status, not blindly trusted
}
```

- Store large assets as files, not embedded base64 strings in project JSON.
- Validate normalized paths, file signatures and file sizes; do not allow path traversal or arbitrary absolute path loading through local APIs.
- Asset deletion checks references and requires explicit user confirmation or a non-destructive reassignment workflow.
- Imported display-image deletion rechecks every project-data reference under the project lock. Laptop assignment removal only clears that assignment (and switches image state to off if needed); permanent deletion removes the manifest record and bytes only after laptop, sign, frame and future scene references are absent. No project schema version change is needed.
- Missing files produce a recoverable missing-asset state; never silently replace the user's audio with bundled demo audio.
- Thumbnail/proxy assets must not replace original media during final export.

## 5. Character Model, Character Identity and Scene Instance

```ts
interface CharacterModelDefinition {
  id: ModelId;
  name: string;
  assetId?: AssetId; // optional for procedural models
  rendererKey?: string; // approved procedural model adapter
  forwardAxis: "+Z" | "-Z" | "+X" | "-X";
  capabilities: {
    appearanceKeys: string[];
    behaviorIds: string[];
    facialRig:
      | "none"
      | "morph-targets"
      | "bones"
      | "digital-face"
      | "procedural";
    bodyRig: "none" | "compatible" | "custom";
  };
  defaultTransform: Transform;
  /** Model-local Y coordinate of the lowest point intended to rest on a seat. */
  seatContactY: number;
}

interface CharacterDefinition {
  id: CharacterId;
  name: string;
  modelId: ModelId;
  appearance: Record<string, string | number | boolean>;
  defaultBehaviorPresetIds: string[];
  defaultSpeakerId?: SpeakerId;
}

interface SceneCharacterInstance {
  id: CharacterInstanceId;
  characterId: CharacterId;
  transform: Transform;
  visibleByDefault: boolean;
  appearanceOverrides?: Record<string, string | number | boolean>;
  behaviorOverrides?: string[];
}
```

**Invariants**

- Creating `CharacterDefinition` adds it to the library, **not** automatically to every scene. `AddCharacterToScene` creates a `SceneCharacterInstance` and its actual visible renderer representation.
- Multiple instances may share the same character definition; each has its own transform, visibility and overrides.
- Customizing Ali must not modify Kamyar even when both use the same human model. Share immutable geometry when safe, not mutable per-instance materials.
- Deleting an instance leaves the reusable character definition and speaker metadata intact.
- A character's mouth, beard, eyes and head attachments must be attached to the correct rig hierarchy. Geometry and appearance support are model-capability specific.
- Spawn placement must not mutate existing character transforms or scene props. If a collision-safe position is unavailable, require explicit placement.
- Speakers use stable IDs; display-name changes must not invalidate voice mappings.

## 6. Speakers and Visibility Are Independent

```ts
interface SpeakerDefinition {
  id: SpeakerId;
  displayName: string;
  kind: "character" | "audio-only";
  characterId?: CharacterId; // required iff kind === 'character'
}
```

A speaker can be hidden or off-screen while talking. A character can appear in a scene while silent. Never silently map an unknown or hidden speaker to Kamyar or to any visible character. If more than one instance of a character is present, provide an explicit scene-local speaker-to-instance binding; avoid arbitrary first-match selection.

## 7. Environments, Props and Scene Composition

```ts
interface EnvironmentDefinition {
  id: EnvironmentId;
  name: string;
  modelAssetId?: AssetId;
  rendererKey?: string;
  capabilities: {
    lighting: boolean;
    editableProps: boolean;
    effects: string[];
  };
  defaultCamera?: CameraPose;
}

interface ScenePropInstance {
  id: PropInstanceId;
  definitionId?: string; // stable built-in procedural prop definition
  assetId?: AssetId; // imported prop model; exactly one prop source is required
  transform: Transform;
  visible: boolean;
  properties?: Record<string, string | number | boolean>;
}

interface DisplayAssignment {
  propInstanceId: PropInstanceId; // a prop with a supported screen surface
  state: "image" | "video" | "off";
  imageAssetId?: AssetId;
  videoAssetId?: AssetId;
  sourceStartSeconds?: number;
  sourceEndSeconds?: number;
  playbackRate?: number;
}

interface EnvironmentOverrides {
  lightingPresetId?: string;
  editableProps: ScenePropInstance[];
  displayAssignments?: DisplayAssignment[];
  effectParameters?: Record<string, string | number | boolean>;
}
```

- The initial real environment is **Podcast Studio**; don't add fictitious alternatives to fill a selector.
- Stage-one customization uses available presets. Later phases can compose environments from validated model/prop assets, lights and cameras. Full mesh modeling from scratch is an advanced future capability.
- Scene overrides never mutate shared environment definitions. Changing an environment must not erase speaker assignments, character identities, or timeline data.
- In schema v2/v3, `environmentArrangement` is a project-level bridge until scenes exist. Its props refer to the built-in environment definition; protected room and acoustic-wall instances must retain their default transforms and visibility. Selection is editor-only state, never serialized. Later scene-specific migration must preserve this arrangement without silently copying mutable state between scenes.
- In schema v3, `displayAssignments` are independent serializable media references keyed by prop-instance ID. State `off` changes only visibility state and must retain media IDs, fit and brightness. Media bytes remain in project-managed files; textures, video elements and playback handles never enter project JSON. The editor inspection camera and playback toggle are transient UI state.
- Laptop close-up camera poses and fullscreen display-viewer open/fullscreen state are transient editor state; they add no project fields and cannot alter the saved display assignment.
- Viewer presentation mode (device, screen-focus or content-only) and fullscreen state are transient UI state. Permanent image removal is a separate confirmed asset operation and is rejected while any project-data reference remains.
- Scene prop IDs are independent of reusable definitions and of one another; add/remove/hide/restore/duplicate/transform operations must preserve scene isolation. Imported media assets are separate from both prop definitions and scene instances. A display's `off` state retains its asset references and timing. Validate that a selected state has the matching available asset and that source ranges are valid; never infer state from an absent file.

## 8. Scenes and Camera Configuration

```ts
interface SceneDefinition {
  id: SceneId;
  name: string; // scene title
  description: string; // organizational summary; does not trigger animation or camera behavior
  sceneType?: "dialogue" | "educational" | "reaction" | "establishing";
  durationFrames: FrameDuration;
  environmentId?: EnvironmentId;
  productionCamera: SceneProductionCamera;
  tracks: SceneTrackHeader[]; // serializable headers only in Phase 05-A
  directionNotes: string; // authored guidance only; not interpreted as behavior
}

interface SceneProductionCamera {
  position: [number, number, number];
  rotation: [number, number, number]; // radians; used only when orientationMode is rotation
  orientationMode: "look-at" | "rotation";
  target: [number, number, number];
  fov: number;
  zoom: number;
  shotType: "wide" | "medium" | "close-up" | "pov";
  framing: "landscape-16:9" | "portrait-9:16";
  targetRef?: { kind: "character-instance" | "prop-instance" | "laptop" | "whiteboard"; id: string };
}
interface SceneTrackHeader {
  id: TrackId;
  kind: "character-presence" | "animation" | "facial-expression" | "gaze" | "audio" | "dialogue"
    | "production-camera" | "educational-content" | "subtitles" | "prop-interaction";
  name: string;
  enabled: boolean;
}
```

**Scene rules**

- A scene may use the same environment and character definitions as other scenes, but its mutable instances are independent.
- Duplicating a scene assigns a new scene ID and new track-header IDs; it copies camera configuration by value and retains references to reusable assets/character/prop targets. Future scene-local entities/events must be remapped when they are introduced.
- Reordering scenes changes derived offsets and episode timing, without changing local event timings or raw source audio files.
- Phase 05-A uses ordered, non-overlapping scene durations and half-open boundaries `[startFrame, endFrame)`. At an exact internal boundary the following scene is active; project end resolves to the final scene's terminal local frame. Offsets are derived prefix sums.
- Each scene owns its serializable production-camera config. Camera pose is independent of editor orbit-camera state; in `look-at` mode orientation derives from position/target, while the saved rotation is available for a future explicit rotation mode. No camera control or camera event evaluator is implemented in Phase 05-A.
- Phase 05-A track entries are extensible serializable headers only; they contain no timed events and have no track editors. Audio, animation, facial, gaze, dialogue, educational, subtitle, production-camera, and prop-interaction events remain future work.
- Scene playback constrains the playhead to the chosen scene range; full project playback traverses scenes by derived offsets. Current character and environment arrangements remain project-level until later scene-local editing work.

## 9. Audio Assets, Clips and Speaker Regions

```ts
interface AudioClip {
  id: AudioClipId;
  assetId: AssetId;
  startFrame: Frame; // position on the global project timeline
  durationFrames: FrameDuration;
  sourceStartSeconds: number; // offset in original audio
  gain: number; // e.g. 0..2, validated
  muted: boolean;
}

interface SpeakerRegion {
  id: EventId;
  audioClipId: AudioClipId;
  startFrame: Frame; // global project interval
  endFrame: Frame;
  speakerId: SpeakerId | null; // null: unassigned/unknown
  status: "assigned" | "unknown" | "silence";
}

interface DialogueEvent {
  id: EventId;
  speakerRegionId?: EventId;
  speakerId: SpeakerId | null;
  startFrame: Frame;
  endFrame: Frame;
  text: string; // metadata; does not synthesize speech
}
```

- Speaker regions belong to a particular audio clip. Their intervals must be within that clip's effective timeline range.
- For an initial mixed conversation workflow, regions on the **same clip** must not overlap and must follow half-open interval semantics. Multiple separate clips may overlap and mix intentionally; simultaneous speakers are supported via separate active clips/regions rather than a forced single global speaker.
- If the same character appears in multiple scenes, speaker identity remains stable; mapping to an instance is resolved per active scene.
- Audio replacement and removal must invalidate or explicitly remap references via confirmed editing commands. Never keep a hidden default recording alive.
- Silence and unknown are distinct from any real character. Missing assignments cause no speaking animation.
- Audio playback uses real media timing. Export audio mixing uses media source offsets and timestamps, not rendered waveform pixels.
- Mouth motion intensity may use precomputed, time-indexed amplitude data (prepared from the relevant source audio); amplitude does **not** determine who speaks. Per-speaker isolation in mixed audio is not assumed.

## 10. Timeline Tracks, Events and Priority

```ts
type TrackKind =
  | "audio"
  | "speaker"
  | "dialogue"
  | "visibility"
  | "facial"
  | "mouth"
  | "eyes"
  | "gaze"
  | "head"
  | "body"
  | "gesture"
  | "camera"
  | "display"
  | "lighting"
  | "environment-effect";

type BehaviorSource = "manual" | "ai-approved" | "dialogue-auto" | "idle";

type EventScope =
  | { kind: "scene"; sceneId: SceneId; startFrame: Frame; endFrame: Frame } // scene-local frames
  | { kind: "project"; startFrame: Frame; endFrame: Frame }; // global frames

interface TimelineTrack {
  id: TrackId;
  kind: TrackKind;
  name: string;
  targetId?: string;
  eventIds: EventId[];
}

interface BehaviorEvent {
  id: EventId;
  scope: EventScope;
  target:
    | { kind: "character-instance"; id: CharacterInstanceId }
    | { kind: "environment"; id: EnvironmentId }
    | { kind: "camera"; id: CameraId };
  behaviorId: string;
  affectedProperties: string[];
  source: BehaviorSource;
  priority: number;
  enabled: boolean;
  intensity: number;
  blendInFrames: number;
  blendOutFrames: number;
  params: Record<string, string | number | boolean | null>;
}
```

- `BehaviorEvent` is one member of a discriminated event union; speaker, dialogue, visibility and camera events must each have validated, purpose-specific schemas rather than being forced into generic `params`.
- A future `DisplayStateEvent` targets a display-capable `PropInstanceId` and selects `image`, `video`, or `off` with a scene-local start/end frame and optional source-video range/rate. A separate `CameraEvent` targets a production camera/preset and records a cut or frame-bounded transition. Both use stable IDs and the same event collection but resolve independently; neither writes into the other's state.
- For video, the requested source timestamp is a pure function of project frame, scene-local event start, project FPS, source offset/range and playback rate. Define frame-boundary, looping/end and decode policies before implementation. Pausing freezes the project playhead; seeking evaluates the target source timestamp directly. Renderer and offline exporter may decode differently, but must select equivalent source frames and handle unavailable frames explicitly.
- Maintain a **single authoritative collection** for events (for example `project.events` in the production schema). A track stores IDs, not duplicate mutable copies. The `ProjectDocument` example above is intentionally incomplete until the union is finalized in `DATA_MODELS` implementation review.
- Priority defaults: manual > user-approved AI > automatic dialogue > idle. Priority conflict resolution is **per affected property/layer**, not globally. Compatible mouth, head, facial and hand animation can run together.
- Define deterministic tie-breaking for events competing on the same layer: explicit `priority`, then stable source precedence, then event ordering/ID. Document and test it.
- Allow character default presets, scene overrides, and timeline events. Timeline manual events override conflicting defaults; never erase defaults from the library.
- Unsupported behaviors must not execute and must not be offered as working UI choices.
- Gaze targets reference a visible instance, camera, prop, or world point. Hidden/missing targets use explicit deterministic fallbacks. Body facing direction and head/eye gaze are separate.
- Refer to `context/BEHAVIOR_SYSTEM.md` for the full behavior model; resolve any mismatch before implementing.

## 11. Deterministic Frame Evaluation Contract

```ts
interface EvaluatedFrame {
  projectFrame: Frame;
  activeSceneId: SceneId | null;
  sceneLocalFrame: Frame | null;
  characterStates: Array<{
    instanceId: CharacterInstanceId;
    visible: boolean;
    transform: Transform;
    normalizedPose: Record<string, number | string | boolean>;
  }>;
  cameraPose: CameraPose | null;
  displayStates: Array<{
    propInstanceId: PropInstanceId;
    state: "image" | "video" | "off";
    assetId: AssetId | null;
    sourceSeconds: number | null;
  }>;
  environmentId: EnvironmentId | null;
  activeAudioClipIds: AudioClipId[];
  activeSpeakerIds: SpeakerId[];
}

// Conceptual pure function; do not implement in Phase 00.
declare function evaluateProjectAtFrame(
  project: ProjectDocument,
  frame: Frame,
  assetMetadata: Readonly<Record<string, unknown>>,
): EvaluatedFrame;
```

- A stable project snapshot and frame must yield the same evaluated **visual state**, irrespective of render order.
- Prepare time-indexed audio analysis data before export if needed; don't call browser media analyzers from the pure evaluator.
- `evaluateProjectAtFrame` never touches React, Three.js scene objects, filesystem, DOM, `Date.now()` or uncontrolled `Math.random()`.
- Preview and offline render consume the same evaluated state. Rendering adapters may differ, but must not invent separate animation state machines.

## 12. UI and Runtime State (Not Saved in Project Document)

```ts
interface EditorUIState {
  selectedProjectId: ProjectId | null;
  selectedSceneId: SceneId | null;
  selectedInstanceId: CharacterInstanceId | null;
  selectedEventIds: EventId[];
  activePanel: string;
  transformTool: "select" | "move" | "rotate" | "scale";
}

interface PlaybackState {
  mode: "scene" | "episode";
  status: "idle" | "playing" | "paused" | "ended";
  currentFrame: Frame;
}
```

- Do not persist transient DOM/Canvas references.
- Preview time and audio position derive from one playback authority. Scrubbing and fullscreen must not create second clocks.
- User editing changes must be represented as validated commands with undo/redo. High-frequency playback ticks are not undoable editing commands.

## 13. Local Persistence and Project Structure

Proposed initial approach: **versioned JSON project documents + managed local folders**. SQLite is optional for a later, justified indexing need.

```text
SignalStudioData/
  projects/
    <project-id>/
      project.json
      backups/
      assets/
        audio/
        models/
        textures/
      thumbnails/
      renders/
  library/
    characters/
    environments/
    shared-assets/
```

- Use atomic write/rename where supported, save backups, and validate before replacing an existing project file.
- Never overwrite imported originals silently.
- Do not assume IndexedDB/Blob URLs are reachable by a local Node.js offline renderer; all referenced assets must resolve through validated local files or explicit handoff.
- Treat project references as logical IDs; use an asset resolver to map them to approved files.

## 14. Referential Integrity, Editing Operations and Migrations

Implement validated commands in later phases, such as:

- `CreateCharacter`, `RenameCharacter`, `UpdateCharacterAppearance`.
- `AddCharacterToScene`, `RemoveCharacterFromScene`, `UpdateInstanceTransform`.
- `CreateScene`, `DuplicateScene`, `ReorderScene`, `ChangeSceneDuration`.
- `ImportAudio`, `ReplaceAudio`, `DeleteAudio`, `AssignSpeakerRegion`.
- `AddBehaviorEvent`, `SetBehaviorPriority`, `UpdateCameraEvent`.

Deletion policies must be explicit:

- **Remove from scene**: delete the scene instance and resolve its scene-local events without removing the reusable character or audio-only speaker.
- **Delete character definition**: block or confirm when referenced; provide non-destructive replacement or cleanup.
- **Delete audio asset**: stop related playback, inspect dependent clips/regions and request confirmation; never silently reactivate demos.
- **Delete environment**: disallow when referenced, or require reassignment.

Migrations must be one-way, testable, backed up, and compatible with older supported projects. Record schema changes in `context/DECISIONS.md`.

## 15. Validation and Test Matrix

Minimum required tests before marking a corresponding feature complete:

| Contract              | Example test                                                          |
| --------------------- | --------------------------------------------------------------------- |
| Unique identities     | Rename Ali without breaking speaker references                        |
| Instance independence | Add Ali to Scene 2; Scene 1 stays identical                           |
| Material isolation    | Change Ali's hoodie; Kamyar remains unchanged                         |
| Scene duplication     | Copy Scene 2; new instance IDs, equivalent initial visual state       |
| Scene ordering        | Reorder scenes; derived offsets and total duration update             |
| Scene boundaries      | Exact start/end frames activate only the intended scene               |
| Audio lifecycle       | Remove audio, reload; deleted audio does not reappear                 |
| Speaker mapping       | Switch Kamyar → ChatGPT → Hamid; only correct visible mouth moves     |
| Audio-only voices     | Hidden/audio-only voice plays without triggering unrelated mouths     |
| Behavior priorities   | Manual gaze overrides auto gaze; speaking mouth continues             |
| Frame determinism     | Frame 200 evaluated directly equals frame 200 after arbitrary queries |
| Asset safety          | Missing GLB/audio gives recoverable error, not crash                  |
| Save/load             | Reopen project and restore scene, character, timeline and asset refs  |
| Canvas integration    | Adding/removing an instance visibly changes the actual 3D viewport    |

Unit tests check domain contracts; browser tests must check actual editor and rendered results. Build success alone is insufficient evidence of functional behavior.

## 16. Scope Boundaries and Open Decisions

- These interfaces are conceptual and must not be copied into production without full schema validation and normalization review.
- Define the final event union, event storage location, and speaker-to-instance binding rules during domain implementation.
- Confirm whether project/library definitions may be shared across projects or must be explicitly copied into project snapshots for portability.
- Confirm the precise transition policy if cross-scene dissolve or overlapping scenes is introduced later.
- Evaluate React Three Fiber/Remotion compatibility at renderer implementation time; do not install rendering packages in the planning phase.
- Importing arbitrary models does **not** imply automatic rigging, facial animation or guaranteed compatibility.
- Full character modeling from scratch and AI-generated 3D assets are advanced future phases, not MVP requirements.

## 17. Documentation and Completion Rules

- This document is the source of truth for conceptual data identities and persistence invariants.
- `context/ARCHITECTURE.md` owns dependency boundaries, `context/BEHAVIOR_SYSTEM.md` owns detailed behavior rules, and the roadmap owns implementation order.
- Future implementation must update the schema, migrations, tests, `context/PROGRESS_CHECKLIST.md` and `context/DECISIONS.md` when contracts change.
- Mark features `[x]` only after appropriate verification; unimplemented and browser-unverified work remains unchecked.

type CinematicFocusTarget =
| { type: "character"; instanceId: string }
| { type: "prop"; instanceId: string }
| { type: "world"; position: [number, number, number] };

type CinematicFocusSettings = {
enabled: boolean;
target: CinematicFocusTarget;
blurIntensity: number;
focusDistance?: number;
transitionFrames: number;
priority: number;
};

type CinematicFocusEvent = {
id: string;
sceneId: string;
startFrame: number;
durationFrames: number;
settings: CinematicFocusSettings;
};

## Gaze Event Requirements

Behavior events must support gaze-specific parameters such as:

- targetType
- targetId
- fallbackTargetType
- fallbackTargetId
- affectEyes
- affectHead
- affectUpperBody
- lookWeight
- allowMutualGaze
- targetSwitchMode
- targetSwitchInterval

The data model must support deterministic gaze evaluation for single-character, mutual, and group interactions.

**Status:** Planning only. No application code has been implemented through this document. **Do not start Phase 01 without explicit approval.**

### Phase 05-B schema v7 scene-local configuration

Schema v7 extends each `SceneDefinition` with `characters: Record<CharacterInstanceId, SceneCharacterConfig>`, `propOverrides: Record<PropInstanceId, ScenePropOverride>`, and an optional Studio 01 `lightingOverride`. A character override stores scene presence by map membership plus visibility, local transform and optional supported placement anchor. A prop override can store visibility, transform, removal, a scene-added instance and decoration data. Existing character identities/appearance, project defaults, media files and reusable definitions remain shared. No Three.js runtime object is serialized.

`SceneDefinition.productionCamera` persists position, rotation radians, orientation mode, look-at point, FOV, zoom, future framing metadata and optional stable target reference. `look-at` derives orientation from position/target; `rotation` applies Euler rotation. A missing target reference safely falls back to the saved fixed target. Current preview uses the editor viewport aspect and does not crop to portrait/landscape metadata.

Editor orbit/free-fly/focus navigation is transient viewport state and is not serialized in the project model. It affects only the editor camera; only the existing explicit capture action writes a pose to the selected scene's `productionCamera`.

Project schema v6 migrates to v7 in memory. Existing scenes with no scene-local character members are seeded from current project character states; existing scene IDs and shared asset references remain stable. Saving still goes through the current backed-up project persistence flow. Scene duplication copies override values independently while retaining references to shared project assets.

Only registered environments can be selected. At implementation time Studio 01 is the sole registered environment, so the UI explains that selection is currently fixed instead of presenting fake choices.

### Phase 05-C schema v8 scene-local character action events

Each scene stores an `actionEvents` array. An event has stable `id`, owning `sceneId`, stable `characterInstanceId`, supported `action`, integer `startFrame` and positive `durationFrames` in scene-local project frames, `enabled`, bounded `priority`, `intensity` and `speed`, and optional `targetKind`/`targetId` for gaze. Schema validation requires the event's scene ID to match its containing scene and its interval to end within that scene. Gaze target references can become unavailable; the evaluator resolves these safely without persisting Three.js objects.

The array order is also used as the persisted **editor list order**. It has no timing or evaluation meaning: the order operation moves an existing record while retaining its ID, frames, priority and parameters. Timeline dragging updates only the integer `startFrame`, preserving duration and clamping the event inside the scene. No schema version or event fields were added for these UI operations.

The editor may present event timing as HH:MM:SS:FF or seconds and as start plus exclusive end; these are UI representations only. Timecode FF is constrained to `[0, projectFps)`, seconds convert by nearest-frame rounding, and the saved contract remains `startFrame` plus `durationFrames`. No project schema migration is required.

Events are independent of reusable character identity and saved world transforms. Scene duplication copies values with new event IDs and the duplicate scene ID; referenced character/prop IDs stay shared project assets/instances. Scene duration and FPS conversion keep event intervals bounded while preserving timing as integer frames permit. v7 projects migrate in memory to v8 with empty `actionEvents`; existing scene/project IDs remain unchanged, and the normal backed-up save path writes the new version on edit.

`evaluateSceneCharacterActions(scene, localFrame, fps, capabilities, gazeCapabilities)` is pure with respect to scene time. It uses existing model capability adapters/evaluators, half-open event intervals, per-channel highest-priority resolution and deterministic tie ordering. Gaze is composed separately from head/arm/facial pose channels. Events are not stored in the extensible track-header array and do not implement audio, dialogue, lip sync, camera, subtitle, educational or export tracks.

### Phase 06 schema v9 audio assets and manual speaker assignment

WAV/MP3 bytes are managed files referenced by `assetManifest` records of kind `audio`; `audioDurationSeconds` is validated asset metadata, and temporary browser object URLs are never stored. `AudioClip` records have stable UUIDs, audio `assetId`, global integer `startFrame`, source start/end seconds, gain `[0,2]` and muted state. `Speaker` records have stable UUIDs and either reference a project character identity or represent an audio-only named speaker. `SpeakerRegion` records use stable UUIDs, a clip ID, clip-local source seconds, optional speaker ID, `assigned`/`unknown`/`silence` status and optional text. Ranges are half-open, positive, within their clip's source trim and may not overlap on the same clip. There are no default speakers or inferred assignments.

Schema v1-v8 migrate in memory to v9 with empty audio records; existing IDs, scenes and character data remain intact. The existing backed-up save path writes v9 only after edits. Audio asset deletion is rejected while any clip refers to the asset; deleting a clip also removes its speaker regions. Same-format file replacement retains the asset ID and refuses durations that invalidate an existing clip. Current clip gain/mute values are persisted but not evaluated audibly; project-clock synchronization, range dragging, automatic diarization, lip-sync and export remain outside the implemented Phase 06 slice.

The scene-aware placement UI does not change this contract: `sceneStartFrame + sceneLocalOffset` is converted into the existing global `AudioClip.startFrame`, while source trim and speaker region boundaries remain seconds relative to the original file. Timeline speaker ranges are projected as `clip.startFrame + (regionSourceSeconds - clip.sourceStartSeconds) × fps` using integer frame rounding. A cross-scene clip remains one stable clip record; the UI requires explicit acknowledgement before placing it across a scene boundary and never silently splits or truncates it.
