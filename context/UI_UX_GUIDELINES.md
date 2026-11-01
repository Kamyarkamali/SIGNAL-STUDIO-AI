# Signal Studio AI — UI/UX Guidelines

**Canonical path:** `context/UI_UX_GUIDELINES.md`  
**Project:** Signal Studio AI  
**Platform:** Personal, local-first Windows application served through a local web interface  
**Primary language:** Persian (`fa-IR`)  
**Status:** Product and interaction specification — not an implementation claim

## 1. Product Experience Goals

Build a beginner-friendly animation production workspace where users can create scenes, manage characters and environments, upload speech, assign speakers, direct reactions and cameras, preview, and eventually export a video without editing application code.

**Design principles:** clarity over density; predictable actions; immediate truthful feedback; progressive disclosure; consistent terminology; explicit save state; reversible edits; no fake controls. The user should always know (1) what is selected, (2) what will change, (3) which scene and time are active, and (4) whether the change was saved.

Do not show a feature as available if its backend, 3D adapter, or timeline execution is not implemented. Planned features must be hidden or clearly labeled unavailable; never use decorative buttons that imply functionality.

## 2. Language, Direction and Typography

- All user-visible navigation, form labels, validation messages, tooltips, onboarding, error states, and dialogs must use natural Persian.
- Application chrome and prose use `dir="rtl"`, `lang="fa"`; use a bundled local Persian font with good numeric readability.
- Timeline ruler, waveform, time progression, FPS display, file paths, code and technical identifiers use explicit `dir="ltr"` isolation. Time zero remains at the LEFT.
- Avoid misleading icon mirroring: playback and timeline direction remain consistent with the LTR time axis.
- Use adequate font size, contrast, line height, and touch targets; never rely on color alone to indicate speaker identity or status.
- Internal IDs may be English; labels are translated centrally, including emotion/reaction names.

## 3. Workspace Information Architecture

### Top toolbar

Project name; save state; undo/redo (only if operational); current scene; help; preview/fullscreen; export (only when supported). Distinguish project-level actions from scene-level actions.

### Right-side main navigation (RTL)

Separate, unambiguous destinations:

- پروژه‌ها
- سکانس‌ها
- شخصیت‌ها
- محیط‌ها
- صدا
- دیالوگ‌ها و گوینده‌ها
- حرکت‌ها و واکنش‌ها
- دوربین
- تنظیمات
- راهنما
- رندر و خروجی (once implemented)

Never render the same generic content for two unrelated tabs. Show the active tab, a contextual section title, and a short explanation of its purpose.

### Center: persistent 3D viewport

Keep the live scene visible while editing. Show scene name, active camera, preview mode and relevant loading/errors. Use a fixed, predictable preview aspect ratio (default 16:9), with resizing and letterboxing instead of stretching.

### Contextual properties inspector

Show only controls for the selected scene, character, environment object, dialogue, behavior, or camera event. Beginner mode shows essential controls; an Advanced disclosure reveals technical parameters.

### Bottom: docked timeline

Resizable dock containing scene, audio, speaker, character visibility, facial, gesture, gaze, and camera tracks as they become functional. Use a real time ruler, playhead, zoom, selection feedback and horizontal scrolling. Preserve the same timeline when switching editor tabs.

The default desktop layout must not be a long vertically stacked form. On narrower screens collapse side panels; on mobile prioritize reviewing and simple edits rather than claiming full desktop parity.

## 4. Onboarding and Contextual Help

Offer a short guided workflow:

1. ساخت پروژه
2. انتخاب محیط
3. افزودن شخصیت به سکانس
4. بارگذاری صدا
5. تعیین گوینده‌ها
6. انتخاب حرکت و دوربین
7. پیش‌نمایش و ذخیره
8. خروجی (when implemented)

Each main tab needs a concise Persian description, first-use empty state, and example of what happens when its primary action is used. Tooltips must explain effects, not repeat labels. Provide a searchable help/reference panel as the product expands. Do not block experienced users with mandatory onboarding.

## 5. Projects and Persistence UX

A project can be created, renamed, opened, duplicated and deleted with safeguards. Show save status: «ذخیره شد»، «در حال ذخیره»، «تغییرات ذخیره‌نشده»، and actionable error feedback. Autosave must not silently overwrite a corrupt file; provide recovery and clear import/export choices. Confirm destructive actions with affected references and consequences. Never auto-load demo assets into a new project.

