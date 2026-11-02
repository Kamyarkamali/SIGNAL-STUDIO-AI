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

### ADR-022 — Phase 04-A project character data and replaceable renderer
- **Status:** IMPLEMENTED; Phase 04-A browser acceptance pending.
- **Decision:** Keep model definitions in a validated code registry, named identities separate from project instances, and placement/visibility in a serializable project-level state collection. Key renderer selection by stable model ID/renderer key; temporary generic geometry remains explicitly a development placeholder. Persist character data in schema v4 and migrate v1-v3 in memory, backing up original data on first successful save. Use local +Z as model forward and +Y yaw. Keep character R3F rendering in a separate layer from environment props.
- **Reason:** The app has no scene entities or production character assets yet. This enables independent reusable instances without pretending scene-local presence or final character designs already exist.
- **Trade-offs:** Project-level placement applies across the current project because scenes do not exist. Character identities are reusable within a project, not in a global cross-project catalog. Phase 05 must introduce scene-local overrides. Automatic gaze, animation, and speaker behavior are absent.
- **Revisit trigger:** Phase 05 defines scene identity/presence semantics; Phase 04-B replaces the temporary renderer with approved assets and verifies real model axes/capabilities.

### ADR-023 — Phase 04-B model-specific procedural renderers and appearance presets
- **Status:** IMPLEMENTED; manual visual acceptance pending.
- **Decision:** Keep the validated registry as the sole source of stable model IDs, renderer keys and supported customization fields. Implement separate lightweight procedural renderers for Kamyar, ChatGPT and Claude. Store validated appearance on each project-local character identity, and reuse that named identity for additional instances. Upgrade projects to schema v5; migrate the empty legacy development-human identity to Kamyar without changing identity, instance or placement IDs. Preserve any non-empty legacy customization on its old model ID so no customization is silently lost.
- **Reason:** No licensed, authored local production models were available. Distinct procedural silhouettes and functional per-identity appearance controls provide a testable vertical slice while leaving renderer replacement independent of saved identities and placements.
- **Trade-offs:** Procedural models are not artist-authored or film-ready and have no facial/body rig or animation capabilities. Presets are reusable within a project, not globally shared between projects. Manual browser review is required before acceptance.
- **Revisit trigger:** Phase 04-B visual acceptance or Phase 04-C rig/animation design.

### ADR-024 — Phase 04-B1 Claude cube renderer compatibility
- **Status:** IMPLEMENTED; browser visual acceptance pending.
- **Decision:** Keep Claude's existing model ID, renderer key, default scale, project schema and customization keys. Replace only the renderer geometry with the approved cube silhouette. Retain persisted `furColor`, `chestColor`, and `earStyle` keys for compatibility, while their current UI labels and renderer usage map to cube body color, headphone-pad color, and headphone-cup shape respectively.
- **Reason:** Existing character identities and saved appearance data must survive a visual correction without a project migration or changed instance placement.
- **Trade-offs:** Internal legacy customization key names no longer describe their visible usage; Persian labels remain accurate. Eye and mouth groups are separate scene nodes, but no facial animation controls or rig are claimed.
- **Revisit trigger:** A future versioned customization schema or an authored/rigged Claude asset replaces the procedural model.

### ADR-025 — Model-aware seated character placement
- **Status:** Superseded by ADR-026 for how a seat is selected; model/anchor alignment metadata remains in use.
- **Decision:** Seat surfaces and model-local contact points are metadata. Placement must be calculated only as part of an explicit seat selection, never by identity-specific defaults or during project loading.
- **Reason:** The models have different geometry bottoms, and the rendered seat is above the anchor origin. Users need control over seat choice and existing saved transforms must not shift on refresh.
- **Trade-offs:** Model authors must keep contact offsets synchronized with renderer geometry; visual clearance needs browser review.
- **Revisit trigger:** Imported model bounds, rigged seated poses, or scene-specific character state.

### ADR-026 — Explicit reusable seat assignments
- **Status:** IMPLEMENTED; browser interaction verification pending.
- **Decision:** Use the environment's stable character-anchor IDs as one-seat-per-instance assignments in the existing optional `placementAnchorId` state field. New instances are unassigned. A user explicitly chooses an available seat in the Persian character editor; assignment aligns the current transform once using anchor facing/surface and model-specific contact, position, and yaw offsets. Selecting the same seat again is a no-op. Unassigning removes only the seat ID and preserves the exact current transform. Unknown saved IDs are retained and shown as unavailable with a safe unassign action.
- **Reason:** This avoids model-to-role hardcoding, prevents duplicate occupancy, preserves transforms across reloads, and reuses the current project persistence contract without migration.
- **Trade-offs:** Seat assignments are project-level until scene-local character state exists. A manually moved character continues to reserve its assigned seat until explicitly unassigned.
- **Revisit trigger:** Scene management requires per-scene seating, or a model's supported sitting pose requires pose-aware alignment.

