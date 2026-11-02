# Signal Studio AI — Development Roadmap

**Document:** `context/ROADMAP.md`  
**Status (2026-11-03):** Phase 05-C is explicitly accepted by the user for MVP/prototype development; browser/visual verification and production acceptance remain open. Phase 06 Audio Asset Management and Manual Speaker Assignment is implemented but remains browser-unverified and incomplete for manual acceptance. Phase 05-A's reported 12 PASS / 1 NOT VERIFIED, Phase 05-B browser verification debt, Phase 04-C2's user-reported visual failures, and BUG-0024/0029/0030 remain unchanged.
**Target:** Single-user Windows local application, Persian RTL editor  
**Current stage:** The user explicitly accepted Phase 05-C for MVP/prototype development on 2026-11-03 and asked to continue the official roadmap. This acceptance is not production-quality acceptance and does not add individual manual test results. Phase 06 audio assets and manual speaker assignment is authorized next. Phase 07 deterministic evaluation, Phase 09 camera direction/transitions, and later work remain gated by the roadmap. Phase 04-C2's visual failures and BUG-0024/0029/0030 remain open; Phase 05-A/B and Phase 05-C browser/visual verification debt is preserved.

**Current scoped refinement:** The laptop viewer has distinct device-framed, screen-focus and content-only modes; this refinement fixes device frame sizing and adds reference-safe imported image deletion. Existing Studio 01 geometry, lighting controls, display playback and project data remain compatible. Automated checks pass; browser visual and deletion-flow acceptance remains pending. No project schema change was made.

## 1. Roadmap Rules

- Implement **one milestone at a time**; never start the next without explicit approval.
- Every milestone has an independently observable vertical slice: UI → domain command → persisted data → preview behavior where relevant.
- **Full phase completion** requires its acceptance criteria, relevant automated tests, a real manual browser check for interactive work, and updated context documents. A separate, explicit MVP/prototype handoff may authorize the next scoped development milestone while noncritical verification debt remains, if no confirmed critical blocker exists; this does not complete the earlier phase or convert unchecked tests into passes.
- `typecheck`, lint, and build passing are necessary but **not sufficient** to assert a user-facing feature works.
- If interactive browser access is missing, mark features **implemented / unverified**, do not check them as completed, and provide exact local test steps.
- No fake buttons, demo audio inserted without consent, placeholder character animations presented as real, or unsupported environment options.
- Existing project data must survive schema changes; use migrations and backups.
- Prioritize correctness and clarity over visual effects and feature count.
- Phase numbers are ordering, not time estimates or promises.

## 2. Phase Dependencies

```text
00 Documentation
    ↓
01 Local Application Foundation
    ↓
02 Local Persistence + Asset Registry
    ↓
03 Basic 3D Viewport + Environment Registry
    ↓
04 Character Models + Scene Instances + Customization
    ↓
05 Scene Manager + Storyboard + Time Model
    ↓
05-B Scene Prop Editing + Studio Refinement
    ↓
    05-C Scene-Local Character Action Events
    ↓
06 Audio Assets + Manual Speaker Timeline
    ↓
06-B Educational Display Media
    ↓
07 Deterministic Timeline + Behavior Evaluation
    ↓
08 Visible Character Animation + Interaction
    ↓
09 Camera Direction + Scripted Events + Transitions
    ↓
10 UX Stabilization + Complete Episode Preview
    ↓
11 Offline Frame-by-Frame Renderer + MP4
    ↓
12 Expandable Environment Composition + Asset Import
    ↓
13 Optional AI Director
    ↓
14 Advanced Creation / Optional Extensions
```

The architecture anticipates later features, but implementation must not build unneeded layers prematurely. Phase 05-B depends on saved scenes; Phase 05-C is an explicitly authorized limited refinement for scene-local character actions and does not complete the broader Phase 07 cross-modal behavior resolver. Phase 06-B depends on local asset storage and scene props; display-state events in 07 depend on 06-B; camera direction in 09 depends on deterministic timeline evaluation; export in 11 depends on both media and camera evaluation. Each new subphase needs explicit authorization. The order of Phases 10–12 may be adjusted only through a documented decision after prerequisite tests pass.

## 3. Phase 00 — Documentation and Design Contracts

**Goal:** Establish one authoritative set of product and engineering requirements.

**Deliverables:** `PROJECT_OVERVIEW.md`, `TECH_STACK.md`, `ARCHITECTURE.md`, `DATA_MODELS.md`, `BEHAVIOR_SYSTEM.md`, `CHARACTERS_AND_AUDIO_REQUIREMENTS.md`, `UI_UX_GUIDELINES.md`, `CODING_STANDARDS.md`, this roadmap, `PROGRESS_CHECKLIST.md`, `BUG_TRACKER.md`, `DECISIONS.md`, and root `AGENTS.md`.

**Acceptance:** Documents reference one another consistently; local-only operating model, asset ownership, speaker assignment, scene/character identity separation, priority rules and render strategy agree. Unresolved decisions are logged; no code is created as part of documentation.

**Out of scope:** Application scaffolding, package installation, functional claims.

## 4. Phase 01 — Local App Foundation

