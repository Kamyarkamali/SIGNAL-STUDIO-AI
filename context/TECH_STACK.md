# Signal Studio AI — Technology Stack

**Document:** `context/TECH_STACK.md`

**Project:** Signal Studio AI

**Application Type:** Local-first 3D Animation Production Studio

**Target Platform:** Windows Desktop

**Primary UI Language:** Persian (fa-IR)

**Status:** Proposed Technical Architecture — Pending Final Approval

**Development Approach:** Incremental, Modular, Test-Driven Validation

---

## 1. Technical Vision

**Phase 01 implementation (2026-11-01):** The existing App Router shell uses Next.js 16.4.3, React 19.3.1, Tailwind CSS 4.3.3, and `@tailwindcss/postcss` 4.3.3. Tailwind is configured through `@import "tailwindcss"` and CSS-first `@theme inline` in `src/app/globals.css`; no legacy `tailwind.config` is required. Yekan Bakh FaNum is loaded from the existing `src/public/fonts/woff2/` files through `next/font/local` in `src/lib/fonts.ts`, with regular (400), semibold (600), bold (700), and extrabold (800) used by the shell. The files also include static thin (100), light (300), black (900), and extra black (950) weights, plus WOFF counterparts; no italic or variable file was found. The four used WOFF2 files are preloaded with `display: "swap"` and system fallbacks.

Signal Studio AI is a locally running, scene-based 3D animation editor.

The application must support:

- Reusable and customizable 3D characters.

- Dynamic character placement and visibility.

- Multiple 3D environments.

- Scene-based animation editing.

- Audio uploads and manual speaker assignment.

- Facial expressions, gestures, and character interactions.

- Camera and timeline editing.

- AI-assisted directing in future phases.

- Deterministic frame-by-frame video rendering.

- Local project and asset persistence.

The architecture must separate the editor, project data, 3D rendering, animation evaluation, audio processing, and offline video export.

**Core principle:** Every major subsystem must be independently maintainable, testable, and reusable.

## 2. Application Framework

### Next.js App Router

**Purpose:** Main application framework.

Responsibilities:

- Application routing.

- Editor pages.

- Local API endpoints when necessary.

- Integration with the local Node.js runtime.

- Loading the client-side 3D editor.

The application runs locally on the user's computer.

Do not deploy or expose the development server publicly.

### React

**Purpose:** Component-based interface development.

Responsibilities:

- Editor panels.

- Character management.

- Scene management.

- Timeline interface.

- Dialogues and audio controls.

- Settings and project management.

React must not perform heavy animation calculations through frequent component rerenders.

### TypeScript

**Configuration:** Strict mode.

Requirements:

- Strongly typed application data.

- No unnecessary use of `any`.

- Explicit interfaces for characters, scenes, assets, and timeline events.

- Serializable project structures.

- Runtime validation at data boundaries.

## 3. UI and Styling

### Tailwind CSS v4

**Purpose:** Application styling.

Requirements:

- Fully Persian user interface.

- Right-to-left application layout.

- Left-to-right timeline time axis.

- Responsive editor panels.

- Consistent spacing and typography.

- Dark-theme-first design.

- Accessible interactive controls.

Use local Persian fonts where possible, preferably Vazirmatn.

Avoid unnecessary UI frameworks and duplicated styling solutions.

### UI Components

Prefer lightweight, accessible, reusable React components.

Use established headless primitives only where they provide meaningful benefits.

Do not introduce a large UI component library without evaluating bundle size, RTL support, and accessibility.

## 4. 3D Rendering Engine

**Phase 03-A installation (2026-11-01):** `three` 0.187.0, `@react-three/fiber` 9.8.2, `@react-three/drei` 10.7.9, and development declarations `@types/three` 0.187.0 are pinned. Their npm peer requirements accept the existing React 19.3.1 and Three.js 0.187.0. The canvas uses demand rendering, DPR 1–1.5, no shadows or postprocessing, and a low-power WebGL preference. Browser/GPU behavior is pending real viewport verification.

### Three.js

**Purpose:** Core 3D rendering technology.

Responsibilities:

- 3D geometries and materials.

- Lighting and shadows.

- Cameras.

- Character positioning.

- Environment rendering.

- Mesh transformations.

- 3D asset loading.

### React Three Fiber

**Purpose:** Declarative integration between React and Three.js.

Responsibilities:

- Rendering scene components.

- Character components.

- Environment components.