## Pending decisions

### ADR-027 — Surface-aware character placement and static ChatGPT expression presets

- **Status:** IMPLEMENTED; browser visual/interaction verification pending.
- **Decision:** Extend environment anchors with a kind, surface height, display label and optional scale limit; let each model declare supported placement kinds and model-local contact/offset metadata. Reuse the existing optional `placementAnchorId` and seat APIs as compatibility wrappers; no project schema migration or automatic relocation is introduced. Reject unsupported/oversized placements and conservative root-position overlaps. ChatGPT static expressions are discrete presets mapped onto independent eye/brow/mouth geometry; the existing `faceStyle` customization key and legacy values remain understood.
- **Reason:** Supports chairs, small AI characters on clear desk areas, a rug platform, and free manual transforms without assigning fixed seats to character identities or moving existing actors/furniture. Presets make real static mouth shapes possible while keeping the animation system out of scope.
- **Trade-offs:** Anchor clearance plus approximate model radii do not constitute triangle-level collision detection. Expression presets are instantaneous and do not provide transitions, blinking, tracking or lip sync. Visual suitability needs browser review.
- **Future-only plan:** Gaze target kinds, local eye/head/body adapters and manual per-layer priority, reusable local POV camera anchors independent of editor/production cameras, and deterministic facial animation layers are documented in `BEHAVIOR_SYSTEM.md`/`ARCHITECTURE.md`; they are not implemented or authorized by this ADR.



- Confirm local runtime packaging/launch workflow (browser + localhost vs desktop wrapper) after a minimal proof.
- Choose exact project storage format and backups in persistence phase.
- Define canonical time units and scene transition overlap policy in `DATA_MODELS.md`/timeline phase.
- Verify model rig conventions, import validation, and presets through real assets.
- Verify render licensing, GPU/headless support, and final output reliability before adopting a renderer.

**Decision log only. This does not authorize implementation.**

### ADR-028 — Persist Studio 01 decoration edits on existing prop instances

- **Status:** IMPLEMENTED; browser acceptance pending.
- **Decision:** Store optional, validated sign/frame customization on the existing stable prop instances; keep each frame independent and reference only image assets in that project's manifest. Keep schema v5 compatible by making the field optional. Persist visual edits through the normal arrangement save path and keep viewport selection/edit mode transient.
- **Reason:** Customization belongs to the existing Studio 01 sign and frames, while local assets must copy, validate and reopen using established project behavior. Optional data preserves old projects and stable prop IDs.
- **Trade-offs:** One existing wall-art prop contains both independently editable frame submodels. Browser review is still needed for exact local transform feel, image fitting and rendered illumination.
- **Revisit trigger:** Introduce per-frame stable prop IDs only if frame-specific operations beyond appearance/visibility/transform are required.

### ADR-029 — Kamyar returns to the stylized procedural character system

- **Status:** SUPERSEDED by ADR-034.
- **Decision:** The photo-to-GLB workflow is no longer the required path for character creation. Continue the existing stylized Three.js renderer and improve it using Kamyar's original photographs for supported identity cues and approved group imagery for style only. Keep GLB loading/import as an optional future capability.
- **Reason:** The user chose procedural character development rather than producing human characters through the photo-to-GLB workflow.
- **Trade-offs:** Procedural refinement cannot establish visual likeness by automated tests; manual viewport acceptance remains necessary. Hamid must have separate model configuration and cannot be Kamyar renamed or recolored.

### ADR-030 — Keep focused Kamyar grooming presets on the existing renderer

- **Status:** Implemented; visual acceptance pending.
- **Decision:** Continue the current model-specific hair/beard geometry variants and capability-backed appearance controls. Hair uses a fitted under-layer and style-specific raised clumps; facial hair uses fitted jaw/cheek surfaces and restrained surface strokes, with the lip area clear. Preserve legacy preset IDs through normalization and keep customization on each character identity. Manual review remains required for final visual acceptance.
- **Reason:** The user specifically requested richer grooming customization without rebuilding the human model; the existing surface geometry can express the supported variants while retaining project compatibility.
- **Trade-offs:** Generated meshes remain stylized procedural geometry and require in-browser review for hairline, intersections and visible differentiation. No photorealism or unverified likeness claim is made.