**Goal:** A stable empty Persian application shell on localhost.

**Scope:** Next.js App Router, TypeScript strict mode, Tailwind v4, Git, lint/typecheck/build scripts, Persian RTL layout, LTR-only time displays, navigation shell, real error/empty states, minimal unit and browser test setup. Localhost-only binding; no authentication or cloud dependencies.

**Acceptance:** Each navigation destination has unique content and clear disabled/coming-later treatment; keyboard/focus behavior works; app runs after restart; tests and build pass; no hydration errors in tested browser.

**Out of scope:** 3D content, audio, timeline, rendering, AI.

## 5. Phase 02 — Projects, Local Persistence and Asset Registry

**Goal:** Reliable saved projects and safe local files before complex media features.

**Scope:** Versioned JSON project files, asset folders, atomic write/backup, project CRUD, Zod input validation, unique IDs, import/export, dependency checks, schema migrations, asset registry, explicit sample-content import. Choose a single source of truth; SQLite is deferred unless justified.

**Acceptance:** Create/save/reopen/duplicate/delete project; restart process and retain changes; safely reject invalid files; delete/replacement preserves references or requires confirmation; no silent demo content; path traversal blocked.

**Out of scope:** Animated models, custom cloud backup, online collaboration.

## 6. Phase 03 — 3D Viewport and First Environment

**Approved split (2026-11-01; 03-C scope expanded by explicit user request on 2026-11-02):** Phase 03-A covers the core interactive 3D engine. Phase 03-B is the accepted Podcast Studio and environment registry. Phase 03-C adds a project-level editable arrangement with safe v1 migration, viewport/panel selection, prop add/remove/restore/visibility/transforms/duplication and actual local save/reload. Fullscreen, quality controls and remaining viewport integration checks from the original Phase 03 plan remain acceptance work unless separately verified. No scene-local editing is claimed before the scene system exists.

**Phase 03-D (accepted 2026-11-02 after 16/16 user-reported manual checks):** Refine only Studio 01 geometry, materials and inexpensive lighting while retaining every prop ID, default transform, editor command and project schema. The user reported passing visual, laptop, editing, persistence, camera, performance and console checks. Exact per-test steps and FPS figures were not supplied; unrelated and more specific checks remain open in the progress checklist. Media playback and new environments remain out of scope.

### Phase 03-E — Laptop educational display (accepted 2026-11-03)

**Goal:** Show educational media on the actual laptop display mesh in the accepted Studio 01.

**Scope:** Import locally managed PNG/JPEG/WebP images and MP4/WebM videos up to 64 MiB; assign an image or video independently of the laptop prop definition; support contain/cover, brightness, image/video/off states, retained assignments while off, basic play/pause, stable prop transforms, and a non-destructive editor-only close-up that restores editor camera state. Add versioned project migration and persist display references with project data. This phase is limited to the existing laptop.

**Acceptance:** The user confirmed all 13/13 manual browser acceptance tests passed on 2026-11-03. Individual test names and measurements were not supplied; no additional item-level evidence is implied.

**Out of scope:** Timeline media events and deterministic source-time seeking (Phase 07), display assignment to additional prop types (Phase 06-B extension), cinematic camera automation (Phase 09), and export (Phase 11).

**Goal:** A stable real 3D canvas and reusable environment definition.

**Scope:** React Three Fiber/Three.js, camera controls, 16:9 framing, quality presets, fullscreen and reliable click-to-play/pause shell (playback functionality grows later), asset loading, only the real podcast studio environment. Environment registry with stable IDs. Distinguish edit camera from output camera.

**Acceptance:** Viewport survives navigation, resize and fullscreen; 3D assets load; low-spec quality option works; missing assets show errors rather than crashes; no fake environment dropdown.

**Out of scope:** Multiple invented environments, character animation, video export.

## 7. Phase 04 — Dynamic Character Library and Scene Instances

**Goal:** A new character is a **visible 3D entity**, not only a name entry.

### Phase 04-A — Character library foundation (accepted 2026-11-02)

**Scope:** Reusable model registry with capability metadata; project-local named identities separate from model definitions; independently identified project character instances and serializable placement/visibility state; lightweight, explicitly temporary generic renderer; Persian identity and instance controls; selection and transform controls; safe project schema v4 migration from v1-v3. The current project has no scene entities, so placement is project-level; Phase 05 must migrate/extend presence state to scene-local overrides.

**Acceptance:** The user confirmed all 33 manual acceptance tests passed, including character creation and rename, multiple instances, selection, visibility, transforms and scale persistence, project persistence/isolation, and Persian editor usability. Phase 04-A is accepted. This does not accept Phase 04-B.

### Phase 04-B — Approved character models (implemented; current prototypes user-approved)

**Scope:** Implement visually distinct procedural Kamyar, ChatGPT and Claude renderers from `CHARACTERS_AND_AUDIO_REQUIREMENTS_REVISED.md`; persist per-identity supported appearance customization and reusable project-local character presets without changing identity/instance IDs or transforms. Model geometry is lightweight and not artist-authored or rigged.