## 6. Scene Editor and Storyboard

Present draggable scene cards with name, scene number, duration, start offset, environment, visible cast, and selected/active indication. Support create, duplicate, reorder, rename, delete and scene-only/episode preview. Provide keyboard-accessible reorder alternatives.

Selecting a card changes editor selection and preview target as specified by playback mode; it must not unpredictably change the current playing episode or reset unrelated data. Distinguish **scene-only preview** from **whole-episode preview** with explicit labels.

Scene duration must affect actual playback boundaries and global offsets, not just visibility. Explain the timeline policy for transitions and audio exceeding scene boundaries. Display transition types only if visually implemented. Scene notes are notes; do not imply natural-language text automatically animates anything.

## 7. Character Library vs Scene Cast

Two visibly separate areas:

**کتابخانه شخصیت‌ها** manages reusable character definitions (name, model preset, supported appearance, voice association, duplicates).

**شخصیت‌های این سکانس** manages actual scene instances (add/remove, visible/hidden, position, rotation, scale, gaze, per-scene overrides).

Creating a reusable character must not imply it is already on stage. Provide a prominent «افزودن به سکانس» action; after success the viewport must show the model, an on-stage selection state, and its property controls. Character cards should indicate model availability, loading/errors, and supported animation capabilities.

Provide selection, move, rotate and scale modes, ideally with on-canvas transform gizmos and numeric X/Y/Z inputs. Disable camera drag while manipulating an object. Keep existing cast, props and camera stable when adding a character; use safe placement or an explicit placement preview. Removing a character from a scene must never silently delete it from the library or its recorded dialogue.

## 8. Appearance Customization

Show only model-supported options: hair, beard, face, clothing, robot display/accent, accessories and color variants. Changes must visibly affect the targeted instance or definition as indicated. Explain clearly whether the action edits the reusable character or only this scene's override. Provide reset and duplicate-as-new-character actions. Loading incompatible GLB assets must show capability limits instead of pretending they can lip-sync or animate.

## 9. Environment Library and Scene Composition

Initially there is ONE real environment: **استودیوی پادکست**. Show it as the current environment; do not generate fake environment choices. If no alternative exists, avoid an active dropdown.

When real assets are available, provide environment cards, selection, a clear live preview, scene-specific lighting/prop overrides, and safe asset error states. A later composition editor may arrange validated props, lights and cameras. The product is not initially a full mesh-modeling application.

## 10. Audio Asset Manager

Dedicated visible actions: «بارگذاری صدا»، «تعویض فایل»، «حذف فایل»، «پیش‌شنیدن»، and «افزودن به تایم‌لاین». Show filename, format, duration, waveform (computed from real data), use locations, and missing-file status. Support WAV/MP3. Make deletion scope and effects explicit. After removal and refresh, deleted audio must not reappear as a default; demo audio is opt-in only.

Separate asset library, individual audio clips and assigned speaker intervals. Do not present an uploaded file as automatically transcribed or diarized.

## 11. Dialogue and Speaker Assignment UX

Allow users to select a waveform region and create/edit a speaker segment: start/end, speaker, dialogue text, optional note. Support split, merge, drag, resize, gaps, silence and audio-only speakers. Distinct colors and **text labels** must identify different speakers; expose an explicit «گوینده نامشخص» state.

Speaker selections must use stable IDs and include characters in the library plus audio-only speakers. A mixed recording can switch speaker arbitrarily many times. When a segment is selected, provide «پخش همین بازه» and a visible corresponding highlight on the timeline.

Never default unknown mixed-audio intervals to Kamyar. Only the currently assigned visible speaker may use speaking mouth animation; hidden/audio-only speakers play normally without making another visible character speak.

## 12. Reactions, Behaviors and Priority UX

All reactions use Persian labels. Offer only implemented, model-supported actions. For an event, edit: character target, type, start, duration, intensity, gaze target and priority where applicable. «پیش‌نمایش حرکت» must seek to and demonstrate the real 3D result, not just change a dropdown.

Use simple presets (e.g., لبخند، تعجب، فکر کردن، تأیید، نگاه به گوینده) before exposing advanced layer blending. Priorities are resolved per conflicting layer: manual director event > approved AI suggestion > dialogue-driven auto > idle. Compatible layers (mouth, gaze, face, hands) may run together. Refer to `context/BEHAVIOR_SYSTEM.md` as the authoritative behavior specification.

