# Signal Studio AI — Coding Standards

**Document:** `context/CODING_STANDARDS.md`  
**Project:** Signal Studio AI  
**Status:** Proposed engineering rules — planning stage  
**Scope:** Local-only Windows 3D animation editor  
**Owner:** Project documentation  

> This is a standards document, not permission to start implementing application features. Follow the approved roadmap and the current milestone only.

## 1. Purpose and Authority

These standards protect maintainability, user data, visual stability and the consistency of preview and offline rendering. Read `AGENTS.md`, `PROJECT_OVERVIEW.md`, `ARCHITECTURE.md`, `TECH_STACK.md`, `DATA_MODELS.md`, `BEHAVIOR_SYSTEM.md`, `CHARACTERS_AND_AUDIO_REQUIREMENTS.md`, and `UI_UX_GUIDELINES.md` as relevant before implementing a milestone.

- `DATA_MODELS.md` is authoritative for persisted domain entities and IDs.
- `BEHAVIOR_SYSTEM.md` is authoritative for animation layers and priority resolution.
- `ARCHITECTURE.md` is authoritative for subsystem boundaries and data flows.
- `UI_UX_GUIDELINES.md` is authoritative for user-facing behavior and visual organization.
- If two documents conflict, stop the conflicting change, report the conflict and propose an explicit documentation decision; do not silently choose a rule.
- Treat example paths and proposed package choices as plans until verified in the real repository.

## 2. Incremental Development Contract

1. Inspect the current code and relevant documentation before editing.
2. State the current milestone, acceptance criteria and likely affected files.
3. Make the smallest coherent change that achieves the requested behavior.
4. Do not implement future roadmap phases, placeholders or unrelated refactors.
5. Add or update tests for every behavior change.
6. Run available checks and test the actual UI when a browser is available.
7. Document failures and unverified interactions honestly.
8. Update the progress checklist, bug tracker and decisions log as applicable.
9. Never mark a feature complete merely because TypeScript, lint or build passes.

## 3. Language and Naming

### Styling rule

Tailwind CSS v4 must be the default styling approach. Handwritten CSS is permitted only for justified global styles, design tokens, font declarations, or complex cases where utilities are unsuitable.

Use CSS-first `@theme` tokens and Tailwind utilities in components. Keep the Persian application RTL and give the timeline time ruler an explicit LTR direction. Load local fonts through `next/font/local`; avoid manual `@font-face` rules.

- Code, types, variables, file names, comments describing APIs, and technical documentation use clear English.
- User-facing labels, messages, errors, help text, onboarding and accessible names use natural Persian (fa-IR).
- Keep UI RTL, but timelines, time rulers, code, file paths and clock timestamps LTR where appropriate.
- Prefer descriptive domain names: `CharacterDefinition`, `SceneCharacterInstance`, `SpeakerAssignment`, `AudioClip`, `BehaviorEvent`.
- IDs, not display names, are authoritative references.
- Do not use ambiguous names such as `data`, `item`, `handleStuff` across major domain boundaries.
- Centralize translation strings; do not scatter hardcoded English labels through components.

## 4. TypeScript and Runtime Validation

- Enable TypeScript strict mode and avoid `any`, unsafe assertions and `@ts-ignore` without a documented narrow reason.
- Represent persisted structures with explicit versioned schemas and infer or align types consistently.
- Validate untrusted input at boundaries using Zod or another approved validation mechanism: imported JSON, assets, form submissions, API requests, AI outputs and render requests.
- Model event types as discriminated unions with explicit targets, timing, layers and parameters.
- Prefer exhaustive `switch` handling on event kinds and model capabilities.
- Keep runtime-only Three.js meshes, browser audio objects, DOM nodes and callbacks out of serialized data.
- Explicitly define units: seconds, integer frames, radians/degrees, world-space/local-space, meters or scene units; never mix them implicitly.
- Handle absent, invalid and migrated data explicitly; avoid silent fallback to an unrelated character, environment or audio asset.

## 5. Modules, Components and File Organization

- Organize by feature and responsibility rather than putting the entire editor in `page.tsx`.
- Keep UI presentation, editing commands, domain models, persistence, timeline evaluation and Three.js rendering separate.
- Prefer small cohesive modules; if a file becomes difficult to review or mixes concerns, split it by responsibility. Do not enforce an arbitrary line-count rule at the cost of fragmentation.
- React components should render UI and coordinate feature hooks; they should not encode unrelated persistence and animation policies.
- Domain and deterministic timeline logic must be pure and independent of React, browser APIs, filesystem and mutable Three.js objects.
- Avoid cyclic imports and deeply coupled barrels.
- Public feature APIs should be explicit; keep implementation details private.
- Avoid unnecessary libraries, duplicated utilities and premature abstraction.

## 6. State Ownership

Maintain separate sources of truth for:

1. **Persistent project state:** scenes, characters, environments, assets, timeline events, camera tracks, saved settings.
2. **Ephemeral editor state:** selected tool, selected scene, selected object, open panel, drag handles, transient forms.
3. **Playback state:** authoritative playhead, playing/paused mode and preview range.
4. **Runtime render objects:** Three.js resources, audio nodes, canvases and performance caches.

