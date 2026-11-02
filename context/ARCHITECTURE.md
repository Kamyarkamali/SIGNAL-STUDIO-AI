# Signal Studio AI — System Architecture

**Document:** `context/ARCHITECTURE.md`

**Project:** Signal Studio AI

**Application Type:** Local 3D Animation Production Studio

**Target Platform:** Windows Desktop

**Architecture Status:** Implemented incrementally; see phase-specific status below

Studio 01 decoration appearance is optional data on the existing stable prop instances, not new props or environment definitions. The sign renderer and each wall-frame surface consume project-local image asset URLs and per-decoration transforms; the existing environment editor owns edits and project persistence. Editor OrbitControls state is independent from the production camera. Viewport prop selection/edit state is temporary UI state; one viewport click is inert for props, while double-click enters edit mode for editable props and panel selection/edit controls remain available.

Viewport fullscreen is temporary editor UI state on the existing viewport section. The browser Fullscreen API promotes that section only; it does not save project data, reset the editor camera, change the production camera, or remount the R3F scene. CSS keeps the production preview at 16:9 within the fullscreen surface, and the existing canvas resizes through its container observer. Unsupported or denied fullscreen requests return to the normal layout with a Persian status message.

The laptop display viewer is a temporary HTML dialog over the editor. It reads the active project-local image/video assignment and provides device, screen-focus and separately labeled content-only modes. Device/screen frames derive proportions from the shared Studio 01 laptop visual specification; fullscreen remains viewer-only and transient. The viewer does not modify playback state or editor/production cameras. Laptop close-up temporarily reframes the existing editor camera to the screen from a slight overhead angle, saving/restoring position, orientation, up vector and target while keeping its FOV unchanged. Prop selection alone does not show bounds or gizmos; the selection wireframe and TransformControls are visible only in object edit mode.

### Phase 04-C1 character preview runtime

Manual character preview is a transient editor runtime layered beneath each stable scene-instance root. The pure evaluator in `src/lib/characters/animation-preview.ts` accepts an explicit source time in seconds and returns only local head/arm rotations; it never changes the saved world transform. Editor playback controls provide a monotonic start time, while the evaluator itself is stateless and can be called at arbitrary timestamps for seeking or fixed-frame evaluation. Preview records are keyed by character instance ID in editor state and are excluded from project schemas and persistence. Demand rendering is invalidated only while a preview is active, with scheduled frames canceled on stop or unmount.

Model definitions expose only the head/arm channels backed by current named procedural pivots. Arm pivots are located at the shoulder while their child geometry remains in its existing rest pose. Claude has a head pivot but no arm pivots and therefore does not advertise arm gestures. Imported GLB inspection may report skeletons, morph targets, and clip names, but these are diagnostic metadata only; imported models currently expose no preview action until a runtime adapter explicitly supports and validates those channels. Procedural `facialRig`/`bodyRig` remain `none`; this preview does not imply expression, gaze, lip-sync, or full animation readiness.

The long-term product goal is timeline-driven animated podcast and educational video production with instance-addressed character behavior, audio-synchronized voices, director-controlled cinematic camera events, and MP4 export. These systems share scene time and deterministic evaluation, but audio, automatic reactions/gaze, timeline events, cinematic automation and export remain future work.

### Phase 04-C2 expressive preview extension

C2 extends the pure timestamp evaluator with localized actions, bounded transient playback controls and channel-composed priority resolution. A renderer adapter applies deterministic expression weights to named face nodes for ChatGPT, Claude, Kamyar and Hamid; procedural mouths expose named shape meshes and eyes/brows receive model-appropriate local transforms. The head/gaze layer remains independent and additive. Neutral is an explicit expression preview and reset restores baseline transforms/shape visibility. Deterministic preview blinking runs only during playback. Surprise/excitement retain action-specific timing. Human support is limited to existing procedural eye, brow and mouth components; it is not full facial rigging. User has rejected the latest visual result before this recovery; automated checks do not establish visible quality. Browser review remains mandatory, and all three C2 defects remain open.

### Phase 04-C3 gaze runtime

The editor gaze adapter consumes serializable target descriptors in transient per-instance UI state and resolves them against current Three.js world transforms at render time. Character targets use the target instance's named head pivot; prop targets use the actual laptop display surface when present, otherwise the visible prop's world-space bounds; camera targets read the active editor camera; custom points are world-space and directional controls are character-local. Parent transforms, scale and rotation are resolved by the scene graph. Deleted, hidden or unresolvable targets safely return to neutral. The pure evaluator accepts an explicit source timestamp, applies eased transition from the prior local gaze pose, clamps model-specific head/eye/torso channels, and reports whether the target lies outside the supported range.

Only procedural renderers with an actual named `head-pivot` and declared head-rotation channel expose head gaze. ChatGPT also has named independent iris groups and exposes eye offsets; Kamyar, Hamid and Claude do not claim eye tracking, and no current renderer exposes a torso pivot. GLB gaze remains unavailable until named rig nodes are validated and driven by a dedicated adapter. Gaze composes additively with head/arm preview without replacing expression channels or mutating the saved scene transform. Gaze previews are editor-only and do not change project schema. Automatic attention, speaker-following, gaze events on a timeline, and production-camera targeting remain future work.

**Development Phase:** Four Phase 04 character prototypes user-approved in aggregate; Studio 01 realism/lighting upgrade implemented with browser visual review pending

---

## Related Specifications

- `context/PROJECT_OVERVIEW.md` — product goals and approved scope.
- `context/TECH_STACK.md` — technology choices and constraints.
- `context/CHARACTERS_AND_AUDIO_REQUIREMENTS.md` — character and speaker workflows.
- `context/BEHAVIOR_SYSTEM.md` — behavior layers and priorities.
- `context/DATA_MODELS.md` — canonical data contracts (to be authored).
- `context/ROADMAP.md` — incremental execution plan (to be authored).

