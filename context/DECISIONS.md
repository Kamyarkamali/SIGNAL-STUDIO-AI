# Signal Studio AI — Architecture Decision Log

**Path:** `context/DECISIONS.md`  
**Status:** Planning / Phase 00

## How to record decisions

Use IDs `ADR-001`, `ADR-002`, etc. Each entry states **Decision**, **Reason**, **Trade-offs**, **Status**, and **Revisit trigger**. Statuses: `ACCEPTED`, `PROPOSED`, `SUPERSEDED`. Any changed decision should reference the successor rather than silently rewriting history.

### ADR-001 — Local-only initial product
- **Status:** ACCEPTED
- **Decision:** Run on the user's Windows computer; no cloud login, public deployment, or mandatory internet service for core editing.
- **Reason:** Single-user workflow, simpler development and local asset access.
- **Trade-offs:** Local backups and installation/runtime responsibilities remain with the user.
- **Revisit trigger:** Explicit request for distributed collaboration or cloud access.

### ADR-002 — Incremental delivery with real acceptance tests
- **Status:** ACCEPTED
- **Decision:** Implement one roadmap phase at a time; validate before progressing; record unfinished functionality honestly.
- **Reason:** The previous prototype accumulated disconnected controls and regressions.
- **Trade-offs:** Slower visible feature expansion, greater reliability.
- **Revisit trigger:** None without explicit approval.

### ADR-003 — Reusable model, character, and scene-instance separation
- **Status:** ACCEPTED
- **Decision:** A model asset, a reusable named character definition, and its scene instances have separate IDs and data.
- **Reason:** Multiple customized characters may share a base model without sharing mutable state.
- **Trade-offs:** More explicit reference and migration logic.
- **Revisit trigger:** Demonstrated incompatibility with supported assets.

### ADR-004 — Environments independent of scenes
- **Status:** ACCEPTED
- **Decision:** Scenes reference reusable environments and may provide scoped overrides; start with the real Podcast Studio, not fictional menu entries.
- **Reason:** Reuse and stable scene composition.
- **Trade-offs:** Environment/prop overrides require clear precedence rules.
- **Revisit trigger:** Dedicated environment composition phase.

### ADR-005 — Three levels of content creation
- **Status:** ACCEPTED
- **Decision:** Level 1: presets and supported customization. Level 2: imported assets and composition from props/lights. Level 3: advanced modeling and optional AI generation in a later phase.
- **Reason:** Avoid creating an entire Blender replacement in the MVP.
- **Trade-offs:** Some custom content requires external preparation.
- **Revisit trigger:** Completion of the import/composition phase.

### ADR-006 — Manual speaker assignment is fundamental
- **Status:** ACCEPTED
- **Decision:** Mixed or separate audio clips use explicit speaker IDs and editable timed intervals. No implicit speaker recognition from amplitude.
- **Reason:** Correct lip-sync ownership and audio-only speaker support.
- **Trade-offs:** Manual annotation work; future diarization is optional.
- **Revisit trigger:** Verified diarization integration, with user review preserved.

### ADR-007 — Layered behavior priority
- **Status:** ACCEPTED
- **Decision:** Manual direction > approved AI suggestions > automatic dialogue reactions > idle behavior, resolved per conflicting property/layer, with compatible behavior allowed concurrently.
- **Reason:** Predictable motion and manual control.
- **Trade-offs:** Requires capability and conflict metadata.
- **Revisit trigger:** Behavior-system evaluation tests reveal ambiguity.
- **Authoritative details:** `context/BEHAVIOR_SYSTEM.md`.

### ADR-008 — Shared deterministic frame evaluation
- **Status:** ACCEPTED
- **Decision:** Preview and offline export share frame/time evaluation logic; no dependence on previous frame updates for final pose.
- **Reason:** Reliable seeking, scene transitions, reproducible video.
- **Trade-offs:** Requires prepared deterministic audio-reactive features and animation math.
- **Revisit trigger:** Renderer proof-of-concept.

### ADR-009 — JSON project files plus managed asset folders (initial direction)
- **Status:** PROPOSED
- **Decision:** Prefer versioned JSON project data and locally managed asset files; evaluate SQLite only if needed for indexing/cross-project queries.
- **Reason:** Transparent single-user persistence and simple backups.
- **Trade-offs:** Need atomic writes, validation, asset indexing, and migrations.
- **Revisit trigger:** Persistence phase design/test results.

### ADR-010 — Frontend and 3D technology choices
- **Status:** PROPOSED
- **Decision:** Next.js/React/TypeScript, Tailwind CSS v4, Three.js/React Three Fiber/Drei, Zustand, Zod. Pin compatible versions when implementation starts.
- **Reason:** Component architecture, available 3D tooling, typed domain boundaries.
- **Trade-offs:** Browser/WebGL and local Node runtime complexity.
- **Revisit trigger:** Compatibility or performance testing.