**Implementation:** Three unique renderer keys, model-specific supported appearance metadata and Persian controls, per-identity customization validation, and project schema v5 migration from v4.

**MVP handoff (accepted 2026-11-02):** The user explicitly approved the four current character models for MVP/prototype use and authorized Phase 04-C1 under the handoff policy. No per-view, placement, persistence, interaction, console or performance test report was supplied, so these remain unchecked verification debt. Kamyar and Hamid are not accepted as final production-quality models; full Phase 04-B production acceptance remains pending.

**Phase 04-B1 (2026-11-02):** Correct Claude's registered procedural renderer to follow the supplied orange cube mascot reference. The focused change preserves its stable model ID, renderer key, saved customization keys, scale, identities, instances, and transforms. Automated regression coverage is added. Subsequent aggregate user approval covers the current prototype design; no individual test results are inferred.

**Phase 04-B2 (2026-11-02):** Refine the existing ChatGPT procedural renderer, retain its model and project references, expose coordinated static facial presets on the robot only, and extend Studio 01's existing stable placement anchors to supported tabletop/platform surfaces. Preserve chair assignment and free transforms, validate surface/model compatibility and conservative clearance, and do not add facial animation or gaze tracking. Document gaze, POV and natural-animation extension points only. The original note that this subphase did not authorize Phase 04-C remains historical; the later MVP handoff policy and explicit 2026-11-02 authorization permit Phase 04-C1 development while browser verification debt remains.

**Phase 04-B seating assignment extension:** Character instances start unassigned. Users may explicitly choose one available stable seat anchor in the character editor; persisted assignments use the existing optional `placementAnchorId` without a schema version change. Seat alignment uses the selected anchor's surface/facing and model-specific support, local offset and rotation metadata, and runs only for an explicit new assignment. Seat changes are immediate editor operations; walking/sitting transitions and timeline-based changes remain out of scope. Browser interaction/visual acceptance is pending.

**Scope:** See 04-A foundation and 04-B production assets above. Shared geometry may be reused, never unintended mutable transforms/materials.

**Overall acceptance:** Create two differently named characters from one supported model; add both as visible independent instances; modify one without changing the other; move/rotate one without moving props, other actors or camera; verify real model appearance/orientation when production assets exist; save/reopen; missing model handled safely. Only mark individual presets completed when a real, tested 3D model exists.

**Out of scope:** Automatic rigging, photorealistic likeness, advanced facial animation, AI character generator.

**Character direction update (2026-11-02):** Continue the existing stylized procedural human renderer for Kamyar; do not treat photo-to-GLB as a required creation workflow. Original photos guide human identity cues and generated group art guides style. The existing GLB adapter/importer is optional and remains intact. Hamid is implemented as a separate stylized prototype with independent model configuration. The user has explicitly approved all four current character prototypes; no individual test details are inferred from that approval.

### Phase 04-B4 — Hamid stylized character prototype (implemented; user-approved prototype appearance)

Add Hamid as a fourth reusable built-in model with independent model/renderer IDs, head geometry, a connected fuller torso under a black T-shirt, model-specific seat support, and identity-scoped supported customization. Preserve schema v5, IDs, transforms, placement and all existing renderers. The user explicitly approved the current four character prototypes on 2026-11-02; no per-view or performance test results were reported. This procedural prototype is not a production model or animation-ready rig.

### Studio 01 room and lighting extension (implemented; browser review pending)

The Studio 01 room shell now includes a right-side wall and ceiling while retaining its open audience-facing front. Editor-only wall/ceiling visibility supports orbit inspection. Persisted project-level lighting settings include bounded key/fill/accent intensities, color temperature, practical lights and reset; old arrangements receive defaults without a schema version change. Manual browser verification remains required.

## 8. Phase 05 — Scenes, Storyboard and Scene-Time Model

**Goal:** Scenes are independent, ordered segments of the final episode.

**Scope:** Scene CRUD, duplicate, drag-and-drop reorder plus accessible keyboard alternative, duration, derived offsets, scene-local/global time conversion, scene-specific characters, environment reference, cameras and notes; one selected-scene preview vs whole-episode preview mode. Define cut/overlap policies before transitions are implemented.

**Acceptance:** Three scenes can be independently edited; reorder recalculates offsets; clone shares only immutable assets; changing Scene 2 never distorts Scene 1; each duration changes the actual active scene and preview boundaries; refresh restores data.

**Out of scope:** AI script interpretation, advanced fade effects.

**Handoff (2026-11-02):** The user accepted Phase 04-C3 for MVP/prototype use and authorized Phase 05 development. Phase 05 is accepted as the next development handoff but has not started; this does not constitute production acceptance of C3.

### Phase 05-A — Multi-scene foundation and scene time (implemented; browser acceptance pending)

**Implementation:** Replaced the empty scene schema with project schema v6 and backward-compatible in-memory migration from v1-v5. Scenes use stable UUIDs, ordered records, integer frame durations, per-scene serialized production-camera configuration and empty extensible future-track headers. Added create, rename, duplicate, confirmed delete, reorder, duration, active-scene resolution, global/local frame conversion, project FPS selection (24/25/30/50/60), play/pause/stop/seek and previous/next scene controls. The compact Persian storyboard and LTR timeline save through the existing autosave/revision/backup path. Stop returns to project frame zero; internal boundaries are half-open and select the next scene, while project end resolves to the final scene's end. Play time derives from a monotonic start timestamp, not accumulated frame deltas.