### ADR-031 — Use a bounded responsive grid for the editor workspace

- **Status:** SUPERSEDED by ADR-032 after user rejection of the first layout.
- **Decision:** Keep the desktop shell viewport-height bounded, with persistent navigation, a center preview, a collapsible contextual inspector and a bottom timeline. Let long inspector/navigation/timeline content scroll within its own region. On mobile, stack these regions and allow controlled document scrolling. Keep the 3D preview aspect-ratio constrained and keep inspector visibility as temporary UI state.
- **Reason:** Removes repeated page scrolling while preserving current section, properties, project persistence, and viewport interaction wiring across screen sizes.
- **Trade-offs:** Draggable resizing is deferred pending browser verification; responsive CSS widths and a collapsible inspector provide usable sizing without introducing resize state or canvas instability.

### ADR-032 — Separate section work and selected properties in the bounded editor

- **Status:** Implemented; browser acceptance pending.
- **Decision:** Keep the viewport-height desktop shell and persistent right navigation, but show the active section and selected-item properties in separate tabs in the left panel. Selection opens properties; navigation opens the section tab. Keep mounted tab content and temporary panel state. Use a dismissible panel drawer on mobile.
- **Reason:** The prior narrow combined scroll column obscured frequent tasks and made the viewport feel cramped. This restores clear hierarchy without changing project data or editor commands.
- **Trade-offs:** Tab switching adds one explicit step to move between a library and its selected properties. Drag resizing remains deferred. Browser review is required before acceptance.

### ADR-033 — Add a code-defined GLB adapter with procedural fallback

- **Status:** Implemented; authored-asset and browser verification pending.
- **Decision:** Let a model definition optionally reference a bundled local GLB with required named appearance bindings and optional expected height. Keep the stable model ID and procedural renderer key as fallback. Inspect actual geometry and rig data at load time, clone skeletons/materials per instance, and keep rig capability declarations independent of detected parts.
- **Reason:** Provides an optional replacement path for user-selected/authored assets without changing persisted identity/instance references, while keeping procedural renderers usable.
- **Trade-offs:** No production GLB is bundled, so the loader cannot establish visual likeness or studio fit yet. GLB source geometry/textures are shared for efficiency; per-instance materials are private.

### ADR-034 — Store imported character models in the project asset manifest

- **Status:** Implemented; browser acceptance pending.
- **Decision:** Store each user-imported GLB under the active project's managed `character-models` folder and keep its validated model definition as an optional field on that asset's existing manifest record. Use the asset UUID as the stable definition suffix and a project-scoped serving route. Build the active character registry from built-in definitions plus the active project's imported definitions. Duplicate projects copy the asset bytes and rewrite the scoped URL; removal checks all identity references before deleting the file.
- **Reason:** This reuses the established local storage, checksum, backup, revision, and project-duplication lifecycle while keeping model assets separate from identities and instances. The optional asset-manifest field keeps schema v5 projects readable without a migration.
- **Trade-offs:** Imported character models are project-local and appear only in the active project's library. The editor uses one active project; registry replacement must occur when projects switch. Rig, clip and morph inspection remains diagnostic, not a promise of runtime animation. Preview adds a temporary low-DPR WebGL context only while the import dialog is open.
- **Revisit trigger:** A future global asset catalog or scene-local character model lifecycle is explicitly authorized.

### ADR-035 — Return human character creation to stylized procedural models

- **Status:** Implemented as direction; Kamyar visual acceptance pending.
- **Decision:** Stop using the photo-to-GLB workflow as the required character-creation path. Continue the existing Three.js/React Three Fiber procedural character system for Kamyar, and prepare Hamid as a separate future human model configuration. Preserve the already-built GLB adapter and importer as optional capabilities.
- **Reason:** The user selected procedural stylization, using original photographs for human identity cues and generated group art for visual style, without attempting photorealistic reconstruction.
- **Trade-offs:** Geometry tests cannot confirm likeness or aesthetic quality; front/side/three-quarter browser review remains a manual gate. Do not claim Hamid exists until a separate model definition and renderer are implemented.

### ADR-036 — Add Hamid as an independent procedural character prototype
- **Status:** Implemented; manual visual acceptance pending.
- **Decision:** Register Hamid under stable model ID `character-model:hamid` and renderer key `hamid-stylized`. Use independent head geometry and a continuous configurable torso/T-shirt surface; reuse only compatible immutable grooming geometry from the existing human renderer. Keep customization on each identity and placement in the existing instance state.
- **Reason:** Provide a genuinely distinct fourth reusable model while preserving the procedural direction, schema v5 persistence and existing character library.
- **Trade-offs:** The model is a lightweight stylized prototype; procedural geometry and metadata cannot establish likeness, visual quality, seated clearance or animation capability. It declares no animation capabilities and requires browser review before acceptance.
- **Revisit trigger:** Manual visual acceptance or a suitable user-selected authored replacement asset.