## 13. Camera and Direction UX

Distinguish the editor inspection camera from the production camera. Provide clear preset names, focus target, FOV/position controls when implemented, camera event timing and cut/smooth transition preview. Keep the viewport stable when scene cast changes; do not unexpectedly reframe except on explicit «کادربندی خودکار» action. Direction notes must not imply executable actions; provide a separate structured event editor.

## 14. Playback and Fullscreen Interaction

Use **one authoritative playback controller** for video, audio, speaker assignments and reactions.

- Click/tap an empty preview region once to play, again to pause, again to resume.
- Pausing must freeze visuals and audio together; a separate Stop action may reset to range start.
- Clicking transform handles, character objects in edit mode, sliders or toolbars must not accidentally toggle playback.
- Show a central play affordance when paused, time readout, progress/seek and volume.
- Space toggles playback when focus is not in an editable field.
- Fullscreen shows the live viewport and minimal controls; Escape exits; preserve framing, current time and playback state.
- Support keyboard accessibility, error messaging and browser autoplay constraints.

## 15. Timeline Editing Rules

Use one clock and explicit scene-local/global time conversion. Segment moves and trims must update both visible clips and evaluated animation. Show selection, snapping behavior, overlap policy, keyboard actions, and invalid timing errors. Timeline should support undo/redo only for real reversible edit commands; frame ticks are not undoable edits.

A selected clip's inspector must indicate target, track, time range, resulting behavior and precedence. Preserve manually edited speaker and reaction assignments on save/reopen.

## 16. Settings UX

Separate **general**, **preview**, **audio**, **animation**, **storage**, and **render configuration (when available)**. Every setting must change actual behavior, persist appropriately and have a working reset. Do not display an enabled export-quality control that suggests finished rendering before export is implemented. Show preferences vs project overrides clearly.

## 17. Offline Rendering UX (Future)

When the real frame renderer exists, provide entire-episode or scene-only export, resolution/FPS/format, output path, validation of missing assets, actual progress, cancellation and success/error feedback. Never simulate render percentages. Clearly distinguish real deterministic rendering from real-time screen capture. Keep preview and export timeline behavior consistent.

## 18. Accessibility and Responsive Design

- Keyboard navigation and visible focus styles for core actions.
- Adequate clickable target size and contrast.
- Accessible names and status announcements.
- Do not communicate state by icon or color alone.
- RTL text and LTR time axes tested on desktop.
- Prevent panels from covering critical playback controls.
- Allow collapsing/resizing workspace regions where practical.
- Empty, loading, error, unsupported-model, missing-media and unsaved-change states must be explicit.

## 19. Acceptance Tests and Quality Gates

Every implemented control must pass a functional verification path: user action → correct state update → visible viewport/timeline result → persistence when applicable. Build/lint success does not substitute for browser testing.

Minimum workflow checks:

1. Create project, save and reopen.
2. Add a character definition, then add its instance to Scene 2; verify visible mesh, independent materials and stable existing scene.
3. Move/rotate the added character; switch scenes and return; transforms persist.
4. Create/reorder scenes and change durations; scene-only and full-episode preview follow correct boundaries.
5. Upload mixed WAV/MP3, assign alternating speaker regions, play a region and seek; correct visible character speaks.
6. Delete uploaded audio, refresh, verify it stays absent and playback stops.
7. Add a model-supported manual reaction; inspect its visible effect and per-layer precedence.
8. Click preview to play/pause repeatedly in normal and fullscreen.
9. Change a real setting, reload, verify persistence and reset.
10. Verify Persian labels, RTL panels, LTR timeline, responsive layout, keyboard use and no unhandled console errors.

If automated browser testing is unavailable, record **not verified** and give local manual verification steps; never claim a pass from HTTP 200 alone.

## 20. Document Ownership and Scope

This file is the authoritative specification for navigation, layout, interaction and user feedback.

Other sources of truth:

- `PROJECT_OVERVIEW.md`: product goals and scope.
- `ARCHITECTURE.md`: subsystem boundaries and runtime contracts.
- `DATA_MODELS.md`: persisted data shapes and identifiers.
- `BEHAVIOR_SYSTEM.md`: behavior priorities, layers and evaluation rules.
- `ROADMAP.md`: phase allocation and acceptance milestones.

Do not duplicate their full contents here. This document does **not** authorize implementing all features at once. Implement only the currently approved development phase, verify it, then update progress and bug records.
