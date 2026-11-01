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

## Pending decisions


- Confirm local runtime packaging/launch workflow (browser + localhost vs desktop wrapper) after a minimal proof.
- Choose exact project storage format and backups in persistence phase.
- Define canonical time units and scene transition overlap policy in `DATA_MODELS.md`/timeline phase.
- Verify model rig conventions, import validation, and presets through real assets.
- Verify render licensing, GPU/headless support, and final output reliability before adopting a renderer.

**Decision log only. This does not authorize implementation.**