### ADR-037 — Store Studio 01 lighting in the existing project arrangement
- **Status:** Implemented; browser visual review pending.
- **Decision:** Keep bounded key/fill/accent intensity, warm/neutral/cool temperature, and practical-light enablement inside the existing `environmentArrangement` with a default for legacy data. Keep room wall/ceiling visibility in transient editor state. Do not change stable furniture IDs/transforms or project schema v5.
- **Reason:** Lighting belongs to the project’s current Studio 01 composition and can reuse the existing validated autosave/duplicate lifecycle. The wall toggle exists only to let the editor inspect camera angles without changing production content.
- **Trade-offs:** Project-level settings apply to the current whole project until scene-local environment overrides exist. Geometry/persistence tests cannot verify visible illumination, room joints, laptop alignment, or target-GPU responsiveness.
- **Revisit trigger:** Scene-system work adds validated scene-specific environment and lighting overrides.

### ADR-038 — Separate MVP handoff from functional and production acceptance

- **Status:** Approved 2026-11-02.
- **Decision:** An explicit user-approved MVP/prototype handoff may authorize the next explicitly scoped development milestone while noncritical browser, visual, or GPU checks remain open. Keep each such check as verification debt; preserve reported PASS/FAIL evidence and never mark unverified items as passed. Full functional and production-quality acceptance still requires the phase's mandatory behavior, persistence, visual, browser/device and performance checks.
- **Safety gate:** Stop progression for a confirmed critical functional or data-integrity blocker, including data loss/corruption, broken persistence, security exposure, or incompatible schema/data migration. A `FIXED_UNVERIFIED` issue remains visible and blocks only when evidence shows it is still broken or it critically blocks the next milestone. MVP acceptance does not authorize unrelated phases.
- **Application:** The user approved the four Phase 04-B character models for MVP/prototype development and explicitly authorized Phase 04-C1. The 8 PASS / 2 FAIL manual report and all unchecked B1–B4 browser checks remain unchanged; Phase 04-B is not production-accepted.
- **Reason:** Permit iterative MVP development without confusing limited prototype approval with verified behavior or final product quality.

### ADR-039 — Keep character preview deterministic and transient

- **Status:** Implemented 2026-11-02; browser acceptance pending.
- **Decision:** Evaluate preview poses through a pure function of action ID, explicit source time, duration, optional transient return pose and declared model channels. Keep playback records keyed by character instance in editor state only. Apply outputs to named model-local pivots; leave persisted root transforms and project schema unchanged. Drive demand rendering with a temporary RAF invalidation loop and cancel it on completion or teardown.
- **Capability rule:** Procedural model metadata advertises head/arm channels only after those pivots are wired. GLB skeleton, morph and clip inspection remains diagnostic until a deterministic runtime adapter can evaluate the actual channel. Do not claim facial/body rig readiness from named attachment points alone.
- **Reason:** The same stateless evaluator can support preview seeking and future fixed-frame rendering without accumulating `useFrame` deltas or serializing Three.js state.
- **Trade-offs:** Preview currently supports only bounded head turn/nod and arm gesture channels present in the procedural prototypes; Claude has no arm gesture. GLB clip playback, facial animation, gaze, scheduled behavior and manual browser review remain future/pending work.

### ADR-040 — Separate laptop display viewing from the 3D editor camera

- **Status:** Implemented; browser acceptance pending.
- **Decision:** Frame laptop close-up from the current prop transform and restore the editor camera's position, orientation, up vector and orbit target while leaving its FOV unchanged. Open the assigned project-local image/video in a separate temporary dialog that may use browser fullscreen; never replace or mutate the 3D laptop or its saved display assignment. Show prop bounds only while object edit mode is active.
- **Reason:** Provides a readable media-viewing path while preserving the studio scene, saved project data and editor/production camera separation, and keeps selection from looking like an accidental debug overlay.
- **Trade-offs:** Fullscreen support depends on browser permission; a normal modal remains usable when fullscreen is unavailable. Browser visual and interaction review is still required.

### ADR-041 — Keep character gaze transient, capability-based and scene-resolved