- Do not duplicate the authoritative playback clock in independent components.
- Use Zustand selectively with focused selectors; do not subscribe the entire application to rapidly changing values.
- Do not update global React state once per rendered frame when direct render-loop evaluation suffices.
- Use commands or transactions for persistent edits, with predictable undo/redo boundaries.
- Keep drag-preview state transient; commit meaningful edits at suitable boundaries.

## 7. Character and Environment Invariants

- Preserve strict separation between `CharacterModelDefinition`, `CharacterDefinition`, and `SceneCharacterInstance`.
- Creating a character in a library does not automatically create a scene instance unless the UI explicitly performs both actions.
- Adding a scene instance must result in an observable model or a clear missing-asset error; never report visual success from a name-only record.
- Character instance transforms are independent; changing Ali must not move Kamyar or the studio furniture.
- Shared immutable geometry may be reused, but mutable materials, skeleton pose and per-instance transforms must not leak across characters.
- Parent facial meshes and accessories to the correct local rig nodes; beard, eyes and mouth must follow the head and not drift into world space.
- Maintain explicit model-forward-axis and coordinate-space conventions for body rotation and head gaze.
- Keep reusable environment definitions separate from scene overrides and editable prop placements.
- Never populate environment selectors with nonexistent assets. The initial real environment is the podcast studio.
- Removing a character from one scene must not delete its library definition, voice metadata or occurrences in other scenes.

## 8. Animation, Behavior and Determinism

- Use a model-independent behavior evaluator and model-specific adapters for bones, morph targets, procedural geometry and digital facial displays.
- Only expose behaviors supported by the selected model; an unsupported gesture must not appear as working.
- Resolve conflicts **per animation property or layer**, not by disabling all lower-priority behaviors globally.
- Default precedence: explicit manual events > accepted AI suggestions > automatic dialogue reactions > idle behavior. Document any approved overrides.
- Compatible layers (for example speech mouth, gaze, smile and hands) may run together.
- Evaluate the same project at the same frame to equivalent poses regardless of frame evaluation order.
- No wall-clock time, free-running randomness or accumulated frame deltas in export-critical animation calculations; use deterministic time functions or seeded variation.
- Keep preview and offline rendering driven by the same evaluated animation/camera state.
- Character visibility and speaking identity are independent. Never assign a hidden speaker's speech to another visible character.
- When a gaze target is absent or hidden, apply a defined neutral fallback rather than a broken transform.

## 9. Audio, Dialogue and Playback

- Treat `AudioAsset`, `AudioClip`, `SpeakerAssignment` and `DialogueEvent` as distinct concepts.
- Do not infer speaker identity from sound amplitude. Speaker identity comes from explicit user assignments unless actual diarization is implemented and reviewed.
- In a mixed recording, amplitude may control mouth openness only for the assigned active speaker; it cannot identify the speaker.
- New projects start without demo audio unless the user explicitly loads a sample.
- Audio upload, replace, delete and reference updates must persist; deletion must not silently reactivate a default recording.
- Audio-only and unassigned speaker intervals must not animate unrelated mouths.
- Play, pause, seek, scene preview and fullscreen must use one authoritative timeline clock and clear boundary policies.
- Preview canvas clicks may toggle play/pause only when not dragging objects or using other controls.
- Properly release audio nodes, event listeners and active resources during unmount/replacement.

## 10. Scene Timing and Camera Rules

- Distinguish episode-global time, scene-local time and canonical frame units.
- Derive scene offsets from order and defined transition policies; do not create contradictory mutable offset sources.
- Scene duration changes must affect real visual evaluation and preview boundaries, not only character visibility.
- Duplicated scenes must have independent editable state while safely sharing referenced immutable assets.
- Differentiate the editor inspection camera from serialized production camera tracks.
- Preserve user-authored camera decisions; automatic suggestions must never silently overwrite them.
- Implement and test scene transition semantics (e.g. cut versus fade) before exposing them as supported options.

## 11. React and Three.js Performance

- Load expensive 3D editor modules client-side only where appropriate and avoid hydration-dependent nondeterminism.
- Avoid unnecessary rerenders from playhead or drag updates; use targeted subscriptions and refs where suitable.
- Cache/reuse geometries, textures and loaded assets carefully; do not clone large resources without need.
- Isolate mutable materials and rigs per instance where necessary.
- Dispose of resources only when ownership ends; avoid disposing shared cached assets while still referenced.
- Unregister `requestAnimationFrame`, ResizeObserver, DOM listeners and event subscriptions on teardown.
- Limit real-time shadows, pixel ratio and expensive postprocessing; expose truthful adjustable preview quality.
- Prevent duplicate canvases, audio contexts and render loops.
- Target Windows laptop hardware with integrated graphics, but report measured performance only after profiling.

## 12. Local Storage, Security and Recovery