**Implementation status (2026-11-02):** Phase 04-A established `src/lib/characters` for the validated model registry, project character schemas and operations, plus a `CharacterLayer`/renderer path separate from the environment renderer. Phase 04-B adds distinct lightweight procedural Kamyar, ChatGPT robot and Claude mascot renderers, model-scoped customization capabilities and Persian controls. Phase 04-B1 replaces Claude's incorrect animal-like silhouette with a rounded orange cube, separate named eye/mouth groups, block lower limbs and over-ear headphones. Stable model/renderer IDs and persisted customization keys are retained. Appearance is stored on character identities, so instances of one identity share its appearance while separate identities remain independent. The existing project service persists these settings in schema v5. Character placement remains project-level until Phase 05 adds scenes. The models have no skeletal/facial rigs or animation capabilities, and browser visual acceptance remains pending.

**Seating implementation (2026-11-02):** Environment anchors may describe the seat surface above their unchanged world-space origin; model registry definitions describe the local support point, placement offset and yaw correction. New instances remain unassigned. An explicit seat assignment aligns the current scale and records the stable anchor ID in character state. The renderer and project loader use the exact persisted root transform; they never recompute placement on load. Current assignments are project-scoped until scene-specific character state is introduced.

## 1. Architecture Goals

Signal Studio AI must use a modular, data-driven architecture designed for long-term development and maintainability.

The application must allow users to create 3D animation projects without modifying source code.

The architecture must support:

\- Multiple independent projects.

\- Reusable 3D characters.

\- Customizable character appearance.

\- Reusable 3D environments.

\- Dynamic character presence.

\- Scene-based animation.

\- Audio uploads and speaker assignment.

\- Character reactions and facial animation.

\- Camera direction.

\- Timeline-based editing.

\- Deterministic frame-by-frame rendering.

\- Future AI-assisted directing.

The application must remain functional without cloud services.

## 2. Architectural Principles

### 2.1. Separation of Concerns

Each subsystem must have one clearly defined responsibility.

The editor interface must not directly manage low-level Three.js rendering operations.

The rendering engine must not depend on specific editor panels.

Audio playback must remain separate from speaker identification.

### 2.2. Data-Driven Design

Projects, characters, environments, scenes, and animation events must be represented using serializable structured data.

Adding new characters or scenes must not require modifications to the core rendering engine.

### 2.3. Stable Identity

Every important entity must use a stable unique ID.

Display names must never be used as persistent references.

### 2.4. Incremental Development

Each subsystem must be developed and verified independently.

Do not introduce advanced features before their required foundational systems are functional.

### 2.5. Shared Animation Evaluation

Live preview and offline rendering must use the same animation evaluation rules.

The visual state of any frame must be reproducible without rendering previous frames.

### 2.6. Authoritative Specifications and Conflict Resolution

This document owns system boundaries and data flow. Detailed behavior definitions, per-layer precedence, and animation blending are specified in `context/BEHAVIOR_SYSTEM.md`. Detailed character and audio product requirements are specified in `context/CHARACTERS_AND_AUDIO_REQUIREMENTS.md`. Data field definitions belong in `context/DATA_MODELS.md`.

If specifications conflict, record the conflict in `context/DECISIONS.md` and resolve it before implementation; do not invent a silent interpretation. No requirements document alone authorizes implementing its features.

## 3. High-Level Architecture

The system contains the following layers:

**Layer 1 — User Interface**

Next.js, React, TypeScript and Tailwind CSS.

**Layer 2 — Editor State and Application Services**

Project management, selections, editing operations, commands and settings.

**Layer 3 — Domain Model**

Projects, assets, characters, environments, scenes, audio clips, dialogue and timeline events.

**Layer 4 — Animation and Timeline Engine**

Scene scheduling, animation evaluation, speaker selection, character poses, camera evaluation and transitions.

**Layer 5 — 3D Rendering Engine**

Three.js, React Three Fiber and Drei.

**Layer 6 — Local Persistence**

Versioned project files, local assets and optional SQLite metadata storage.

**Layer 7 — Offline Rendering**

A future independent frame-based rendering process with audio encoding.

**Layer 8 — AI Director**

A future optional AI-assisted planning and direction service.

Dependencies must flow toward stable domain models and interfaces.

The domain model and timeline evaluation logic must not depend on React components, browser APIs, or Three.js objects.

## 4. Application UI Architecture

The editor must consist of independently maintained feature areas.

### Main Workspace

\- Top toolbar.

\- Navigation.

\- Scene viewport.

\- Contextual properties panel.

\- Timeline.

\- Playback controls.

\- Help and onboarding.

### Functional Sections

\- Projects.

\- Scenes.

\- Characters.

\- Environments.

\- Audio.

\- Dialogues.

\- Animations and reactions.

\- Cameras.

\- Settings.

\- Rendering and export.

Each section must expose its own relevant controls.

Selecting a different menu item must not accidentally display unrelated feature content.

The viewport and timeline should remain accessible during normal editing.

The editor must use Persian RTL layout while keeping the time axis LTR.

## 5. Project Domain

A project represents a complete editable animation production.

It contains references to:

\- Project metadata.

\- Ordered scenes.

\- Character definitions.

\- Character instances.

\- Environment definitions.

\- Audio assets.

\- Timeline tracks.

\- Camera settings.

\- Animation events.

\- Export configuration.

Each project must have a schema version.

Project data must remain independent from application UI components.

Large binary assets must not be embedded directly into project JSON.

## 6. Asset Management Architecture

Implement a central Asset Manager.

### Asset Categories

\- Character models.

\- Environment models.

\- Textures.

\- Materials.

\- Audio files.

\- Animation clips.

\- Accessories.

\- Thumbnails.

### Asset Responsibilities

The Asset Manager must:

\- Import supported files.

\- Validate file format and size.

\- Generate stable asset IDs.

\- Store assets locally.

\- Resolve asset references.

\- Load assets on demand.

\- Handle missing files.

\- Track asset dependencies.

\- Support safe asset replacement and deletion.

Deleting an asset referenced by a project must require confirmation or a safe replacement strategy.