- Camera rigs.

- Scene object lifecycle management.

### Drei

**Purpose:** Reusable Three.js helpers.

Potential uses:

- Camera controls.

- Transform controls.

- Model loading helpers.

- Scene utilities.

- Performance-related helpers.

The 3D engine must remain independent from editor-specific UI components.

## 5. 3D Asset Format

### Primary Format: GLB / glTF 2.0

Use GLB as the preferred portable asset format for:

- Character models.

- Environment models.

- Props and accessories.

- Rigged characters.

- Compatible animations.

Assets should include appropriate metadata describing their capabilities.

For example:

- Does the character have a skeleton?

- Does it support facial morph targets?

- Can it blink?

- Can its mouth open?

- Does it support hand gestures?

- Which animations are available?

Do not assume every imported GLB model supports facial animation or lip synchronization.

### Blender

Blender is the preferred external tool for:

- Creating character models.

- Editing facial geometry.

- Rigging characters.

- Preparing facial expressions.

- Producing compatible animation clips.

- Creating and optimizing environments.

- Exporting GLB assets.

Signal Studio AI is not intended to replace professional 3D modeling software during its initial development stages.

The application will focus on importing, configuring, animating, and directing prepared models.

## 6. Character System

The character system must support three independent entities:

**Character Model Definition**

Represents a reusable 3D model and its supported capabilities.

**Character Definition**

Represents an individual named character with appearance settings and model references.

**Scene Character Instance**

Represents a character's presence and configuration within a specific scene.

Each character instance must support:

- Position.

- Rotation.

- Scale.

- Visibility.

- Optional scene-specific appearance overrides.

- Gaze targets.

- Animation assignments.

Initial character presets:

- Kamyar.

- ChatGPT mascot.

- Claude.

Future presets may include Gemini, Copilot, fictional characters, and custom characters.

Each character must support independent customization within the capabilities of its selected model.

Adding or removing a character must not modify unrelated characters or break the scene composition.

## 7. Environment System

Implement a reusable environment registry.

An environment definition must remain independent from the scene referencing it.

Initial environment:

- Podcast Studio.

Future environments may be added through supported assets and environment configurations.

A scene must be able to reference a registered environment while maintaining independent:

- Character placement.

- Camera settings.

- Lighting overrides.

- Props where supported.

- Animation events.

Do not generate unnecessary placeholder environments.

Do not expose environment selection options for assets that are not actually available.

## 8. State Management

### Zustand

**Purpose:** Shared editor state.

Suitable responsibilities:

- Selected project.

- Selected scene.

- Selected character.

- Active editor tool.

- Selected timeline events.

- Playback UI status.

- Panel and workspace state.

Avoid storing complex Three.js objects in Zustand.

Keep high-frequency animation calculations outside React state updates whenever possible.

Separate persistent project data from temporary editor interaction state.

## 9. Project Data Validation

### Zod

**Purpose:** Runtime validation and schema management.

Use Zod for:

- Project imports.

- Character definitions.

- Scene data.

- Timeline events.

- Configuration files.

- Render settings.

- External AI suggestions.

Persisted project data must use schema versioning.

Future changes to the data model must use explicit migrations.

Never silently discard unsupported or invalid project data.

## 10. Local Storage Architecture

Signal Studio AI is a personal desktop-oriented application.

It must operate locally without requiring cloud services, login, or online accounts.

### Node.js Local Runtime

Use the local Node.js process for:

- Controlled filesystem access.

- Project file operations.

- Local asset management.

- Import/export operations.

- Launching authorized local render jobs in a later phase.

### SQLite

**Proposed use:** Structured local application metadata.

Potential data:

- Project registry.

- Character library metadata.

- Asset references.

- Recent projects.

- Application preferences.

Store large audio, video, and GLB binaries as files rather than database blobs by default.

### Local Project Files

Use a project workspace structure containing:

- Versioned project metadata.

- Character and scene configuration.

- Referenced audio assets.

- Imported model assets.

- Thumbnails.

- Render output files.

Use stable identifiers and project-relative asset references.

Prevent arbitrary filesystem access through application endpoints.

Implement appropriate validation, path restrictions, and safe file handling.

### Storage Decision

For the initial single-user release, prefer versioned JSON project files plus locally managed asset folders, pending proof of reliable atomic writes, migrations, and backup/restore. Introduce SQLite only if a demonstrated need arises for scalable metadata queries or cross-project indexing. Keep a single authoritative persistence source.