**Camera boundary:** Each scene has an independent serializable production-camera config with position, rotation option, look-at target, FOV, zoom, shot preset, 16:9/9:16 framing and stable optional target reference. The config remains separate from editor camera navigation. Phase 05-A adds no camera UI, camera cuts/keyframes/evaluation, transitions, or automated movement.

**Current limits:** Phase 05-A originally displayed project-level character and Studio 01 arrangements. Phase 05-B now resolves scene-local character presence/transforms, supported prop overrides, lighting, environment reference and production camera over shared project assets. Track headers do not contain timed events or editors. No audio, dialogue, animation/gaze event scheduling, subtitles, educational sequencing or export was implemented.

**Acceptance status:** Automated tests cover scene CRUD, IDs, order/offsets, duration/frame-rate conversion, boundary rules, seeking, playback state, schema migration, camera persistence, project duplication and UI wiring. Real-browser create/edit/playback/refresh checks remain pending; do not mark visual/browser acceptance as complete.

### Phase 05-A refinement — Scene authoring and storyboard UX (implemented; acceptance open)

Scene records now include backward-compatible description and optional scene type metadata alongside title, duration, order and director notes. The storyboard shows scene context and offers a selected-scene properties panel. Native drag-and-drop has a visible handle/drop target; keyboard-operable move buttons remain as a fallback. The timeline visualizes proportional scene spans, boundaries and playhead and supports seeking from the ruler without replacing the integer-frame engine.

The user's manual report is **12 PASS / 1 NOT VERIFIED**; the exact scene-boundary selection remains NOT VERIFIED. The user also reported that scenes were not yet meaningfully authorable and that scene management was confusing/lacked drag-and-drop; these are tracked as open BUG-0031/0032 until browser retest. Do not mark Phase 05-A fully accepted until boundary verification and authoring/reorder usability are confirmed. Metadata is organizational and does not generate animation/camera behavior.

### Phase 04-C1 — Reusable animation foundation and manual preview (implemented; browser acceptance pending)

**Implemented scope:** Pure explicit-time pose evaluation; capability-gated neutral, gentle head turn, nod, small arm gesture and return-to-idle preview; transient per-instance playback; shoulder-centered procedural arm pivots; compact Persian preview controls; demand invalidation only during active preview. Saved identity, instance, transform, placement and appearance data remain unchanged. The current model registry advertises only working procedural head/arm channels. Imported GLB skeleton/clip inspection is metadata only and no imported clip action is exposed without a runtime adapter.

**Architecture-only future scope:** Speaker/listener events, gaze targets and director priorities; recorded audio/dialogue speaker tracks and authored visemes; cinematic camera events; character-to-prop attachments and teaching interactions; a common deterministic timeline for audio, character/camera events and eventual MP4 export. These systems are not implemented in C1.

**Automated verification (2026-11-02):** Typecheck, lint, tests, production build and diff check results are recorded in `PROGRESS_CHECKLIST.md`. Unit tests cover capability gates, time determinism/seeking, bounds, return-to-idle, transient persistence separation and cleanup wiring. Real-browser interaction, visual quality, scene lighting, GPU performance and user acceptance remain pending; C1 is not accepted.

### Phase 04-C2 — Expressive character preview (implemented; browser acceptance pending)

Expanded C1 with emotional and gesture presets, bounded transient playback controls, eased transitions and per-channel pose priority resolution. A recovery added named-node facial pose application for ChatGPT, Claude, and limited existing procedural components on Kamyar/Hamid; this is not full human facial rigging. The user rejected the visible result and C2 remains unaccepted. The original three manual failures remain open under BUG-0024; newly reported arm/hand and thinking issues are BUG-0029/0030. Automated checks are recorded in `PROGRESS_CHECKLIST.md` but do not establish visual quality. Do not mark C2 accepted until all required manual checks pass.

### Phase 04-C3 — Manual character gaze and attention (MVP accepted; production acceptance pending)

Adds an explicit-time capability-gated gaze evaluator and per-instance transient editor preview. Stable character IDs resolve to actual head pivots; prop targets resolve in world space with laptop-specific display-surface targeting; the active editor camera, custom world points, manual local directions and short attention previews are supported. Existing named head pivots are used; ChatGPT's independently named iris groups provide eye direction. Unsupported human/Claude eye controls, torso controls and GLB gaze controls remain absent. Missing/hidden targets fall back safely. Gaze does not update project JSON or camera state and composes with independent expression/gesture channels.

**MVP acceptance (2026-11-02):** The user confirmed all 8/8 manual browser tests PASS and accepted Phase 04-C3 for MVP/prototype use. Test names and per-test evidence were not supplied. This does not constitute production-quality acceptance; remaining checks are tracked in `PROGRESS_CHECKLIST.md`. C2's user-reported 9 PASS / 3 FAIL results and three expressive-visual failures remain open and are not resolved by C3 acceptance. Automatic speaker-following, audio-driven gaze, timeline events, camera automation and export are out of scope.