Imported display images use the project service's locked dependency check before permanent deletion. It scans serialized project data outside the asset manifest, including laptop display assignments, studio signs and frames, and future scene references. A referenced image cannot be deleted until its assignments are explicitly removed; removing a laptop assignment is a distinct operation from deleting the managed file. Successful deletion updates the manifest and project backup atomically with file cleanup.

A missing asset must not crash the complete application.

### Storage Rules

Application-provided assets and user-imported assets must be clearly distinguished.

References must use stable IDs or validated project-relative paths.

Temporary browser Blob URLs must never be used as permanent project asset references.

## 7. Character Architecture

The system must distinguish three independent concepts.

### 7.1. Character Model Definition

Defines the reusable 3D model.

Properties include:

\- Model ID.

\- Model asset reference.

\- Model type.

\- Supported appearance properties.

\- Supported animation capabilities.

\- Rig information.

\- Available morph targets.

\- Default transform configuration.

### 7.2. Character Definition

Represents an individual reusable character.

Properties include:

\- Character ID.

\- Display name.

\- Referenced model ID.

\- Appearance configuration.

\- Default voice association.

\- Animation configuration.

Example:

Kamyar and Ali may use the same human model but have completely different appearance settings.

### 7.3. Scene Character Instance

Represents a character's actual presence in a specific scene.

Properties include:

\- Instance ID.

\- Character definition ID.

\- Scene ID.

\- Position.

\- Rotation.

\- Scale.

\- Visibility.

\- Appearance overrides.

\- Gaze targets.

\- Animation assignments.

### Character Rendering Pipeline

Character Definition → Model Registry → Scene Instance → Asset Loader → Character Renderer → Visible 3D Model.

Creating a character in the library must not be confused with adding that character to a scene.

A scene instance must only be considered successfully created when it is connected to the renderer and its model can be displayed.

### Isolation Requirements

Each instance must have independent transforms.

Shared geometry may be reused for performance, but instance-specific mutable material state must remain isolated.

Adding one character must not reposition existing characters or scene objects.

### 7.4. Character Appearance and Capability Contract

Character customization is driven by model-supported properties. The renderer must expose only supported options and use immutable configuration data for instance-specific appearance. A character library entry is not automatically a visible 3D scene instance. Instantiation requires a valid model reference, scene instance record, actual renderer mount, and asset load state.

Characters may use prebuilt Kamyar, ChatGPT, Claude, or future models. Imported characters are not presumed rigged or lip-sync ready. Reuse model data safely while isolating mutable materials and transforms. Default placement must not alter existing actors, camera, or set dressing; collision/overlap warnings and manual placement are preferable to destructive auto-layout.

### 7.5. Stylized procedural human character direction and optional GLB replacement

Kamyar remains the existing lightweight, stylized procedural human model. Use the original Kamyar photographs for supported facial and grooming cues and group compositions only for style direction; do not pursue photorealistic reconstruction. The model uses reusable face-surface geometry, fitted hair/beard surfaces, model-scoped customization and stable `character-model:kamyar` references. Hamid is a separate stylized prototype registered as `character-model:hamid` / `hamid-stylized`, with an independently shaped head, a continuous configurable fuller torso/T-shirt surface, and identity-scoped appearance data. Compatible hair and facial-hair geometry utilities may be shared; Hamid does not alias Kamyar's renderer configuration or face mesh. Both human models remain prototypes pending visual acceptance; procedural geometry does not establish likeness or production quality.

The existing GLB adapter and project-local importer remain optional capabilities. They may replace a model behind its stable model reference only when a suitable authored asset is selected; preserve identity IDs, scene instance IDs, saved transforms, visibility, customization where supported, and placement assignments. Missing assets must retain project data and use a recoverable fallback. No production Kamyar or Hamid GLB is required or bundled by the current procedural direction.

**Optional GLB conventions:** self-contained optimized `.glb`, metric/studio scale, +Y up, +Z forward, applied object transforms, floor-aligned origin and model-specific seated contact metadata. Declare only capabilities that the asset actually provides. Use efficient PBR materials and modest embedded textures. Check front, side and three-quarter appearance, seat contact, desk/microphone clearance and integrated-GPU behavior in the studio before accepting an imported replacement.

**Future rig contract:** procedural pivots and GLB skeletons are not animation capabilities by themselves. Do not claim facial rig, expressions, lip sync, or animation readiness unless actual controls exist. Automatic lip sync, gaze and animation behavior are out of scope for the current character modeling work.

**Implemented GLB adapter and project import:** Code-defined entries may use bundled assets; the character library also imports self-contained GLB v2 files into the active project's `assets/character-models` directory through a local-only validated API. The existing asset manifest stores the imported model definition, stable asset ID, measured bounds/named material and mesh metadata, normalized floor offset, orientation and appearance bindings. It remains optional for old manifests, so schema v5 projects need no migration. Project duplication copies model bytes and rewrites project-scoped URLs. A project-scoped runtime catalog combines built-ins and imported models; imported model assets remain separate from character identities and scene instances. Import previews use a temporary low-DPR canvas, support orbit/zoom/front/side/back/reset and bounds display, then release preview resources on dismissal. The loader rejects malformed containers and external dependencies; upload is limited to 64 MiB and validates file signature/GLB structure. Skeletons, clips and morph targets are diagnostic only and do not grant runtime animation capabilities. Model removal is blocked while any identity references it. Missing files retain the identity and render the current recoverable fallback state. Browser review is still required for actual authored files, load warnings, fit, visual usability and target-GPU behavior.

## 8. Environment Architecture

**Phase 03-B implementation (2026-11-01):** `src/lib/environments/registry.ts` contains only the finished Studio 01 definition. `studio-01.ts` stores its stable environment ID, reusable prop definitions, independent default prop instances, camera suggestions and future character anchors as serializable data. `environment-registry.ts` validates references, IDs, finite transforms and camera anchors; `copyDefaultProps` isolates nested transforms for future scene-specific arrangements. `src/components/viewport/environments/` maps renderer keys to independent procedural prop components. The rendering layer reads the registry, while the domain registry does not depend on React or Three.js. This phase does not persist environment references or change schema v1. Asset import, scene overrides and prop editing remain future work.

