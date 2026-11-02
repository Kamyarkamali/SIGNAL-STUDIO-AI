# Signal Studio AI — Development Roadmap

**Document:** `context/ROADMAP.md`  
**Status:** Phase 04-B has an MVP/prototype handoff accepted for development; functional and production verification remains open. Phase 04-C1/C2 manual preview foundations and Phase 04-C3 manual gaze preview are implemented; browser and visual acceptance remain pending. C2 has three user-reported visual failures that remain open.
**Target:** Single-user Windows local application, Persian RTL editor  
**Current stage:** The user approved Kamyar, ChatGPT, Claude, and Hamid for MVP/prototype use, authorized Phase 04-C1/C2, and explicitly authorizes Phase 04-C3 at MVP level under the AGENTS.md progression policy (2026-11-02). C1/C2/C3 have deterministic manual preview evaluators and compact Persian controls; browser behavior/visual acceptance is not yet verified. This is not final production-quality acceptance. Phase 04-B functional/browser/GPU checks remain verification debt; no itemized results are inferred. Phase 04-A and Phase 03-E retain their separately recorded acceptance. The Studio 01 realism/lighting upgrade awaits browser visual review.

**Current scoped refinement:** Laptop display close-up/fullscreen viewing and prop edit-overlay cleanliness are implemented with automated coverage; manual browser acceptance remains pending. No project schema changes were required.

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

The architecture anticipates later features, but implementation must not build unneeded layers prematurely. Phase 05-B depends on saved scenes; 06-B depends on local asset storage and scene props; display-state events in 07 depend on 06-B; camera direction in 09 depends on deterministic timeline evaluation; export in 11 depends on both media and camera evaluation. Each new subphase needs explicit authorization. The order of Phases 10–12 may be adjusted only through a documented decision after prerequisite tests pass.

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

### Phase 04-C1 — Reusable animation foundation and manual preview (implemented; browser acceptance pending)

**Implemented scope:** Pure explicit-time pose evaluation; capability-gated neutral, gentle head turn, nod, small arm gesture and return-to-idle preview; transient per-instance playback; shoulder-centered procedural arm pivots; compact Persian preview controls; demand invalidation only during active preview. Saved identity, instance, transform, placement and appearance data remain unchanged. The current model registry advertises only working procedural head/arm channels. Imported GLB skeleton/clip inspection is metadata only and no imported clip action is exposed without a runtime adapter.

**Architecture-only future scope:** Speaker/listener events, gaze targets and director priorities; recorded audio/dialogue speaker tracks and authored visemes; cinematic camera events; character-to-prop attachments and teaching interactions; a common deterministic timeline for audio, character/camera events and eventual MP4 export. These systems are not implemented in C1.

**Automated verification (2026-11-02):** Typecheck, lint, tests, production build and diff check results are recorded in `PROGRESS_CHECKLIST.md`. Unit tests cover capability gates, time determinism/seeking, bounds, return-to-idle, transient persistence separation and cleanup wiring. Real-browser interaction, visual quality, scene lighting, GPU performance and user acceptance remain pending; C1 is not accepted.

### Phase 04-C2 — Expressive character preview (implemented; browser acceptance pending)

Expanded C1 with emotional and gesture presets, bounded transient playback controls, eased transitions and per-channel pose priority resolution. ChatGPT's existing face display supports transient expressions; other models use only registered head/arm pivots. Automated checks are recorded in `PROGRESS_CHECKLIST.md`. Browser motion quality, responsiveness, panel usability, stop/reset behavior and visual expression remain unverified; do not mark C2 accepted until manual review.

### Phase 04-C3 — Manual character gaze and attention (implemented; browser acceptance pending)

Adds an explicit-time capability-gated gaze evaluator and per-instance transient editor preview. Stable character IDs resolve to actual head pivots; prop targets resolve in world space with laptop-specific display-surface targeting; the active editor camera, custom world points, manual local directions and short attention previews are supported. Existing named head pivots are used; ChatGPT's independently named iris groups provide eye direction. Unsupported human/Claude eye controls, torso controls and GLB gaze controls remain absent. Missing/hidden targets fall back safely. Gaze does not update project JSON or camera state and composes with independent expression/gesture channels.

Automated checks and manual visual review are tracked in `PROGRESS_CHECKLIST.md`. C3 remains pending browser verification. C2's user-reported 9 PASS / 3 FAIL results and three expressive-visual failures remain open; C3 does not accept or resolve them. Automatic speaker-following, audio-driven gaze, timeline events, camera automation and export are out of scope.

### Phase 05-B — Scene Prop Editing and Studio Refinement (planned, not started)

**Goal:** Extend the 03-C project-level arrangement to independent scene arrangements after the scene system exists, while preserving reusable prop definitions and the accepted Studio 01 architecture.

**Scope:** Add scene-local overrides and migration from the 03-C project-level arrangement; keep all existing prop operations independent per scene. Preserve the Studio 01 visual work from Phase 03-D while adapting arrangements to scenes; any later visual adjustments require separate evidence and must not redesign the renderer or schema unnecessarily.

**Acceptance:** A user edits the studio props in Scene 2, saves and reopens, and Scene 1 and reusable definitions remain unchanged. Duplicate instances move independently. Selection and transforms work from viewport and Persian controls, with no phantom assets. Before/after browser views verify the host-facing laptop and useful camera sightlines; performance is measured on target integrated graphics without an unjustified regression.

**Out of scope:** New fictional environments, arbitrary mesh modeling, media playback and cinematic camera editing.

## 9. Phase 06 — Audio Asset Management and Manual Speaker Assignment

**Goal:** User-uploaded audio is the source; speaker identity is manually editable.

**Scope:** WAV/MP3 upload, replace/remove, local persistence, real waveform, audio clip placement, segment split/merge/drag/resize, precise start/end, character IDs and audio-only speaker IDs, unassigned/silent intervals, selected-range preview and clear speaker labels. Define overlap and mixed-recording policies. Audio must not auto-default to Kamyar.

**Acceptance:** Upload one mixed recording, assign 0–4 seconds to Kamyar, 4–24 to ChatGPT, a later interval to an audio-only speaker; seek and edit without wrong default speaker; delete asset and verify no playback after restart; UI explains that automatic diarization is not yet supported. These timings are test examples only.

**Out of scope:** Automatic diarization, TTS, lip sync.

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

**Phase 00:** Documentation being drafted and reviewed.  
**Phases 01–14:** Not started; listed as future work, not delivered functionality.

**This is a planning document. Do not initialize or modify application code solely because this roadmap exists.**