### Phase 05-B — Independent scene configuration, production camera and contextual help (implemented; browser verification pending)

**Goal:** Extend the existing Phase 05-A scenes without replacing its integer-frame time model, storyboard, persistence or R3F viewport.

**Implementation:** Project schema v7 adds scene-local character presence, visibility, placement/transforms, prop visibility/transforms/add/remove/decorations, Studio 01 lighting overrides and environment references. Character identities, appearances, reusable prop definitions, uploaded media and project defaults remain shared; renderer data is resolved from the active scene. Schema v6 migration seeds each existing scene from saved project character states and leaves the project file to the existing safe save path. Scene duplication copies override data by value and preserves stable shared asset references.

Each scene stores an independent serializable production camera, including position, Euler rotation/look-at mode and target, FOV, zoom, framing metadata and stable target references. The editor orbit camera is separate. Camera save-current-view, available Studio 01 shot presets, preview and return-to-editor controls are implemented. Missing targets fall back to the stored fixed point. Camera framing metadata does not crop or resize the current viewport, and animated cuts/keyframes/speaker-following are not implemented.

The Scenes navigation now uses the existing project scene state and operations for create/select/rename/duplicate/delete/reorder. It stays synchronized with storyboard, timeline and viewport selection. Centralized Persian section help and descriptive tooltips cover modified scene/camera controls. Only registered environments are exposed; the current registry contains Studio 01 only. No unsupported environment choices are fabricated.

**Automated evidence:** Schema/configuration, v6 migration, scene override independence, camera preset/target behavior, duplication/persistence and panel-route/synchronization tests are included. Browser verification has not been performed; do not mark UI, camera geometry, visual fit or scene-boundary behavior accepted. Preserve the user report of Phase 05-A 12 PASS / 1 NOT VERIFIED exactly. BUG-0024, BUG-0029 and BUG-0030 remain OPEN.

**Out of scope:** Audio/dialogue sequencing, animation/gaze tracks, camera keyframes and automated direction, export, other unregistered environments.

**Editor navigation refinement (implemented; browser verification pending):** Added transient smoothed orbit/pan/zoom, explicit pointer-locked free-fly, and bounds-based selection focus to improve direct camera positioning. These editor controls do not alter the Phase 05-B per-scene production-camera contract; production camera capture remains an explicit user action. This refinement adds no camera keyframes, cuts, collision solver or automatic tracking and does not begin Phase 09.
### Phase 05-C — Deterministic scene-local character actions and animation editing (implemented; MVP/prototype accepted 2026-11-03; verification pending)

**Authorized scope:** A limited, user-authorized refinement after Phase 05-B for scheduling capability-backed character actions within individual scenes. It reuses scene integer frames, the active-scene resolver, project persistence, the existing animation/gaze evaluators, workspace navigation, inspector, timeline and centralized help registry. The broad Phase 07 behavior resolver remains a later milestone.

**Implementation:** Project schema v8 stores events with stable event IDs, owning scene IDs, target character-instance IDs, action types, integer local start/duration frames, enabled state, bounded priority/intensity/speed, and optional stable gaze-target IDs. Duplicated scenes get independent event IDs and new scene references. Duration and FPS edits keep events in scene bounds. Existing capability-aware animation and gaze evaluators produce frame-derived poses; overlapping events resolve by channel and priority. Scene switching does not share event state.

Main navigation now exposes «حرکت‌ها». The editor selects a scene character and supported action, adds events at the current playhead, shows event blocks in the existing LTR scene timeline, and routes selected-event settings to the existing inspector. A central Persian help topic documents authoring, timing, overlap and current limits. No separate scene/event store or mutable Three.js persistence was introduced.

**Automated coverage:** Schema validation/migration, stable scene/event IDs, duplicate independence, exact start/end behavior, arbitrary-time deterministic evaluation, priority/channel coexistence, capability filtering, duration/FPS adjustment, main navigation/editor/help wiring, and event persistence through project save/reopen and duplication. Browser interaction and actual visual poses remain UNVERIFIED until manual review.

**Professional editing UX refinement (implemented; visual acceptance pending):** The shared dock now switches between scene overview and per-character/category animation tracks, retains the single viewport and global transport, and offers scene-local timeline zoom. Event list order persists through the existing array order and keyboard up/down controls; dragging event handles changes only the frame-aligned start time, preserving duration. Priority is separate and visible in the selected event inspector. No new schema, timing semantics, evaluator rules, or dependency was introduced.

**Out of scope:** Audio/dialogue events, lip sync, a full behavior arbitration engine, camera events/keyframes, subtitle/educational tracks, export, new rigs, and BUG-0024/BUG-0029/BUG-0030 fixes.

## 9. Phase 06 — Audio Asset Management and Manual Speaker Assignment

**Goal:** User-uploaded audio is the source; speaker identity is manually editable.

**Scope:** WAV/MP3 upload, replace/remove, local persistence, real waveform, audio clip placement, segment split/merge/drag/resize, precise start/end, character IDs and audio-only speaker IDs, unassigned/silent intervals, selected-range preview and clear speaker labels. Define overlap and mixed-recording policies. Audio must not auto-default to Kamyar.