**03-B camera suggestion review (2026-11-02):** Studio 01 camera poses remain independent of the editor orbit camera. Per-pose metadata records framing intent, suggested aspect ratio and stable character-placement anchor IDs; it never stores character names or infers speaker identity. Separate 16:9 and 9:16 suggestions cover whole-set, two-seat and three-seat composition, with individual seat close-ups. These are starting poses only. Scene camera mode selection (manual, optional speaker-following or fixed), timeline priority/overrides, cuts, interpolation and export framing require later authorized phases and deterministic evaluation. No current UI control claims these functions.

**03-C project arrangement (2026-11-02):** `studio-01.ts` remains the reusable environment template and prop-definition registry. Project JSON v2 stores one validated `environmentArrangement` with independent prop-instance IDs and transforms; selection and active transform mode stay in React editor state. The viewport reads the draft arrangement, while the existing project save hook persists committed changes through revision-checked atomic writes and backups. Session storage remembers only the last open project ID across page refresh; project JSON on disk remains authoritative. v1 is read through an in-memory migration, and no scene independence is claimed. Room shell and acoustic wall are protected in both the editor and schema. Drei TransformControls modifies the selected object during a drag and commits one validated transform on release; default orbit controls are disabled for the drag and restored by lifecycle cleanup. Browser-level verification of this interaction remains required.

**Studio 01 realism and lighting extension:** The room shell closes the sides and ceiling around the set while keeping the audience-facing front open for useful camera access. The right wall, ceiling, floor and rear wall overlap at their joins. Wall/ceiling visibility is editor-only state passed to the room renderer; it never changes saved prop visibility. Project-level light settings live in the existing `environmentArrangement.lighting` field and use backward-compatible defaults, so this extension does not bump project schema v5. Scene-specific lighting overrides remain a later scene-system extension. The laptop's bilingual keyboard legends are one disposable CanvasTexture; screen/media assignment and the saved laptop origin remain unchanged. Browser review of the room, lighting and detail alignment is still required.

**Future educational-prop interaction (documentation only):** Future supported props may include phones/tablets, whiteboards/blackboards, presentation pointers, books and notebooks. Character definitions may expose actual hand attachment points and standing teaching positions; future commands can pick up/release a prop, attach it to a hand, and persist timeline-driven use. Teaching interactions may later coordinate gaze and listener reactions through the deterministic behavior system. None of these interaction, attachment, gaze or timeline capabilities is implemented by this Studio 01 upgrade; future work must define explicit prop, hand-target and event contracts first.

# Dynamic Scene Props and Environment Object Management

Signal Studio AI must provide a data-driven scene prop management system.

Users must be able to customize an existing environment by selecting which objects appear in each scene.

## Core Features

- Maintain a reusable library of 3D props and furniture.
- Support objects such as books, whiteboards, desks, chairs, laptops, microphones, plants, lamps, and decorations.
- Add and remove objects from individual scenes.
- Show or hide objects without deleting their definitions.
- Change each object's position, rotation, and scale.
- Select and manipulate objects directly inside the 3D viewport.
- Duplicate objects.
- Save customized scene arrangements.
- Reuse the same prop assets across multiple scenes.
- Allow multiple independent instances of one asset.

## Scene Independence

Each scene must maintain its own object instances and visibility settings.

Hiding a book in Scene 2 must not hide that book in Scene 1.

Editing one object must not unexpectedly modify other objects or characters.

## Object Placement

Provide beginner-friendly transform controls.

Support:

- Drag-to-move.
- Rotate.
- Scale.
- Grid snapping.
- Optional surface snapping.
- Reset transform.
- Lock/unlock object editing.

Prevent accidental changes to the environment structure while editing props.

## Architecture

Separate:

1. Prop asset definitions.
2. Reusable environment definitions.
3. Scene-specific prop instances.
4. Timeline-based prop animation events.

Use stable IDs and serializable configuration data.

Do not store mutable Three.js meshes directly in project files.

## Timeline Support

Users should eventually be able to animate prop visibility, position, and rotation.

For example, a whiteboard can appear at a specific time or a book can move during a scene.

## UI Requirements

Create a Persian panel titled "وسایل صحنه".

Provide clear controls for adding, removing, showing, hiding, selecting, and transforming objects.

All changes must immediately update the actual 3D viewport.

Do not display unavailable props as selectable assets.

## Acceptance Criteria

- Adding an object makes the real 3D model appear.
- Hiding an object removes it visually.
- Moving an object does not disturb unrelated scene elements.
- Changes remain independent across scenes.
- Object placement persists after saving and reopening.
- Relevant functionality is verified through browser interaction tests.

## Implementation Scope

This is a future scene-composition feature.

Do not implement it during Phase 01.

Implement basic scene-prop management in planned Phase 05-B after saved scenes exist; expand reusable environment composition and external prop import in Phase 12. Refine Studio 01 geometry/materials/lighting in 05-B without replacing its verified registry or exceeding integrated-GPU capacity.

### Educational display boundary (Phase 03-E implementation and future extensions)

A laptop, monitor or digital display remains a reusable 3D prop. Its screen surface reads a scene-local display assignment referencing a managed image or video asset; neither the media file nor playback state is baked into the prop definition. The display has three explicit states: image, video and off/blank. Off hides content while retaining the assigned asset and source timing for later reuse. Correct aspect ratio and screen orientation are renderer concerns; validated asset references and time mapping are domain concerns.

Phase 03-E implements managed image/video import and basic preview on the actual Studio 01 laptop display, including off state, fit, brightness and an editor-only inspection camera. Phase 06-B may extend the same contract to additional display-capable props. Phase 07 adds repeatable scene-local display-state events and derives video source time from the master frame, including seek/pause; the runtime decoder may cache frames but cannot become the timeline authority. Camera events are a separate track and never mutate display assignment or playback position. Phase 09 supplies cinematic angle changes; Phase 11 resolves the same display and camera state per output frame and validates synchronized media export. A scene may contain multiple independent changes of either kind.