Do not implement both persistence approaches unnecessarily.

Browser localStorage must not be the primary storage mechanism for large media assets.

## 11. Audio Processing

### Web Audio API

Use the Web Audio API for browser-based audio processing.

Responsibilities:

- Audio playback analysis.

- Volume measurement.

- Waveform generation.

- Basic audio-reactive animation parameters.

Use browser media playback APIs where appropriate.

### Supported Initial Formats

- WAV.

- MP3.

Additional formats can be supported after validation.

### Speaker Timeline

Implement a custom speaker-assignment timeline.

Users must be able to:

- Upload separate character recordings.

- Upload mixed multi-speaker conversations.

- Create speaker intervals.

- Assign intervals to character IDs.

- Split and merge intervals.

- Edit speaker timing.

- Mark silence or unknown speakers.

- Preview selected regions.

Speaker identity must come from explicit timeline assignments unless a real diarization system is implemented.

Audio amplitude must not be used as a substitute for speaker identification.

## 12. Animation Engine

Implement a reusable, capability-aware animation system.

Supported animation categories should eventually include:

- Facial expressions.

- Mouth movement.

- Eye movement and blinking.

- Head movement.

- Gaze direction.

- Body posture.

- Hand gestures.

- Character visibility.

Character animation adapters must translate normalized animation parameters into model-specific bone transforms, morph targets, or procedural mesh changes.

Do not assume all character models share the same rig.

### Deterministic Animation Requirement

Animation state must be evaluable from:

- Project data.

- Scene data.

- Frame number or exact timeline time.

- Animation parameters.

- Validated assets.

Avoid relying on the history of previously rendered frames.

Do not base export animations on uncontrolled randomness or wall-clock time.

Preview and export must share the same animation evaluation logic.

## 13. Timeline Engine

Use a custom TypeScript timeline engine.

Reasons:

- Explicit control over scene timing.

- Precise speaker assignment.

- Animation event layers.

- Character visibility events.

- Camera tracks.

- Deterministic frame evaluation.

- Integration with offline rendering.

The timeline must support:

- Multiple tracks.

- Playback.

- Pause and restart.

- Seeking.

- Scene-local and project-global time.

- Timeline event selection.

- Event creation and editing.

- Dragging and resizing.

- Track priority and override rules.

Use a maintained drag-and-drop library such as dnd-kit when necessary for complex timeline or storyboard interactions.

Do not build a fragile custom drag-and-drop system without justification.

## 14. Camera System

Use Three.js cameras with reusable camera configuration data.

Required future capabilities:

- Wide shot.

- Close-up shot.

- Two-character shot.

- Character-focused shot.

- Manual camera positioning.

- Camera timeline events.

- Smooth interpolation.

- Camera cuts.

- Scene transitions.

Camera configurations must be serializable.

Editor camera controls and cinematic output cameras must remain distinguishable.

## 15. Frame-by-Frame Video Rendering

### Proposed Technology: Remotion

Evaluate Remotion and `@remotion/three` for the final rendering pipeline.

The renderer must:

- Render at exact frame positions.

- Support arbitrary-frame evaluation.

- Combine scene sequences.

- Render 3D characters and environments.

- Synchronize original audio.

- Support configurable FPS and resolution.

The final video must not depend on recording real-time browser playback through MediaRecorder.

Use a separate rendering entry point that consumes validated project data.

### FFmpeg

Use an approved local FFmpeg integration where appropriate for:

- Audio processing.

- Audio/video muxing.

- Encoding.

- Format conversion.

- Output validation.

Do not introduce a second full rendering engine unnecessarily.

### Export Targets

Initial target:

- MP4 / H.264.

- 1280×720.

- 30 FPS.

Later targets:

- 1920×1080.

- 24 and 30 FPS.

- Additional output formats where supported.

The rendering architecture must support cancellation, error reporting, and actual progress tracking.

Do not claim export support until a playable video with synchronized audio has been generated and tested.

### Licensing

Verify Remotion's license terms and suitability for the intended use before integrating the rendering package.

Do not assume all packages have identical open-source licensing terms.

## 16. AI Director — Future Phase

AI integration is not required during the initial application setup.

Design a provider-independent interface for future AI-assisted directing.

Possible responsibilities:

- Script interpretation.

- Emotion suggestions.

- Gesture suggestions.

- Camera direction suggestions.

- Scene planning.