- Prefer the approved versioned JSON project format plus managed local asset folders unless a later recorded decision changes it.
- Keep large media binaries outside JSON and reference them with stable validated paths/IDs.
- Do not persist temporary Blob URLs as durable asset references.
- Validate extensions, actual file content where possible, file sizes and project schema versions.
- Restrict local API routes to approved operations and validated project directories; prevent path traversal and arbitrary command execution.
- Bind local services to localhost by default; do not publicly expose development endpoints.
- Use atomic writes where practical and retain recoverable backups for important project changes.
- On project migration, preserve originals or backups and test migration of existing projects.
- Confirm destructive operations; identify dependent scenes/events before deleting assets or character definitions.
- Avoid storing credentials in source control or public client bundles.

## 13. UI/UX and Accessibility

- Follow `UI_UX_GUIDELINES.md`: clearly separate Scenes, Characters, Environments, Audio, Dialogue, Reactions, Cameras, Settings and Export panels.
- Keep the 3D viewport and timeline accessible while editing; avoid one giant vertically stacked form.
- Every visible control must perform a real action, or be disabled with an honest explanation if not implemented.
- Use Persian help text, clear empty/loading/error states, readable font sizes and keyboard-accessible controls.
- Handle RTL carefully: do not reverse timeline seek behavior or coordinate axes.
- Keep normal and fullscreen playback behavior consistent, including click-to-toggle play/pause and Escape to exit fullscreen.
- Do not use fake progress, fake waveform data or invented success notifications.
- Use confirm/cancel dialogs for destructive changes and meaningful feedback for save/import/export operations.

## 14. Testing and Definition of Done

Each change requires tests at the appropriate layers:

- **Unit (Vitest):** schema validation, instance identity, scene offsets, speaker interval boundaries, behavior precedence, deterministic frame evaluator.
- **Integration:** commands, persistence, asset deletion and restoration, timeline-to-character and audio-to-speaker state flow.
- **Browser (Playwright):** add a visible character, move it without shifting furniture, switch scenes, upload/remove audio, assign speakers, preview reactions, play/pause, edit settings and enter fullscreen.
- **Visual checks:** character facial geometry, camera framing, visibility and no scene corruption.
- **Render checks (later phase):** arbitrary-frame equivalence, audio/video sync, file actually playable, output codecs and cancellation.

Run the available scripts for typecheck, lint, tests and build. If a script does not exist, report it rather than inventing success. `HTTP 200` or a passing build is not proof that controls or animations work.

A feature is **Done** only when:

1. Its relevant acceptance criteria are met.
2. It has tests of appropriate scope, and these tests passed in the available environment.
3. User-visible changes are observed in real browser testing when that behavior depends on browser rendering.
4. No known critical regression was introduced.
5. Documentation and outstanding unverified items are updated.

Use the status labels **Implemented & verified**, **Implemented but browser-unverified**, **Partial**, **Missing**, and **Blocked**. Only mark checklist `[x]` when verification is sufficient for the specific claim.

## 15. Offline Rendering Quality Contract

Offline export is a later phase. When implemented:

- Render exact frame positions using the shared deterministic frame evaluator.
- Do not present real-time MediaRecorder screen capture as offline frame rendering.
- Validate required assets before starting jobs.
- Render from an immutable project snapshot and stable asset references.
- Combine original audio clips according to timeline time, with specified trim, gain and overlap rules.
- Track real job progress, cancellation and cleanup.
- Only claim MP4/H.264 support after producing and checking a playable video with correctly synchronized audio.
- Check renderer license, runtime support and Windows hardware constraints during that phase.

## 16. AI Integration Contract (Future)

- AI is optional; no AI services or API keys are required for local core functionality.
- AI may produce structured, schema-validated proposals, not direct unreviewed scene mutations.
- Only propose animations compatible with the target model's declared capabilities.
- Give the user review, accept, reject and edit controls; preserve manual overrides.
- Do not imply an AI model is connected merely because an AI button or panel exists.

## 17. Git, Reviews and Change Reports

- Keep changes small and reviewable, scoped to a milestone.
- Do not silently delete, replace or reset user projects/assets.
- Avoid committing `node_modules`, build output, renders, local personal media or secrets.
- Update the lockfile when dependencies intentionally change.
- Explain any migrations, new dependencies and non-obvious tradeoffs.
- At the end of a milestone, report: **scope, implementation, changed files, tests run/results, browser verification, limitations, known bugs, next proposed task**.
- Update `context/PROGRESS_CHECKLIST.md`, `context/BUG_TRACKER.md`, and `context/DECISIONS.md` as appropriate; update architectural documents only when the approved design changes.

## 18. Codex Execution Checklist

Before coding:

- [ ] Read relevant context and the requested milestone.
- [ ] Inspect the existing implementation and identify state owners.
- [ ] State acceptance tests and scope boundaries.

Before reporting completion:

- [ ] Validate TypeScript, lint, unit tests and build where supported.
- [ ] Run real user-flow/browser checks when available.
- [ ] Confirm that audio, scene, character and timeline state remain synchronized.
- [ ] Check cleanup, persistence and regression behavior.
- [ ] Record any unverified functionality honestly.
- [ ] Update progress, bug and decision context files.

**Document status:** Architecture-phase standard. No application feature is implemented by the existence of this document.