An environment must be represented independently from the scenes using it.

### Environment Definition

Contains:

\- Environment ID.

\- Display name.

\- Model or procedural renderer reference.

\- Default lighting.

\- Environment props.

\- Camera anchor suggestions.

\- Supported customization settings.

### Scene Environment Reference

Each scene references an environment ID.

A scene may also define local overrides for:

\- Lighting.

\- Visible props.

\- Camera framing.

\- Atmosphere.

The initial environment is the podcast studio.

Do not create fictional unavailable environment options.

Future environments may be imported or added through validated environment definitions.

Changing a scene's environment must not delete character identities, dialogue events, or unrelated project data.

### 8.1. Composable Environment Authoring (Future Phase)

The first release includes one real environment preset: Podcast Studio. The application must not offer invented environments or unusable environment selectors.

A later environment-composition phase will let the user build a new set by assembling validated reusable GLB/glTF assets, props, lights, surfaces, and cameras. A composed environment is stored as a versioned arrangement of asset references and independent transforms, not an irreversible modification of base assets. A scene references the environment definition plus optional local overrides.

Advanced mesh editing, procedural environment generation, and creating entire 3D models from scratch are explicitly deferred to later phases. Asset import does not imply animation, lighting, physics, or camera compatibility.

## 9. Scene Architecture

A project contains an ordered sequence of scenes.

Each scene must have:

\- Stable scene ID.

\- Name.

\- Duration.

\- Environment reference.

\- Character instances.

\- Camera configuration.

\- Audio clip references.

\- Animation tracks.

\- Dialogue tracks.

\- Scene direction notes.

\- Transition configuration.

### Scene Independence

A scene must not share mutable character or camera transform data with another scene.

Duplicating a scene must create independent editable scene configuration.

Shared asset definitions may remain referenced.

### Scene Timing

Use a global episode timeline and scene-local time.

The start offset of each scene is derived from its ordered position and the defined scene-duration/transition policy.

Do not maintain conflicting manually editable global offsets.

### Scene Switching

Switching scenes must:

1. Resolve the selected scene.

2. Resolve its environment.

3. Resolve visible character instances.

4. Apply saved character transforms.

5. Apply camera configuration.

6. Evaluate the timeline at the selected time.

7. Update the viewport without corrupting unrelated state.

Scene selection and playback time must have explicitly defined behavior.

## 10. Dynamic Character Presence

Character visibility must support both scene-level configuration and timeline events.

Users must be able to:

\- Add or remove characters from scenes.

\- Show or hide characters.

\- Set character entry and exit times.

\- Change position and orientation.

\- Reuse character definitions across scenes.

Removing an instance from a scene must not delete the reusable character definition.

Visibility must be evaluated independently from speaking assignments.

A hidden character may still be an active audio speaker.

Invisible characters must not remain in the rendered image through unintended meshes, accessories, or shadows.

## 11. Audio Architecture

Separate audio data from dialogue interpretation.

### Audio Asset

Represents a locally stored audio file.

### Audio Clip

Represents an instance of an audio asset placed on a timeline.

### Speaker Assignment

Represents the identity of the speaker during a specific time interval.

### Dialogue Event

Represents a timed dialogue entry associated with a speaker.

These entities must remain separate.

### Supported Workflows

**Single mixed recording**

One audio file contains multiple speakers.

Users manually assign speaker intervals.

**Separate recordings**

Different characters have separate audio files or clips.

Users place and align these recordings on the timeline.

### Audio Playback

Use one authoritative playback timeline.

Uploaded audio must not automatically default to a specific character.

A new project must not silently load demo audio.

Deleting an audio file must prevent it from reappearing through stale defaults or playback references.

## 12. Speaker Assignment Architecture

Speaker assignments must reference stable character or audio-only speaker IDs.

A speaker timeline must support:

\- Arbitrary interval lengths.

\- Unlimited speaker changes.

\- Unassigned intervals.

\- Silent intervals.

\- Audio-only speakers.

\- Manual corrections.

\- Timeline seeking.

\- Precise interval boundaries.

Speaker identity must not be inferred from audio amplitude.

For mixed recordings, audio amplitude can help estimate mouth movement intensity, but the speaker assignment determines which character may animate its mouth.

### Speaker-to-Animation Flow

Audio Playback → Current Time → Speaker Timeline → Active Speaker → Character Instance Resolution → Speaking Animation → 3D Model.

If the speaker has no visible character instance, audio continues without activating an unrelated character's mouth.

### 12.1. Speaker Identity Versus Scene Presence

A speaker identity may refer to a reusable character or a separate audio-only speaker. A speaker can be off camera, hidden, or absent from the current scene while their recording plays. Resolution to an animated mouth requires an explicit visible character instance and model support; otherwise no visible mouth animation is triggered.

Overlapping speaker intervals must follow a documented policy (e.g. allow genuine overlapping voices on independent dialogue tracks) rather than automatically selecting an arbitrary speaker. Unknown and silent intervals must not default to Kamyar or any other character. Mixed audio amplitude can modulate the assigned speaker's mouth but cannot identify the speaker.

## 13. Timeline Architecture

Implement a central Timeline Engine independent from React.

### Timeline Tracks

\- Scene tracks.

\- Audio tracks.

\- Dialogue tracks.

\- Character visibility tracks.

\- Body animation tracks.

\- Facial expression tracks.

\- Gaze tracks.

\- Camera tracks.

\- Transition tracks.

### Timeline Responsibilities

\- Resolve active scenes.

\- Resolve active audio clips.

\- Resolve speaking identities.

\- Evaluate animation events.

\- Resolve event priorities.

\- Calculate character visibility.

\- Evaluate camera transforms.

\- Support arbitrary time seeking.