- Speaker timing suggestions.

All AI outputs must be structured, validated, and editable.

AI must only suggest supported character actions.

Manual decisions always take precedence.

The core application must remain usable without an internet connection or an AI subscription.

## 17. Testing Stack

### Vitest

Use for:

- Project schema validation.

- Scene timing calculations.

- Speaker interval evaluation.

- Character visibility logic.

- Timeline evaluation.

- Animation priority rules.

- Deterministic frame calculations.

### React Testing Library

Use when component-level interaction tests provide clear value.

### Playwright

Use for real browser-based editor tests:

- Scene switching.

- Character creation.

- Character visibility.

- Audio upload/removal.

- Play/Pause behavior.

- Timeline editing.

- Settings persistence.

- Fullscreen interaction.

Where appropriate, use visual regression tests to detect unintended changes in the 3D scene.

TypeScript, ESLint, and successful builds are required but do not replace functional browser verification.

## 18. Performance Requirements

Target development hardware:

- AMD Ryzen 5 4500U.

- 16 GB RAM.

- Integrated AMD Radeon Graphics.

- Windows.

Requirements:

- Efficient 3D geometry and materials.

- Limited real-time shadows.

- Controlled device pixel ratio.

- Appropriate asset loading and caching.

- Minimal unnecessary React rerenders.

- Proper disposal of GPU resources.

- Proper audio lifecycle management.

- Avoidance of large dependencies without clear benefit.

- Adjustable preview quality.

- Conservative render concurrency.

Do not claim a specific FPS target has been achieved without actual measurement.

## 19. Development Tooling

Use:

- Node.js LTS.

- npm.

- Git.

- ESLint.

- TypeScript.

- VS Code or equivalent IDE.

- Codex as an implementation assistant.

Pin exact compatible dependency versions when the implementation phase begins.

Commit the lockfile.

Avoid automatic major-version upgrades without validation.

## 20. Technologies Not Required Initially

Do not introduce these technologies without an approved need:

- Cloud database services.

- Cloud authentication.

- Microservices.

- Docker.

- Kubernetes.

- Redis.

- WebSockets.

- Paid AI APIs.

- Cloud rendering infrastructure.

- Complex real-time collaboration systems.

- Multiple competing state management libraries.

The initial product is a personal, single-user local application.

## 21. Incremental Dependency Installation

Install dependencies only when required by the current development phase.

Suggested order:

**Foundation**

Next.js, React, TypeScript, Tailwind CSS, ESLint.

**3D Scene**

Three.js, React Three Fiber, Drei.

**Editor State and Validation**

Zustand, Zod.

**Persistence**

Chosen local file and metadata storage implementation.

**Character and Environment Assets**

GLB loading and validated asset management.

**Timeline and Audio**

Web Audio integration, timeline components, drag-and-drop tooling when needed.

**Testing**

Vitest, Playwright, and selected component-testing utilities.

**Offline Rendering**

Remotion and related rendering tools only after deterministic animation evaluation is operational.

Avoid installing the full future technology stack during initial setup.

## 22. Non-Negotiable Engineering Principles

1. Do not tightly couple the 3D engine to the editor UI.

2. Do not hardcode characters or environments into individual episodes.

3. Do not use character display names as persistent IDs.

4. Do not store non-serializable Three.js objects in project files.

5. Do not confuse uploaded audio with speaker assignments.

6. Do not let changing one character modify another character.

7. Do not implement decorative or nonfunctional controls.

8. Do not start offline rendering before deterministic animation logic is ready.

9. Do not introduce unnecessary architectural complexity.

10. Do not proceed to the next development phase before verification.

## 23. Local Runtime and Packaging Decision

**Initial distribution:** A local Next.js web application accessed at `http://localhost` through a browser, backed by a local Node.js process. This is not initially a native Windows `.exe` installer. Desktop packaging (such as Tauri or Electron) is a separate future decision, not a day-one dependency.

- Bind the local application server to `127.0.0.1` by default and validate any API endpoints that access files or start processes.
- Store user projects outside the application source directory in a configurable, user-writable workspace to avoid loss during upgrades.
- Treat `.next/`, source files and `public/` as application resources, not permanent storage for imported user media.
- Support reliable startup and shutdown; never assume a development server must be running for a future packaged release.
- Document backup/export of complete projects including dependent assets.

## 24. Character Creation and Environment Composition Scope