- **Status:** Implemented 2026-11-02; browser acceptance pending.
- **Decision:** Keep manual gaze previews in editor-only state keyed by character instance ID. Resolve stable target references against current Three.js world transforms at evaluation time, so moved/rotated/scaled objects are followed without storing engine objects or project-local resolved positions. Evaluate poses at explicit source timestamps and apply only to model-local gaze pivots; never mutate saved character world transforms or editor/production camera state.
- **Capability rule:** Require declared channels and actual named pivots. Current procedural characters expose head rotation; ChatGPT additionally exposes iris offset. No current model claims torso rotation, and GLB gaze remains disabled until a validated rig adapter exists. Unreachable/missing/hidden targets safely clamp or return neutral.
- **Reason:** Preserve deterministic seeking, independent characters and project compatibility while keeping controls honest about available rigs.
- **Trade-offs:** The editor preview uses monotonic wall-clock timestamps to request invalidation, but the pure pose evaluator receives elapsed source time; gaze is not yet a persisted timeline event. Browser and visual acceptance remain open. C2's separately reported facial-expression failures remain open.

### ADR-042 — Prefer device-framed laptop presentation and temporary helper suppression

- **Status:** Implemented; browser acceptance pending.
- **Decision:** Use the existing 3D laptop and attached display surface for the primary enlarged presentation. Hide editor gizmos and bounds through a temporary visibility gate; retain a manual helper toggle and keep selection, transforms, project data and production camera state unchanged. Keep the content-only fullscreen dialog as a distinct secondary viewer.
- **Reason:** Presentation should feel like looking at the laptop in the studio, with a distraction-free media-only option still available.
- **Trade-offs:** Browser fullscreen permission and actual visual framing, occlusion, responsiveness and readability require manual browser review.

### ADR-043 — Separate laptop device, screen-focus and content-only viewing modes

- **Status:** Implemented 2026-11-03; browser acceptance pending.
- **Decision:** Provide three clearly labeled transient viewing modes. Device and screen-focus modes frame media inside a bezel at the laptop display's native aspect ratio; device mode adds a restrained keyboard/base representation. Content-only remains an explicit option. Fullscreen is user-triggered, and exiting fullscreen leaves the viewer open in its selected mode.
- **Reason:** Educational media should read as content shown on a laptop display, with uncluttered screen viewing available without conflating it with content-only presentation.
- **Trade-offs:** The dialog uses a lightweight HTML device frame rather than creating a second WebGL context; actual appearance, proportions and responsive readability need browser review. Existing in-scene device presentation remains available.

### ADR-044 — Accept Phase 04-C3 for MVP and hand off Phase 05

- **Status:** User-approved 2026-11-02.
- **Decision:** Record Phase 04-C3 as accepted for MVP/prototype development based on the user's confirmation that all 8/8 manual browser tests PASS. Accept the handoff to Phase 05 — Scenes, Storyboard and Scene-Time Model — for development; Phase 05 remains unstarted until work begins.
- **Reason:** Record the explicit milestone decision while keeping prototype acceptance distinct from production-quality acceptance.
- **Trade-offs:** Test names and individual outcomes were not supplied. Phase 04-C3 production verification remains open. The three Phase 04-C2 visual defects remain open and C2 is not accepted.

### ADR-045 — Separate display-image unassignment from confirmed asset deletion

- **Status:** Implemented; browser acceptance pending.
- **Decision:** Treat clearing an image from the laptop as an assignment edit, separate from permanent removal of an imported image asset. Before deleting, recheck every project-data reference under the project lock and block while any laptop, sign, frame or future project/scene reference remains. Require explicit confirmation before deleting an unreferenced asset.
- **Reason:** Prevent accidental loss of media still used in the studio and avoid stale project references while still supporting media-library cleanup.
- **Trade-offs:** Users must remove references in their owning editors before retrying deletion. The dependency checker is deliberately conservative and scans serialized project data beyond current known reference locations. No project schema change is required.

### ADR-046 — Gate facial expression previews on actual renderer controls

- **Status:** Implemented; manual visual verification pending.
- **Decision:** Drive ChatGPT expression presets through its existing face display and add Claude expression support only through actual eye, eyebrow and mouth geometry. Keep Kamyar, Hamid and imported GLB facial previews disabled until their renderers have verified adapters. Use action-specific timing for surprise/excitement without changing other action speeds or the accepted gaze evaluator.
- **Reason:** A generic `facial-expression` capability must correspond to visible, controllable renderer components; model labels or mathematical pose differences alone are insufficient evidence.
- **Trade-offs:** Visual quality and readability at podcast distance require a real browser review. No project schema, identity, customization, saved transform or C3 gaze contract changes.