### Time Representation

Prefer integer frame indices or another precise canonical time representation for persisted timeline operations.

Convert between seconds and frames through explicit utilities.

Avoid accumulating floating-point timing drift.

### Event Rules

All timeline events must have stable IDs.

Event boundaries and overlap behavior must be defined.

Manual editing overrides accepted AI suggestions where conflicts exist.

Playback logic must not depend on the selected editor panel.

## 14. Character Animation Architecture

Use a model-independent animation evaluation layer and model-specific animation adapters.

### Animation Evaluation

Determines normalized values such as:

\- Mouth openness.

\- Facial emotion.

\- Blink state.

\- Head orientation.

\- Gaze target.

\- Body posture.

\- Arm gesture.

\- Visibility.

### Animation Adapter

Converts normalized animation values to the actual model's supported:

\- Bone transforms.

\- Morph targets.

\- Materials.

\- Mesh transformations.

\- Digital facial display controls.

A character model must advertise its actual supported capabilities.

Unsupported actions must not be presented as fully functional.

### Animation Priority

Default priority:

1. Explicit manual events.

2. Accepted AI direction events.

3. Automatic conversation reactions.

4. Idle animation.

Compatible animation layers may operate simultaneously.

Conflicting transformations require an explicit resolution policy.

### Determinism

Animations must be reproducible at arbitrary timeline positions.

Do not rely on mutable values accumulated across previous frames for final animation evaluation.

Use deterministic periodic functions or seeded variation for natural idle movement.

### 14.1. Layered Behavior and Priority Resolution

`context/BEHAVIOR_SYSTEM.md` is the authoritative behavior specification. Character defaults, scene overrides, and timestamped events must remain separate sources of configuration. Their merged effective behavior must be evaluated without mutating shared character definitions.

For a conflicting animation property, default priority is: explicit manual director event > user-approved AI event > dialogue-driven reaction > idle behavior. Priority conflicts are resolved **per affected property or animation layer**, not by suppressing every other animation on the character. Compatible speaking, smiling, gaze, blinking, and hand gestures can coexist if model capabilities allow.

The event contract needs stable ID, target identity, channel/layer, start and end or duration, priority, intensity, enabled state, blend-in/out, parameters, and provenance. Define deterministic tie-breaks for equal-priority overlapping events, invalid targets, event boundaries, and absent rig capabilities. Test these rules independently of Three.js.

The user must be able to preview, schedule, disable, and reorder supported behaviors in Persian; unavailable features must not appear functional. Manual overrides must not be erased by AI suggestions.

## 15. Gaze and Character Interaction

Separate character body orientation from head and eye gaze.

Supported targets:

\- Another visible character.

\- Camera.

\- Laptop or scene prop.

\- Fixed world position.

\- Neutral direction.

Gaze calculations must use correct coordinate spaces and model-forward-axis conventions.

Head movement must respect natural rotation limits.

A missing or hidden gaze target must resolve to a safe fallback.

Manual gaze events take precedence over automatic listener behavior.

## 16. Camera Architecture

Keep the editing camera separate from cinematic production cameras.

### Cinematic Focus Architecture

The system must separate:

- Editor camera
- Production camera
- Camera shot configuration
- Focus target
- Depth-of-field settings
- Camera timeline events
- Character gaze and reaction states

Focus targets must reference stable character instance IDs,
prop instance IDs, or world-space anchors.

Camera focus and character gaze are independent systems.

Manual director instructions override automatic speaker-based
camera and focus decisions.

Missing or hidden focus targets must use safe fallbacks.

Focus evaluation must be deterministic and compatible with
offline frame-by-frame rendering.

### Editor Camera

Used to inspect, select, and manipulate the 3D scene.

### Production Camera

Used for actual preview and final video rendering.

Production camera settings must be serializable.

Camera tracks may contain:

\- Position.

\- Rotation.

\- Target.

\- Field of view.

\- Shot type.

\- Transition type.

\- Transition duration.

Camera evaluation must be deterministic and independent of React UI state.

Planned Phase 09 camera direction includes fixed/manual/optional speaker-following modes, user-defined presets and keyframes, over-the-shoulder and display close-up views, wide/two-person/multi-person compositions, cuts and smooth transitions, with separate 16:9 and 9:16 framing. Explicit manual timeline events override automatic suggestions. Display-state events remain independent: a camera change must not stop, replace or rewind a playing video. Hidden or unbound speakers cannot force an unrelated camera target.

## 17. Shared Frame Evaluation

This is a core architectural requirement.

Implement a pure evaluation function conceptually equivalent to:

`evaluateProjectAtFrame(project, frame, fps, assetMetadata)`

The output must describe:

\- Active scene.

\- Visible characters.

\- Character transforms.

\- Animation parameters.

\- Facial expressions.

\- Gaze.

\- Camera.

\- Lighting.

\- Active audio references.

The evaluator must not directly access:

\- React components.

\- Browser DOM.

\- Local filesystem.

\- Three.js mutable scene objects.

\- Wall-clock time.

The same project and frame inputs must produce equivalent outputs.

Audio-derived animation data must be prepared or represented through deterministic time-indexed data for offline rendering.

## 18. Preview Architecture

The preview system displays evaluated project state in real time.

Responsibilities:

\- Play.

\- Pause.

\- Resume.

\- Restart.

\- Seek.

\- Scene-only preview.

\- Full-project preview.

\- Fullscreen preview.

The playback controller owns the authoritative current playback time.

The viewport displays the evaluated state at that time.

Clicking an empty area of the preview toggles Play/Pause.

Interactions with selection or transform tools must not accidentally toggle playback.

Changing panels must not restart playback or recreate the entire scene unnecessarily.

### 18.1. Playback State and Media Clock Policy

One playback controller owns the authoritative play/pause/seek state. Audio playback is synchronized to timeline time; renderer components observe it, not independently own competing clocks. Scene-only preview uses an explicit bounded interval, while whole-episode preview traverses all scene offsets and transition rules. A deleted audio asset must stop active playback and not silently reload a bundled demo recording.