The first releases support **reusable prepared models and capability-aware customization**, not unrestricted 3D mesh sculpting or automatic rigging.

Character creation must distinguish: (a) a 3D model preset, (b) a named customized character definition, and (c) a scene-local instance. Initial presets: Kamyar, ChatGPT mascot, and Claude; other AI-themed characters are future presets, not a hardcoded engine limitation.

Environment creation is progressive:

1. Initially use the actual podcast studio; avoid fake environment choices.
2. Later allow constructing a new environment by arranging registered props, lights, transforms, and compatible imported models, then save the composition as a reusable environment definition.
3. Advanced procedural modeling and AI-generated geometry are future research features, not part of the first MVP.

Each 3D asset must provide metadata on its coordinate convention, units, forward axis, scale, attachment points, and animation/appearance capability. Define a common scene convention before asset production (for example Y-up, metric units) and convert imported asset conventions explicitly. Do not guess a character model's forward direction for gaze behavior.

## 25. Scene Presence, Voice Assignment and Timeline Independence

- Adding a reusable character to the library does not automatically instantiate it in a scene. The editor must provide a distinct **Add to Scene** action and visible feedback.
- Each scene instance owns its own transform, visibility and optional appearance override; shared geometry must not mean shared mutable transforms/materials.
- A scene can have a different cast and environment while preserving project-level character definitions.
- Presence/visibility events determine whether a character is shown; they must not change who the recorded voice belongs to.
- Audio assets, placed audio clips, speaker intervals, dialogue text, and visible character instances are separate entities.
- The audio editor must support both separate voice files and a mixed recording containing multiple people; users manually assign arbitrary time intervals to character IDs or audio-only speaker IDs.
- Unassigned intervals must remain unassigned; never default all uploaded speech to Kamyar or claim that amplitude analysis identifies the speaker.

## 26. Behavior Layers and Priority Contract

Behavior priority rules are specified authoritatively in `context/BEHAVIOR_SYSTEM.md`. The technology stack must enable that system without duplicating its full implementation specification.

- Use layered channels for mouth, eyes, head/gaze, face, hands, body, instance transforms, visibility, camera and environment effects.
- Apply default priority: manual direction > user-approved AI events > automatic dialogue reactions > idle behavior.
- Resolve conflicts **per controlled property/layer**, not globally: speaking and looking at another character must be able to happen simultaneously.
- Behaviors must declare supported model capabilities, timeline times, priority, duration and blending rules.
- Evaluate behaviors deterministically for arbitrary frame numbers; use seeded/time-indexed variation rather than unbounded randomness.
- Use validated time-indexed amplitude/envelope data for reproducible export animation; do not depend on a live `AudioContext` during offline rendering.

## 27. Rendering Feasibility Gate

Before committing to any offline-rendering dependency, build a small technical proof of concept that renders a rigged/animated GLB character, a camera cut and a synchronized audio clip at an arbitrary frame. Test an out-of-order frame evaluation and a short exported video on the actual target laptop.

Assess renderer compatibility with the chosen Next.js / React / Three.js versions and the local graphics environment; pin tested versions, record license constraints, and choose the render pipeline only after successful verification. Remotion with `@remotion/three` and FFmpeg is a **candidate**, not an implemented or guaranteed solution.

Export must consume an immutable project snapshot and validated filesystem assets, not browser `blob:` URLs or IndexedDB-only media. Test true 720p/30 FPS export with audible soundtrack before promising higher resolutions.

## 28. Security, Asset Safety and Operational Reliability

- Validate audio/model types, sizes and import data; handle corrupt or incompatible GLB files gracefully.
- Validate and normalize file paths. Never accept arbitrary paths or shell commands from render API requests.
- Keep project saves atomic where possible and maintain a recoverable backup or revision history.
- Asset deletion must respect references and require confirmation for destructive operations.
- Keep automatic AI services disabled until explicitly configured and approved; avoid silently uploading private voice recordings to external services.
- Distinguish product requirements, implemented features, automated test results and browser-verified behavior in all progress reporting.
- For models inspired by identifiable brands, confirm suitable asset and branding usage rights before public distribution.

## 29. Document Status

This document defines the proposed technology stack and architectural compatibility requirements, not an instruction to begin building the application. Exact package versions are intentionally unspecified until validated at implementation time. Document deviations in `context/DECISIONS.md` and keep source-of-truth behavior rules in `context/BEHAVIOR_SYSTEM.md`.
