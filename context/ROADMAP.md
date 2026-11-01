# Signal Studio AI — Development Roadmap

**Document:** `context/ROADMAP.md`  
**Status:** Phases 03-A and 03-B accepted; later phases are planned and require separate approval
**Target:** Single-user Windows local application, Persian RTL editor  
**Current stage:** Phase 03-C pending; overall Phase 03 remains open.

## 1. Roadmap Rules

- Implement **one milestone at a time**; never start the next without explicit approval.
- Every milestone has an independently observable vertical slice: UI → domain command → persisted data → preview behavior where relevant.
- Definition of done requires acceptance criteria, relevant automated tests, a real manual browser check for interactive work, and updated context documents.
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

**Approved split (2026-11-01):** Phase 03-A covers only the core interactive 3D engine: Three.js, React Three Fiber, Drei, WebGL canvas, editor orbit/zoom camera, serializable production camera contract, reference ground/test mesh, responsive 16:9 sizing, failure feedback, and resource cleanup. The test mesh is temporary development content. Phase 03-B is the first real Podcast Studio environment, environment registry and asset loading. Phase 03-C covers the remaining Phase 03 viewport features and integration acceptance. Completion of 03-A does not complete Phase 03.

**Goal:** A stable real 3D canvas and reusable environment definition.

**Scope:** React Three Fiber/Three.js, camera controls, 16:9 framing, quality presets, fullscreen and reliable click-to-play/pause shell (playback functionality grows later), asset loading, only the real podcast studio environment. Environment registry with stable IDs. Distinguish edit camera from output camera.

**Acceptance:** Viewport survives navigation, resize and fullscreen; 3D assets load; low-spec quality option works; missing assets show errors rather than crashes; no fake environment dropdown.

**Out of scope:** Multiple invented environments, character animation, video export.

## 7. Phase 04 — Dynamic Character Library and Scene Instances

**Goal:** A new character is a **visible 3D entity**, not only a name entry.

**Scope:** Character model registry; prebuilt Kamyar, cute ChatGPT mascot and Claude as genuinely available model assets, added incrementally and clearly tracked; character definitions vs instances; appearance capabilities; instance transforms; in-viewport selection/move/rotate with safe camera controls; visibility; persistence. Shared geometry may be reused, never unintended mutable transforms/materials.

**Acceptance:** Create two differently named characters from one supported model; add both as visible independent instances; modify one without changing the other; move/rotate one without moving props, other actors or camera; front/side-view facial geometry looks correct; save/reopen; missing model handled safely. Only mark individual presets completed when a real, tested 3D model exists.

**Out of scope:** Automatic rigging, photorealistic likeness, advanced facial animation, AI character generator.

## 8. Phase 05 — Scenes, Storyboard and Scene-Time Model

**Goal:** Scenes are independent, ordered segments of the final episode.

**Scope:** Scene CRUD, duplicate, drag-and-drop reorder plus accessible keyboard alternative, duration, derived offsets, scene-local/global time conversion, scene-specific characters, environment reference, cameras and notes; one selected-scene preview vs whole-episode preview mode. Define cut/overlap policies before transitions are implemented.

**Acceptance:** Three scenes can be independently edited; reorder recalculates offsets; clone shares only immutable assets; changing Scene 2 never distorts Scene 1; each duration changes the actual active scene and preview boundaries; refresh restores data.

**Out of scope:** AI script interpretation, advanced fade effects.

### Phase 05-B — Scene Prop Editing and Studio Refinement (planned, not started)

**Goal:** Edit independent scene arrangements while preserving reusable prop definitions and the accepted Studio 01 architecture.

**Scope:** Add, remove, hide, restore, duplicate, select, move, rotate and scale real available prop instances from the viewport and Persian UI; persist per-scene arrangements and stable IDs; refine existing podcast furniture, laptop proportions, materials and lighting for visual consistency on integrated graphics. Keep scene instances separate from prop definitions and avoid a needless renderer or schema redesign. Version and migrate project data before persisting new scene fields.

**Acceptance:** A user edits the studio props in Scene 2, saves and reopens, and Scene 1 and reusable definitions remain unchanged. Duplicate instances move independently. Selection and transforms work from viewport and Persian controls, with no phantom assets. Before/after browser views verify the host-facing laptop and useful camera sightlines; performance is measured on target integrated graphics without an unjustified regression.

**Out of scope:** New fictional environments, arbitrary mesh modeling, media playback and cinematic camera editing.

## 9. Phase 06 — Audio Asset Management and Manual Speaker Assignment

**Goal:** User-uploaded audio is the source; speaker identity is manually editable.

**Scope:** WAV/MP3 upload, replace/remove, local persistence, real waveform, audio clip placement, segment split/merge/drag/resize, precise start/end, character IDs and audio-only speaker IDs, unassigned/silent intervals, selected-range preview and clear speaker labels. Define overlap and mixed-recording policies. Audio must not auto-default to Kamyar.

**Acceptance:** Upload one mixed recording, assign 0–4 seconds to Kamyar, 4–24 to ChatGPT, a later interval to an audio-only speaker; seek and edit without wrong default speaker; delete asset and verify no playback after restart; UI explains that automatic diarization is not yet supported. These timings are test examples only.

**Out of scope:** Automatic diarization, TTS, lip sync.

### Phase 06-B — Educational Display Media (planned, not started)

**Goal:** Show locally uploaded educational content on a real laptop, monitor or digital display prop.

**Scope:** Import supported images/screenshots and video files into managed local assets; assign a separate media reference to a display surface without changing the underlying prop definition; select image, video or screen-off state; preserve aspect ratio and host-facing screen orientation; basic video playback, pause, seek and visibility in preview; retain media configuration while the screen is off. Validate formats, sizes, missing files, decoding and GPU cleanup. A blank/off display must be a real state, not a deleted asset.

**Acceptance:** Import a programming screenshot and a supported tutorial video, alternate each with off/blank on one display, save/reopen and recover the same assignments. Video can play, pause and seek on the selected display, while an unrelated camera choice leaves media state unchanged. Unsupported media reports a Persian error and does not corrupt the project. Browser tests verify aspect ratio, orientation and integrated-GPU behavior.

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