### ADR-011 — Offline renderer technology
- **Status:** PROPOSED
- **Decision:** Evaluate Remotion with Three.js and FFmpeg for actual deterministic frame rendering and audio muxing. Do not assume suitability before an end-to-end proof.
- **Reason:** Frame-oriented React rendering and MP4 target.
- **Trade-offs:** GPU compatibility, encoding, licensing, resource consumption.
- **Revisit trigger:** Frame-rendering phase and license review.

### ADR-012 — Persian beginner-friendly editor
- **Status:** ACCEPTED
- **Decision:** Persian RTL UI, LTR timelines, separate functional panels, clear tooltips, real feedback, and intuitive play/pause/fullscreen behavior.
- **Reason:** Usable without animation or programming expertise.
- **Trade-offs:** Extra UI validation and accessibility work.
- **Revisit trigger:** User testing.

### ADR-013 — Model presets and identity
- **Status:** ACCEPTED
- **Decision:** First intended presets are Kamyar, cute ChatGPT robot, and distinct Claude character; future AI and fictional characters should be extensible, not hardcoded.
- **Reason:** First YouTube conversation use case and reuse across episodes.
- **Trade-offs:** High-quality rigging/animations require prepared assets.
- **Revisit trigger:** Character asset pipeline testing.

### ADR-014 — Phase 01 local foundation versions
- **Status:** ACCEPTED
- **Decision:** Use pinned Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3, Tailwind CSS 4.3.3, and ESLint 9.39.5 for the Phase 01 shell. Bind the development server to `127.0.0.1`; use system Persian-capable fonts until a suitable local font asset is available.
- **Reason:** The pinned packages installed and passed typecheck, lint, unit test, and production build on the target Windows environment. No font asset is present in the repository.
- **Trade-offs:** A bundled Persian font and browser-level verification remain pending; ESLint 9 is deprecated upstream but currently works with the installed Next.js config.
- **Revisit trigger:** A tested local font asset, a supported ESLint upgrade, or browser compatibility findings.

### ADR-015 — Phase 02 project storage and schema v1
- **Status:** ACCEPTED
- **Decision:** Store each project as a validated JSON file under `%LOCALAPPDATA%/SignalStudioAI/projects/<uuid>/` on Windows, with `SIGNAL_STUDIO_DATA_DIR` as an absolute-path override. Keep managed assets beside the JSON, copy the previous JSON into `backups/` before replacement, and move deleted projects to `trash/`. Use Zod 4.6.7 and a project revision for stale-write checks. No SQLite or browser-only persistence.
- **Reason:** Matches ADR-009 and the illustrative `ProjectDocument` while keeping user data outside source and build output. No existing v1 project data or earlier application schema was found to migrate.
- **Trade-offs:** The v1 schema permits empty scene/entity collections only; later phases must add versioned migrations before writing those entities. Revision serialization protects the single local server process; concurrent independent server processes sharing one root are not supported. Project import/export and binary asset import remain deferred under the narrower Phase 02 request; the asset folders, metadata schema, resolver, and safe duplication are ready.
- **Revisit trigger:** First real scene or asset-import workflow, cross-process storage access, or user-requested project transfer.

### ADR-016 — Phase 03-A viewport foundation
- **Status:** ACCEPTED
- **Decision:** Use pinned Three.js 0.187.0, React Three Fiber 9.8.2, Drei 10.7.9 and `@types/three` 0.187.0 with the existing React 19.3.1. Keep the Canvas in a client-only component, separate editor orbit controls from a validated serializable production camera configuration, and use demand rendering with bounded DPR. Render only a labeled temporary test mesh and reference ground in 03-A.
- **Reason:** Establish and test the rendering boundary before adding environment assets or scene persistence.
- **Trade-offs:** No real environment or production-camera preview yet; browser/GPU verification remains required.
- **Revisit trigger:** Phase 03-B asset integration or observed compatibility/performance issue.

### ADR-017 — Phase 03-B procedural Studio 01 and environment registry
- **Status:** ACCEPTED
- **Decision:** Register only the implemented Modern Podcast Studio — Studio 01 under a stable environment ID. Keep serializable prop definitions, default prop instances, camera suggestions and character placement anchors separate from the React Three Fiber renderer. Render each major prop through its own component. The initial arrangement is built-in code data; `copyDefaultProps` returns independent nested transforms for later scene overrides. Do not write environment references into project schema v1 in this phase.
- **Reason:** Deliver a complete visible studio without large external assets or premature project migration, while preserving independent prop identity for later editing.
- **Trade-offs:** Procedural materials have no imported texture detail; exact composition and performance need real browser/hardware validation. Built-in prop arrangements are currently changed by code; user editing and persistence belong to later authorized work.
- **Revisit trigger:** Phase 03-C object editing/persistence or validated GLB asset integration.