**Acceptance:** Upload one mixed recording, assign 0–4 seconds to Kamyar, 4–24 to ChatGPT, a later interval to an audio-only speaker; seek and edit without wrong default speaker; delete asset and verify no playback after restart; UI explains that automatic diarization is not yet supported. These timings are test examples only.

**Out of scope:** Automatic diarization, TTS, lip sync.

**Phase 05-C MVP handoff (2026-11-03):** The user explicitly accepted the implemented Phase 05-C functionality for MVP/prototype development. This records no individual manual PASS results and is not production acceptance. Browser/visual verification remains open; BUG-0024, BUG-0029 and BUG-0030 remain OPEN.

**Phase 06 implementation status (2026-11-03):** Project schema v9 adds validated stable speaker identities, audio clip placements and clip-local speaker ranges while v1-v8 projects migrate with empty audio collections. WAV/MP3 files are validated and stored in the existing managed project audio directory, served through a local range-enabled endpoint, replaced in place while preserving asset IDs, and protected from deletion while referenced. Duplicate projects copy the managed bytes. The existing Audio navigation now hosts local playback, a sample-derived waveform, clip position/source-range/gain metadata editing, manual character/audio-only speaker setup, non-overlapping unknown/assigned/silent ranges, split/merge, numeric range resizing and selected-range playback. Centralized Persian contextual/global help describes the available workflow and its limits.

**Automated verification:** Schema migration/reference rules, upload/replacement/deletion safety, duplicate-byte copying, save/reopen, two-scene clip placement/deletion and frame-to-source playback mapping are covered in the audio test suite; existing regressions remain in the full suite. Project playback now starts active saved clips at their frame-derived source time, and clip mute is honored. Phase 06 remains **in progress**: timeline drag gestures and audible gain above unity are not implemented. Browser media decode/playback, keyboard/touch accessibility, responsive layout, scene switching and manual persistence checks remain pending.

**Timeline editing implementation update (2026-11-05):** Desktop WAV/MP3 and existing library assets can now be dropped on LTR scene regions; project-frame conversion uses the rendered content geometry under zoom/scroll. Clip move, snapping, edge trim, split-at-playhead, Ctrl/Command multi-selection, compatible sequential merge, speaker choice, session undo/redo, and simultaneous Mix distinction are implemented without changing schema v9. Pure edit tests and save/reopen tests pass. Merge supports only the same asset and contiguous source ranges. Browser drag/drop, actual audible playback, pointer/touch behavior and visual acceptance remain unverified because no browser surface was exposed; Phase 06 is not complete. Gain above unity remains metadata-only.

### Phase 06-B — Extend Educational Displays (planned, not started)

**Goal:** Extend the Phase 03-E laptop display system to supported monitor and digital-display props when they are introduced, using the same reusable media assignment model.

**Scope:** Add display-surface support to additional reusable props and environments, reusing local image/video assets, independent assignment state, image/video/off modes, aspect fitting, brightness, playback lifecycle and managed persistence established in 03-E. Validate formats, sizes, missing files, decoding and GPU cleanup for each new surface.

**Acceptance:** Assign existing image and video assets to each newly supported display type, switch to off without losing references, save/reopen, and verify correct aspect ratio, orientation, interaction and performance in a browser. Timeline switching and master-frame video seeking remain Phase 07 criteria.

**Out of scope:** Timeline scheduling of display changes, cinematic camera editor, offline export. Those depend on Phases 07, 09 and 11.

## 10. Phase 07 — Deterministic Timeline and Behavior Resolver

**Goal:** Any frame evaluates to the same scene state regardless of play history.

**Scope:** A pure `evaluateProjectAtFrame(...)` domain function, explicit scene/frame conversions, behavior layer ownership, per-property conflict precedence, priorities and blend boundaries, visibility, camera events, audio references, deterministic prepared audio-amplitude envelope, serializable event schemas. Add independent display-state events for image, video and off; media start/end and source offsets derive the requested video frame from the master timeline. Refer to `BEHAVIOR_SYSTEM.md` as authoritative.

**Acceptance:** Identical project/frame evaluation in random and sequential order; exact boundary tests; manual gaze overrides automatic gaze but does not stop independent mouth motion; hidden speakers remain speakers; no dependence on DOM, React, Three.js mutable instances, `Date.now()` or unseeded random values. Within one scene, repeated image → video → off → image changes resolve exactly at arbitrary frames; turning off a display preserves its asset association. Seeking and pausing select the correct source-video time independently of camera events.

**Out of scope:** Visual quality polish, video encoding.

## 11. Phase 08 — Facial, Gaze and Gesture Animation

**Goal:** Speaking, listening and emotional events visibly affect supported models.

**Scope:** Per-model animation adapters and capabilities; Kamyar mouth separate from beard; mascot mouth on face screen (not chest); blink, idle, smile, laugh, head motion, gaze and selected gestures; speaker-only mouth animation; manual reactions with start/duration/intensity; natural but deterministic micro-variation.

