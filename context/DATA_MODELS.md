# Signal Studio AI — Data Models and Persistence Contracts

**Document:** `context/DATA_MODELS.md`  
**Project:** Signal Studio AI  
**Status:** Proposed schema, planning phase — not implemented  
**Target:** Single-user, local Windows application  
**Language:** English for technical documentation; Persian (`fa-IR`) for all visible application UI

> This document defines the canonical data concepts and invariants. TypeScript examples are illustrative contracts, **not** production-ready schemas. Zod schemas, migrations, tests and storage adapters must be created in their approved implementation phases.

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
  status?: "available" | "missing" | "unsupported"; // resolved runtime status, not blindly trusted
}
```

- Store large assets as files, not embedded base64 strings in project JSON.
- Validate normalized paths, file signatures and file sizes; do not allow path traversal or arbitrary absolute path loading through local APIs.
- Asset deletion checks references and requires explicit user confirmation or a non-destructive reassignment workflow.
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
  assetId: AssetId;
  transform: Transform;
  visible: boolean;
  properties?: Record<string, string | number | boolean>;
}

interface EnvironmentOverrides {
  lightingPresetId?: string;
  editableProps: ScenePropInstance[];
  effectParameters?: Record<string, string | number | boolean>;
}
```

- The initial real environment is **Podcast Studio**; don't add fictitious alternatives to fill a selector.
- Stage-one customization uses available presets. Later phases can compose environments from validated model/prop assets, lights and cameras. Full mesh modeling from scratch is an advanced future capability.
- Scene overrides never mutate shared environment definitions. Changing an environment must not erase speaker assignments, character identities, or timeline data.

## 8. Scenes and Camera Configuration

```ts
interface SceneDefinition {
  id: SceneId;
  name: string;
  durationFrames: FrameDuration;
  environmentId: EnvironmentId;
  environmentOverrides?: EnvironmentOverrides;
  characterInstances: SceneCharacterInstance[];
  cameraIds: CameraId[];
  defaultCameraId?: CameraId;
  directionNotes: string; // notes only; not executable instructions
  outgoingTransition: SceneTransition;
}

type SceneTransition =
  | { kind: "cut" }
  | { kind: "fade"; durationFrames: FrameDuration };

interface CameraPose {
  transform: Transform;
  fovDegrees: number;
  focusTarget?:
    | { kind: "world-point"; point: Vec3 }
    | { kind: "character-instance"; instanceId: CharacterInstanceId };
}
interface CameraDefinition {
  id: CameraId;
  sceneId: SceneId;
  name: string;
  pose: CameraPose;
}
```

**Scene rules**

- A scene may use the same environment and character definitions as other scenes, but its mutable instances are independent.
- Duplicating a scene assigns new scene/instance/event IDs and remaps **scene-local references** to those IDs; shared definitions/assets retain stable IDs.
- Reordering scenes changes derived offsets and episode timing, without changing local event timings or raw source audio files.
- Initial transition policy: `cut` is instantaneous; a `fade` is a frame-evaluated **visual overlay** during the tail of the outgoing scene, with duration no greater than that scene's duration. It does not overlap scene durations or alter audio timing. Cross-scene dissolves are a future policy requiring explicit schema changes.
- Camera definitions are stored in a scene-scoped collection or normalized project registry, but not both as mutable sources of truth.
- Scene previews constrain playhead and audio routing to the selected scene range; full episode playback traverses all scenes.

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