**Final 03-B camera review (2026-11-02):** Keep production-camera suggestions as serializable poses, with separate metadata for framing intent, supported aspect-ratio suggestion and stable character-placement anchor IDs. Add wide, two-seat, individual-seat and three-seat suggestions, including vertical variants. Seat references do not bind a pose to a character name or speaker identity. Future manual, fixed and optional speaker-following modes, timeline overrides, movement, cuts and export remain outside 03-B. Approximate geometric clearance is tested; visual suitability requires browser review.

### ADR-018 — Future scene props and educational display sequencing
- **Status:** SUPERSEDED in part by ADR-019 for basic project-level prop editing; scene-local work remains planned
- **Decision:** Place basic per-scene prop editing and Studio 01 quality refinement in Phase 05-B after scene persistence. Place local image/video/off display assignment and basic playback in Phase 06-B after managed assets and scene props. Resolve repeated display-state changes from project frames in Phase 07, cinematic camera direction independently in Phase 09, and synchronized offline output in Phase 11. Keep Phase 12 for imported assets and reusable environment composition.
- **Reason:** Scene-specific prop IDs, managed media assets and deterministic time are prerequisites for the tutorial workflow; independent camera and display tracks prevent a camera change from resetting video.
- **Trade-offs:** Adds two explicitly gated subphases before timeline work; media format/decode limits and integrated-GPU budget need measured implementation evidence.
- **Revisit trigger:** A validated asset/decoder prototype or scene schema migration reveals a dependency conflict.

### ADR-019 — Phase 03-C project-level editable studio arrangement
- **Status:** ACCEPTED for the explicitly authorized 03-C implementation; visual acceptance pending
- **Decision:** Keep Studio 01 as an immutable reusable template. Add schema v2 with one project-level arrangement and independent prop instances, because scene entities are not implemented. Migrate v1 in memory and back up the file before the first v2 write. Reuse the existing revision-checked local save path; commit gizmo transforms on release. Protect structural room props in the domain schema. Phase 05-B remains responsible for converting this arrangement into scene-local overrides after scene management exists.
- **Reason:** Enables genuine object editing and persistence now without fabricating scene independence or changing the accepted studio defaults.
- **Trade-offs:** Only one arrangement per project is editable in 03-C; real viewport interaction, integrated-GPU performance, and fullscreen/quality behavior need browser acceptance evidence.
- **Revisit trigger:** Phase 05 scene model and Phase 05-B scene-local arrangement migration.

### ADR-020 — Phase 03-D Studio 01 visual treatment
- **Status:** ACCEPTED after the user's 16/16 manual acceptance report (2026-11-02)
- **Decision:** Refine the existing Studio 01 prop renderers and local light rig while keeping prop IDs, default transforms, project schema, editor camera and production-camera metadata unchanged. Use lightweight rounded furniture edges, layered surface detail and a separate laptop display mesh. Avoid postprocessing, shadow maps and large texture assets.
- **Reason:** Improve wide and close-view readability without migrating saved arrangements or coupling the core viewport to one environment.
- **Trade-offs:** Added meshes and rounded edges increase draw calls; measured integrated-GPU performance and final visual quality require browser review. Phase 05-B now focuses on scene-local arrangements rather than repeating this visual upgrade.
- **Revisit trigger:** Browser acceptance reveals occlusion, aliasing or responsiveness problems on target hardware.

### ADR-021 — Phase 03-E laptop display data and rendering
- **Status:** ACCEPTED after user-confirmed 13/13 manual browser tests (2026-11-03)
- **Decision:** Keep media assignment per laptop prop instance and separate from the reusable laptop definition. Store asset IDs, state, fit and brightness in versioned project JSON; store image/video bytes in existing project-managed asset directories. Render textures on the named screen surface under the laptop transform. Keep inspection camera state editor-only and restore the prior editor pose on exit.
- **Reason:** A display must behave as part of the physical laptop while allowing media replacement without rebuilding the prop; off state must preserve its media configuration.
- **Trade-offs:** Schema v3 migration is required for older projects. Basic browser video playback does not provide deterministic arbitrary-time seeking; that remains Phase 07. Real hardware and browser verification remain acceptance gates.
- **Revisit trigger:** Browser tests expose texture alignment, decoder, readability, camera restoration or integrated-GPU issues.

## Pending decisions



- Confirm local runtime packaging/launch workflow (browser + localhost vs desktop wrapper) after a minimal proof.
- Choose exact project storage format and backups in persistence phase.
- Define canonical time units and scene transition overlap policy in `DATA_MODELS.md`/timeline phase.
- Verify model rig conventions, import validation, and presets through real assets.
- Verify render licensing, GPU/headless support, and final output reliability before adopting a renderer.

**Decision log only. This does not authorize implementation.**