**Acceptance:** Mixed recording alternates correct visible mouth animation; unknown/audio-only speakers do not animate unrelated mouths; gaze can target another visible actor; scene seeks show correct state immediately; unsupported behaviors disabled; simultaneous compatible layers work; tested screenshots/video capture where possible.

**Out of scope:** Phoneme-perfect Persian lip sync, auto-rigging arbitrary GLB models.

### Phase 08-A — Natural Character Acting Refinement (planned; not started or authorized)

**Purpose:** Refine the limited preview foundation into a reusable, model-capability-aware acting library after the applicable timeline and animation prerequisites. This is a future target milestone only; it does not alter the current Phase 05 development handoff or claim any acting action is implemented.

**Target emotional/social states:** Neutral, happy, excited, laughing, sad, angry, worried, afraid, surprised, confused, thinking, curious, embarrassed, frustrated, agreeing, disagreeing, listening, speaking and celebrating.

**Target body/hand actions:** Hand-to-chin thinking; pointing to people/props; open-hand explanation; wave; thumbs-up; nod, head shake, shrug; folded arms; hands resting on desk; leaning forward/back; thoughtful look-away; sitting/standing; and holding compatible educational props. Each action is exposed only where the model has real controls. Hand-to-chin requires controllable arm/shoulder, elbow, wrist and hand joints; do not substitute head motion and call it a hand gesture.

**Architecture requirements:** Keep facial expression, gaze, head, torso, arms, hands and posture as separate composable channels; coordinate channels into performances using model-specific capabilities, safe joint limits, blending, priority, interruption, manual override and smooth transitions. Evaluate deterministically from explicit scene timestamps, support arbitrary-time seeking and future frame export, preserve saved world transforms, and allow multiple independent characters to act simultaneously. Reserve compatible channels for speech-driven lip sync/listener reactions and interactions with laptops, whiteboards, microphones, phones and other props. Keep integrated AMD Radeon performance in scope.

**Acceptance:** Real-browser review confirms distinct supported emotions, visible eyes/brows/mouth, natural smiling/laughing and thinking gestures where supported, responsive excitement, smooth transitions, correct stop/reset, accepted C3 gaze coexistence, unchanged saved transforms, safe joint/prop clearance and acceptable performance with multiple characters. Automated tests alone cannot satisfy visual acceptance. Keep BUG-0024, BUG-0029 and BUG-0030 open until manual verification.

**Out of scope:** Claiming full facial rigging on current MVP human models, enabling unsupported GLB actions, or replacing audio/dialogue/timeline/camera/subtitle/MP4 requirements. Long-term synchronized audio, dialogue, deterministic timeline, cinematic camera, educational presentation, subtitles and MP4 export remain part of the product goal and their existing phases.

## 12. Phase 09 — Camera and Director Tools

**Goal:** Precise, editable scene direction and cinematography.

**Scope:** Production-camera keyframes, user-defined presets and selectable fixed/manual/optional speaker-following modes. Support over-the-shoulder and laptop/monitor display close-ups, wide studio, two-character and multi-character shots, plus custom shots. Manual camera selection and timeline events override automatic suggestions; schedule cuts and smooth transitions. Store separate framing choices for 16:9 and 9:16. Camera selection and display-media selection remain independent; changing angle never stops, replaces or resets display playback. Keep director notes separate from executable events.

**Acceptance:** Camera and transition results repeat at arbitrary times; scene 2 correct when visited directly; hidden characters never inadvertently targeted; text notes are not falsely advertised as executed animation; all editing changes persist. A single scene schedules multiple over-the-shoulder, display close-up, wide and custom shots with cuts or smooth changes; fixed mode stays fixed, speaker-following is optional and a manual event wins. Test 16:9 and 9:16 framing separately. Camera changes leave concurrent screenshot/video/off display state and source-video time unchanged.

**Out of scope:** Natural-language AI director, final renderer.

Phase 09-A — Camera Direction

Phase 09-B — Cinematic Focus & Depth of Field

### Phase 09-A — Camera Direction

- Manual, fixed, and speaker-following camera modes.
- Close-up, wide, group, listener reaction, and over-the-shoulder shots.
- Camera cuts, smooth movements, keyframes, and reusable presets.
- Manual overrides of automatic camera behavior.
- Independent 16:9 and 9:16 framing.

### Phase 09-B — Cinematic Focus and Depth of Field

- Focus on the active speaker, listener, character, or prop.
- Adjustable foreground/background blur and depth of field.
- Smooth rack focus between different targets.
- Enable or disable blur for individual shots.
- Manual focus overrides.
- Timeline-based focus events.
- Performance, Balanced, and Cinematic preview quality.
- Deterministic focus evaluation for offline video rendering.

Do not implement these features before their approved phases.

## 13. Phase 10 — End-to-End Editor UX and Preview Stabilization

**Goal:** A novice can produce and preview a complete episode without coding.

**Scope:** Organized Persian RTL workspace, distinct menus, docked timeline, resizable panels where practical, tooltips, onboarding, safe pointer interaction, fullscreen, click Play/Pause, keyboard controls, autosave feedback, robust error and empty states, consolidated settings and regression tests.