Editor controls must distinguish scene selection from playback position, and must support click-to-toggle playback on empty viewport space (excluding transform handles, object selection, input controls, and drags) in both normal and fullscreen mode.

## 19. Offline Rendering Architecture

Offline video rendering must be separate from the live editor.

The future renderer will consume:

\- Validated project data.

\- Resolved assets.

\- Timeline definitions.

\- Frame settings.

\- Audio clip references.

The renderer must evaluate each output frame independently.

It must not rely on real-time screen recording.

### Proposed Pipeline

Project Snapshot → Asset Validation → Frame Evaluation → 3D Frame Rendering → Audio Mixing → Video Encoding → Output File.

Consider Remotion and FFmpeg during the rendering development phase.

Do not install or implement them before the render phase is approved.

A render job must use a stable project snapshot so that editor changes do not unpredictably affect an active export.

The renderer must support progress reporting, cancellation, and cleanup.

## 20. AI Director Architecture

The AI Director is an optional future subsystem.

It may produce structured proposals for:

\- Scene direction.

\- Gestures.

\- Emotions.

\- Gaze.

\- Camera events.

\- Character presence.

\- Dialogue timing.

AI must not directly mutate project data.

AI output must pass schema validation and capability checks.

Users must be able to review, accept, reject, or edit suggestions.

The application must remain usable without AI services.

## 21. Local Persistence Architecture

**Phase 02 implementation (2026-11-01):** `src/lib/projects/project-service.ts` owns filesystem access; App Router API handlers validate requests and call it. The Windows default root is `%LOCALAPPDATA%/SignalStudioAI` (fallback: `~/AppData/Local/SignalStudioAI`), with `SIGNAL_STUDIO_DATA_DIR` for an absolute override. JSON and managed project-local asset folders are outside the repository by default. Saves use a temporary file, file sync, rename, backup, and revision check; deletions move the project directory to `trash/`. The implementation assumes one local server process per storage root.

Signal Studio AI runs locally on the user's computer.

Persistence must support:

\- Multiple projects.

\- Local audio and 3D assets.

\- Reusable character definitions.

\- Environment definitions.

\- Project autosave.

\- Safe project import/export.

\- Versioned schema migration.

The preferred initial design is versioned project JSON files with managed local asset folders, subject to validation during the persistence phase.

SQLite may be added later if indexing, cross-project asset management, or project querying justifies it.

Do not implement multiple competing sources of truth.

### Data Safety

\- Use validated project-relative file references.

\- Prevent path traversal.

\- Avoid arbitrary filesystem commands.

\- Validate imported files.

\- Handle missing assets.

\- Use atomic save operations where possible.

\- Maintain a recoverable backup for important project updates.

\- Confirm destructive actions.

The local Node.js process is trusted to perform approved project operations, but exposed API endpoints must still validate every request.

The server should bind to localhost unless a specific feature requires otherwise.

### 21.1. Local Asset Safety and Render Handoff

Audio and 3D asset bytes live in managed project-local folders; project data stores stable IDs or validated relative references. Client-side Blob URLs and browser memory are transient and cannot be used as input paths for a separate Node.js renderer. Export preparation must resolve and validate all project assets and produce an immutable render snapshot before starting a job.

A development server bound to localhost is not, by itself, an installed standalone desktop executable. Packaging as a distributable application, if ever required, is a separate future decision. Normal local editing should not require internet connectivity.

## 22. State Ownership

Clearly separate state into three categories.

### Persistent Project State

Saved project, scenes, characters, assets, and timeline configuration.

### Editor UI State

Selected scene, selected character, active panel, tool mode, and temporary editing selections.

### Playback/Rendering State

Current time, playback mode, preview state, and transient rendering resources.

Do not duplicate authoritative values across several independent stores.

For example, the audio player and viewport must not maintain unrelated current-time values.

Use explicit commands to update persistent project data.

## 23. Editing Commands and Undo/Redo

User editing operations should be expressed through validated commands.

Examples:

\- AddCharacter.

\- RemoveCharacterFromScene.

\- UpdateCharacterTransform.

\- CreateScene.

\- ReorderScene.

\- AssignSpeaker.

\- AddReaction.

\- UpdateCameraEvent.

Commands must have predictable effects.

Use command history or a compatible undo/redo mechanism for reversible edits.

Do not include high-frequency playback frame updates in undo history.

Persist committed project changes, not incidental mouse movements on every animation frame.

## 24. Proposed Source Organization

The following is a conceptual structure, not a requirement to create every folder immediately.

```text

src/

  app/

  components/

    editor/

    viewport/

    timeline/

  features/

    projects/

    assets/

    characters/

    environments/

    scenes/

    audio/

    dialogue/

    animation/

    cameras/

    ai-director/

  domain/

    models/

    schemas/

    commands/

    migrations/

  engine/

    timeline/

    animation/

    scene/

    camera/

    frame-evaluator/

  renderers/

    preview/

    offline/

  lib/

    persistence/

    validation/

  stores/

  hooks/

  tests/

```

Keep dependencies aligned with architectural boundaries.

Avoid circular dependencies.

Do not generate empty folders or unused abstraction layers merely to match this structure.

## 25. Performance Architecture

Optimize for a laptop with an AMD Ryzen 5 4500U, 16 GB RAM, and integrated graphics.

Requirements:

\- Reuse immutable geometry resources.

\- Isolate mutable per-character materials.

\- Load heavy models on demand.

\- Cache validated assets where appropriate.

\- Avoid expensive effects by default.

\- Limit unnecessary shadows and rendering resolution.

\- Avoid global React state updates every frame.

\- Dispose of GPU resources carefully.

\- Avoid unnecessary decoding of large audio files.

\- Debounce or batch autosave operations.

\- Use conservative offline rendering concurrency.

Performance optimizations must preserve visual correctness.

### 25.1. Performance and Resource Ownership

Use explicit owner/cleanup rules for Three.js geometries, materials, textures, controls, event listeners, decoded buffers, and AudioContexts. Reuse truly shared immutable assets without prematurely disposing them while other instances remain mounted. Prefer updating transform objects without remounting the 3D scene when selecting a character or editing its appearance.

## 26. Testing Strategy

Each subsystem requires unit tests and suitable integration tests.

### Domain Tests

\- Character identity and instance separation.

\- Scene independence.

\- Project serialization.

\- Schema validation.

\- Asset reference integrity.

### Timeline Tests

\- Speaker assignment.

\- Scene boundaries.

\- Animation precedence.

\- Visibility events.

\- Camera events.

\- Seeking.

\- Deterministic frame evaluation.

### Browser Tests

\- Character creation and placement.

\- Scene switching.

\- Audio upload/removal.

\- Play/Pause.

\- Timeline editing.

\- Settings persistence.

\- Fullscreen interaction.

### Render Tests

\- Arbitrary-frame evaluation.

\- Frame-order independence.

\- Scene transitions.

\- Audio alignment.

\- Output video validation.

A passing build does not prove that a feature is working in the browser.

### 26.1. Cross-System Integration Acceptance Tests

In addition to unit tests, require representative end-to-end scenarios: create a custom-named character from an existing model; place it in scene 2 without altering scene 1; modify its appearance without changing another character sharing the model; save/reopen; assign several speaker changes on one uploaded WAV; ensure only the matching visible model speaks; verify audio-only speakers; switch scene camera without losing geometry; change duration and seek across boundaries; play/pause by clicking the viewport. Browser-visible 3D behavior remains unverified until actually exercised in a browser.

Frame evaluation must produce the same result for a target frame whether evaluated in sequence or out of order. Render validation must inspect a real playable file with audio before announcing that export works.

## 27. Documentation Integration

All implementation agents must read:

\- `AGENTS.md`

\- `context/PROJECT_OVERVIEW.md`

\- `context/TECH_STACK.md`

\- `context/ARCHITECTURE.md`

\- Relevant data-model and coding-standard documents.

After each completed implementation phase:

\- Update the project progress checklist.

\- Record discovered bugs.

\- Record architectural decisions.

\- Document schema changes.

\- Record actual test results.

Do not mark a feature as completed without sufficient verification.

## 28. Architecture Acceptance Criteria

This document is ready for implementation planning when:

1. Major subsystem responsibilities are clearly defined.

2. Character models, definitions, and instances are separated.

3. Scenes and environments are independent.

4. Audio assets and speaker assignments are independent.

5. Timeline ownership is unambiguous.

6. The frame evaluator is independent from rendering UI.

7. Preview and export can share evaluation logic.

8. Persistence supports local projects and asset management.

9. Future AI functionality can be added without rewriting the editor.

10. Core dependencies do not create circular coupling.

### 28.1. Deferred Scope and Phase Gates

The first development phases must implement only the approved foundational systems. The early product supports prebuilt character customization and one real podcast-studio environment; importing and composing additional environments belongs in a dedicated later phase; authoring arbitrary meshes, complete rigging and AI content generation are advanced future capabilities. Do not build a decorative UI for deferred features.

Every phase ends with explicit acceptance criteria, real tests where available, updated `context/PROGRESS_CHECKLIST.md` and `context/BUG_TRACKER.md`, and a report distinguishing implemented, verified, blocked, and planned functionality. Never label a UI control as working unless it changes actual state and the intended 3D preview or output.

## Gaze Target Architecture

The character interaction system must support explicit gaze targets.

A gaze target may reference:

- Another character instance
- The production camera
- A prop instance
- A scene anchor
- A fixed world-space position

Gaze evaluation must remain independent from body transforms and must support simultaneous multi-character interactions.

Mutual gaze, group gaze, and camera-facing gaze must all be supported through deterministic timeline-driven evaluation.

If a gaze target becomes unavailable, hidden, or invalid, the system must resolve a safe fallback rather than producing broken animation.

## 29. Document Status

## Multi-Environment Library Architecture

Signal Studio AI must use an extensible environment library architecture.

The system must support multiple reusable environment definitions rather than a single hardcoded scene.

Initial planned environment definitions include:

- `podcast-studio`
- `open-outdoor`
- `office-workspace`

Each environment definition should contain:

- Stable environment ID
- Display name
- Environment type
- Asset or renderer reference
- Default lighting configuration
- Default prop presets
- Suggested camera anchors
- Supported customization settings
- Optional environment-specific behaviors

Each scene must reference one environment ID.

Scenes may also apply local overrides for:

- Lighting
- Visible props
- Atmosphere
- Camera framing
- Environment-specific settings

Environment definitions must remain independent from scene instances.

Changing the selected environment in one scene must not unintentionally affect other scenes.

Only environments that are actually implemented and available should be exposed as selectable options in the UI.

The architecture must support future environment expansion, including imported environments and user-composed environments, without changing the core scene model.
This architecture describes the intended system.

It does not imply that any application feature has already been implemented.

Technical decisions must be reviewed and recorded before source-code implementation.

**Do not begin application development solely because this document exists.**

## Character Placement, Gaze and POV Extension Points

Environment character anchors are reusable placement points, not chair identities. Each has a stable environment-local ID, a kind (`seat`, `tabletop`, or `platform`), a surface height, facing, and clearance. Model definitions declare supported kinds and local support/offset metadata; current transforms and `placementAnchorId` remain project state. Unassigned character transforms continue to support valid free placement. The existing optional persisted anchor ID is retained for backward compatibility, and its old seat-specific API remains an adapter.

Future models may provide a local POV camera anchor and gaze attachment points, but neither is represented by a runtime contract yet. Gaze targets, eye/head/body controls and POV cameras must stay separate from the editor orbit camera and production camera. They require model capability metadata and deterministic behavior evaluation before implementation; see `BEHAVIOR_SYSTEM.md` and the Phase 08/09 roadmap. No such runtime feature is implied by this architecture note.