**Acceptance:** Usability walkthrough: create project → add scene/character → upload audio → assign speakers → add reactions → camera → preview entire episode → save/reopen. Play/Pause works on first and second clicks; all visible controls are functional or clearly unavailable. Browser tests and manual walkthrough recorded.

**Out of scope:** Automatic AI creation, production-grade MP4 encoding.

## 14. Phase 11 — Deterministic Offline Frame Rendering and Export

**Goal:** Produce an actual playable video, independently evaluated frame-by-frame.

**Scope:** Validate Remotion/Three integration and licensing; separate local render worker; project snapshot and disk asset handoff; fixed FPS and render resolution; audio mix/mux via a supported encoder/FFmpeg; initial 720p/30fps MP4/H.264 if supported; single-scene and full-episode export; real progress, cancel, cleanup, lower-quality fallback. Do not use MediaRecorder as the final offline render method.

**Acceptance:** Render a short multi-scene sample; open video and verify visuals, character movement, camera changes, display screenshots/video/off states and original audio synchronization; compare arbitrary rendered frames against preview evaluation, including out-of-order seeking across multiple media and camera changes; cancel safely; measure memory/throughput on target laptop; document any output limits. Uploaded video frames must map to master timeline time during seek, pause, playback and offline rendering.

**Out of scope:** Cloud rendering, unverified 4K claims.

## 15. Phase 12 — Environment Composition and External Asset Import

**Goal:** Build more environments from compatible prepared assets.

**Scope:** Add validated GLB/glTF environment/prop import, reusable environment composition, scene-level lighting presets and asset dependency handling; gated import of third-party character models and capability detection. Extend the already verified basic scene-prop editing from 05-B. The built-in podcast environment remains available.

**Acceptance:** Import a supported prop; arrange and save a new environment configuration; reference it from Scene 2 without affecting Scene 1; restart and reload all assets; missing assets fail gracefully; imported characters do not promise animations without rig support.

**Out of scope:** Full Blender replacement, arbitrary automatic character rigging.

## 16. Phase 13 — Optional AI Director

**Goal:** Generate structured, reversible directing suggestions.

**Scope:** Provider-independent interface; scenario → suggested supported event schema; explicit user review/accept/reject; per-property manual override, validated IDs and capabilities; offline rule-based helpers may be labeled separately from real AI. Online AI providers require user choice and credentials.

**Acceptance:** Suggestions never silently overwrite edits, invalid actions are rejected, application fully works with AI disabled, accepted suggestions evaluate deterministically.

**Out of scope:** Unreviewed fully autonomous project edits, fictional API integrations.

## 17. Phase 14 — Advanced Creation (Optional)

Potential later work: procedural character generation, parametric faces/bodies, advanced mesh editing, rigging preparation, more model presets (Gemini/Copilot), optional AI-assisted asset generation, improved facial phonemes, reusable content packs. Each requires a separate approved spec and proof of feasibility.

## 18. Milestone Handoff Template

Every milestone report must include:

1. **Requested phase and scope** (no unrelated work).
2. **Implemented changes** with specific paths and observable behavior.
3. **Tests executed** with actual results; distinguish unit, integration, browser, visual and render tests.
4. **Manual acceptance checklist**, tested on the user's computer where applicable.
5. **Known defects / unverified cases** with severity and reproduction steps.
6. **Data migration / compatibility impact** and backup status.
7. **Performance or accessibility findings**, if measured.
8. **Documentation updates** to `PROGRESS_CHECKLIST.md`, `BUG_TRACKER.md`, and `DECISIONS.md` if needed.
9. **Decision gate:** stop and request approval for next phase; never auto-start.

## 19. Definition of Done

A feature can be marked `[x]` only if its code exists, related behavior has been verified with an appropriate test and (where it is visual/interactive) the real UI has been checked. When verification is blocked, use `[ ]` and note `implemented, verification pending`. A complete phase must have no unaddressed P0 blocking defects for its acceptance criteria.

## 20. Current Roadmap Status

This status block supersedes the original planning-only baseline above. Phase 04-C3 has MVP/prototype acceptance from the user's 8/8 manual browser report; production verification remains separate. Phase 05-A is implemented but retains the user's 12 PASS / 1 NOT VERIFIED report, with exact scene-boundary selection unverified. Phase 05-B and its camera-navigation refinement are implemented with browser verification pending. Phase 05-C is implemented with automated verification; browser, persistence interaction and visual acceptance remain pending. BUG-0024, BUG-0029 and BUG-0030 remain OPEN. Check `PROGRESS_CHECKLIST.md` and `BUG_TRACKER.md` for item-level evidence. Roadmap entries do not themselves authorize work; explicit user approval is still required.
# UI/UX rearchitecture scope note (2026-11-03)

The user explicitly authorized a presentation and interaction rearchitecture while Phase 06 verification remains open. This authorization covers the existing shell and discoverability work only; it does not accept Phase 06, complete Phase 10, or authorize Phase 07/09/11 behavior. The implementation preserves the current project/audio/scene models and adds presentation-only zoom to the shared timeline. Browser visual and interactive verification remains outstanding.
