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

**Future educational workflow labels:** Once their phases are implemented and browser-verified, use clear Persian controls such as «محتوای نمایشگر»، «تصویر»، «ویدیو»، «نمایشگر خاموش»، «نمای پشت شانه»، «نمای نزدیک نمایشگر»، «نمای کامل استودیو»، «تغییر زاویه دوربین»، «افزودن به تایم‌لاین» and «پیش‌نمایش». The media selector and camera selector are independent. Users can repeat display and camera changes within one scene, and turning a screen off must not erase its saved media choice. Do not expose these as active controls in Phase 03-B.

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

### Workspace layout and scrolling

- Desktop uses a viewport-height shell with persistent toolbar/navigation, a center 3D preview, a contextual inspector, and a bottom timeline. The document itself must not scroll during normal editing.
- Keep `min-height: 0` on nested grid/flex children that need to shrink. Navigation, inspector content, and timeline overflow independently; avoid nested page-level scroll containers.
- The contextual editor and selected-item properties occupy separate tabs in the left inspector, each with its own scroll position. Navigation opens the active section tab; selecting a scene item opens its properties. Keep both panels mounted while switching tabs so unfinished form edits are not discarded. The inspector may be temporarily collapsed; do not persist this UI state in project data.
- Preserve the preview's 16:9 scene framing as available dimensions change. At tablet widths allow a collapsible left panel. On mobile keep the preview in the page and open editing controls in a dismissible drawer; permit controlled document scrolling without horizontal overflow.
- Keep keyboard focus visible and respect `prefers-reduced-motion`; small interface transitions must not animate the WebGL scene.
- Draggable panel resizing is optional and deferred until stable layout behavior has browser evidence.

### Viewport enlargement and fullscreen

- Prioritize the 3D viewport within the existing editor by keeping surrounding padding and the inspector width restrained; preserve the normal 16:9 frame and keep navigation, properties, and timeline available.
- A compact viewport-toolbar button enters browser fullscreen on the viewport container only. Keep camera reset and orbit controls available, and show an accessible exit button in the same toolbar. Escape exits through the browser API.
- Synchronize the button to `fullscreenchange`; on exit, denied requests, or unsupported browsers, restore/retain the normal workspace and show a concise Persian status when necessary. Do not save fullscreen state or change the editor/production camera state.
- In fullscreen, fit the 16:9 production frame within the available display area without stretching. Let the mounted WebGL canvas resize with its container; do not recreate the scene to enter or exit fullscreen.
- Verify desktop, tablet and mobile behavior in a browser before acceptance. Respect reduced motion for button transitions.

## Animation workspace layout refinement

- Keep scene selection/management, animation event authoring, and the LTR timeline visually distinct while routing all three through the same active scene and project state.
- Animation editor and event inspector controls must use `min-width: 0`, stretch to the panel width, and scroll inside their own pane; long Persian option labels must not set the inspector's intrinsic width.
- Keep event lists and secondary animation parameters behind native keyboard-operable disclosures. Their collapsed summaries need a visible disclosure affordance and Persian effect guidance.
- The animation section remains inside the existing responsive workspace and must not mount a second WebGL canvas. Preserve the 16:9 viewport, resizable/collapsible inspector and timeline, and mobile drawer behavior.
- Reuse the installed project-styled navigation, tabs, native `details` disclosure, browser title/accessible help, independent overflow regions, and resize handles. Add a component package only when it solves a demonstrated gap without duplicating these controls.
- Browser layout acceptance is required at 1920×1080, 1366×768, 1024×768 and 390×844. Automated layout checks do not establish absence of visual overlap.

### Timeline event timing inputs

- Keep timing text drafts local while a user types; do not update an event for empty or intermediate strings.
- Offer start and exclusive end in HH:MM:SS:FF timecode and seconds modes; show duration as a derived seconds/frame value. Keep project time as integer frames and convert seconds using `Math.round(seconds * projectFps)`.
- Use plain LTR text inputs; do not normalize partial timecode or decimal text on each keypress. Preserve selection, caret and focus through parent updates. Commit on blur/Enter, show Persian inline errors, and let Escape restore the last committed value.
- Validate minutes and seconds below 60, frame numbers below FPS, positive duration and scene bounds. The event's end frame is exclusive, so the interval is `[startFrame, startFrame + durationFrames)`.
- Keep keyboard, paste, arrow and Tab behavior native. Labels/tooltips must explain FPS and the difference between seconds and frame counts.

### Focused animation authoring workspace

- The timeline dock switches between **scene overview** and **animation tracks** so storyboard cards and event tracks never compete for the same visible area. Animation mode keeps the existing global transport, a scene selector, and the same persistent viewport; it does not create a second canvas or store.
- Group only scheduled events that exist for each character, then show their actual event categories (gaze, head, face, hands) on separate rows. Parallel blocks on independent rows communicate compatible concurrency; overlapping blocks in one row identify same-channel conflict candidates.
- Timeline drag handles move an event in integer-frame increments and clamp it to the scene while preserving duration. The separate event-list drag handle and arrow buttons change saved editor list order only. Neither operation changes priority. Inspector priority explains that larger values resolve only overlapping events on the same channel; independent channels compose.
- Keep the selected event inspector focused on the current event. Scene selector and timecode controls must preserve the active project and stable IDs. Provide meaningful Persian help and effect-specific tooltips for scene switching, event selection, time movement, list reordering, zoom and priority.
- Browser-check drag behavior, touch and keyboard fallback, overlap readability, save/reopen, and 1366×768 or narrower layouts before visual acceptance.

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

### Scene object selection and editing

- A single click selects a prop and shows its subtle selection outline and properties; it does not show a transform gizmo. Empty-space clicks clear selection unless a transform drag/edit interaction is active.
- Double-clicking a selected editable prop enters Object Edit Mode with Move as the default. The Persian environment panel provides explicit selection, edit, Move/Rotate/Scale and finish controls for mouse and touch users.
- Numeric transform fields remain available while a prop is selected, whether or not Object Edit Mode is active. Escape and the finish control hide the gizmo while retaining selection and committed changes.
- Selecting a different object ends the previous object's edit mode. Protected objects may be selected for inspection but never receive transform controls.
- Orbit navigation remains enabled outside gizmo drags and is restored after drag completion or component cleanup. Selection/edit state is temporary UI state; only the resulting transform is saved.

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

## Studio 01 Decorations and Viewport Object Interaction

- A single viewport click on a prop does not select it or show a transform gizmo. Double-click selects an editable prop and enters Move-first edit mode; protected structural objects cannot be edited.
- The Persian Environments panel remains the explicit route to select a prop and enter/exit Move, Rotate or Scale editing. Escape clears the active prop and exits edit mode. A genuine empty-space click also clears selection; clicks on another prop remain inert unless they are a double-click. Camera orbit, pan and zoom remain available unless a transform gizmo is actively dragged.
- The editor camera can orbit around the studio, including side and rear views, and the «بازنشانی دوربین» action restores its default editor view. Production camera state is separate.
- Selecting the Studio 01 sign or wall-art prop exposes decoration controls in the Environments panel. The sign and both frames have independent saved customization; artwork uses project-local image assets.
- Browser verification remains required for viewport interaction, visible artwork/illumination, upload/reopen behavior, camera bounds, touch input and transform-drag cleanup.

## Laptop display viewing and clean object selection

- Keep the laptop's close-up on the actual 3D screen, framed from a readable front/overhead angle. Restore the full editor camera pose when close-up ends.
- Provide a compact fullscreen viewer for the selected project-local display image or video, with an accessible close/exit control and a modal fallback when browser fullscreen is unavailable. The viewer does not replace the laptop or edit its media assignment.
- Keep Device View, Screen Focus and Content Only as separate Persian-labeled modes. Device/screen framing must use the actual laptop screen/body proportions and honor source contain/cover behavior; fullscreen and Escape must restore the viewer/editor state predictably.
- Distinguish removing a laptop image assignment from permanently deleting its imported project image. Confirm permanent deletion; list/reference conflicts and provide a safe workflow to clear assignments before retrying. Show loading, failure and refreshed library state.
- Selection from properties must not show viewport bounds or transform gizmos. Show object edit visuals only after explicit double-click or the Persian edit command; keep empty-space deselection behavior.
- Browser review remains required for close-up framing, fullscreen open/exit/Escape, media readability, camera restoration and clean viewport appearance.

## Project-local character model import

- Keep the library's primary actions compact: create identity, import a 3D model, then add an identity instance to the studio. Imported model definitions remain distinct from named identities and scene instances.
- Use a focused Persian modal for file choice, validation feedback, isolated 3D preview, and confirmation. Keep the production viewport and its editor state mounted behind it; do not add import fields permanently to the main properties panel.
- Provide orbit/zoom, front/side/back/reset, bounding dimensions/box, preview size, target height, forward rotation, floor alignment and optional seating correction in the import workflow. Place actual discovered material and rig metadata in a labeled advanced section; diagnostic discovery does not imply animation support.
- Show measurable upload progress, clear extension/signature/structure/size failures, and a recoverable missing model state. Cancellation before confirmation must not write project bytes or change project data.
- Browser review remains required for dialog usability, preview controls, actual upload/reopen, responsive behavior, console output and integrated-GPU performance.

## Studio 01 room and lighting controls

- Keep lighting settings compact in the Environments panel. Group intensity sliders, temperature preset, practical-light toggle and reset under a labeled disclosure rather than expanding them by default.
- Label wall/ceiling visibility as editor-only and make its pressed state explicit. It must not alter saved prop visibility or project data.
- Preserve the central viewport and camera reset/navigation controls while these settings are used. Sliders and presets must update the actual R3F lighting and persist through the existing project save path.
- Manual browser review is required for appearance, exposure, color readability, wall visibility and layout fit.

## Character animation preview controls (Phase 04-C1)

- Keep preview actions in a compact, collapsible group in the selected character's properties.
- Offer only actions supported by the selected model's active renderer. Show unsupported actions as disabled with a short reason.
- Clearly label preview as temporary; provide play, stop and reset/return-to-idle controls with accessible Persian names.
- Keep preview state independent per scene instance and never imply it is saved to the project.
- Preserve the viewport and existing properties-panel scroll behavior. Browser review is required for control clarity, motion feedback, keyboard use and panel fit.

## Expressive animation preview controls (Phase 04-C2)

- Keep action selection and play/stop/reset in the existing collapsible character properties group. Put speed, intensity, transition, return duration and easing in a nested disclosure so routine controls remain compact.
- Disabled actions must communicate missing model capabilities. Facial-expression previews are available only for the ChatGPT robot's existing face display; other models preview supported local pivots only.
- Treat all preview settings as temporary editor state. Verify the controls and motion in-browser before acceptance; automated checks do not establish natural timing or visual quality.

## Gaze and attention preview controls (Phase 04-C3)

- Put gaze mode, stable character/prop target, local direction, attention preset and transition duration in a compact disclosure in the selected character properties. Keep the 3D viewport visible; gaze is a temporary preview and must not appear as a saved-project setting.
- Show only model-supported channels: current procedural models support head direction, ChatGPT additionally supports iris direction, while human/Claude eye tracking, torso rotation and imported GLB gaze are unavailable.
- Provide neutral return and clearly explain that unreachable targets are clamped safely. Missing or hidden targets should show a concise Persian fallback state.
- Keep camera target independent from editor and production camera controls. Manual browser review remains required for target behavior, motion quality, reset, multiple characters and panel fit; C2 expression failures remain separately open.

## Scene storyboard and authoring (Phase 05-A)

- Show each scene's order, title, optional type, duration, start time and short description in a compact storyboard card. Selection is explicit and shared with the global timeline.
- Keep selected-scene title, description, type, duration and director notes together in a focused properties panel next to the storyboard. These fields are organizational metadata and must not imply automatic animation or camera direction.
- Use a visible drag handle, clear drop highlight and native drag-and-drop. Retain labeled, keyboard-operable move buttons as an accessible fallback; dragging must not select a scene.
- Keep the global time display and progression LTR inside the RTL workspace. Show scene boundaries and playhead; seeking and selected-card state use the same integer-frame scene-time source.
- Keep the 3D viewport available, constrain card/property scrolling to their own areas, and retain responsive compact layout. Verify drag, keyboard reordering, field editing and boundary behavior in a real browser before acceptance.

## Production workspace shell and contextual help

- Use a compact project/save header and a collapsible Persian navigation rail. Keep existing supported editors reachable; label future-only audio, dialogue, behavior, camera, settings and export sections as planned.
- Give the viewport the flexible main region. Preserve its mounted R3F canvas, aspect behavior, fullscreen control, camera reset, editor-helper visibility and object editing. Use the existing inspector and timeline as adjustable panels; provide a restore-layout action.
- Keep inspector/timeline resizing keyboard operable with bounded sizes. Store these as transient editor preferences, never in project data. Panel collapse and section changes must not reset the selected project or scene.
- Use semantic design tokens for dark surfaces, borders, text, accent/status colors, spacing, radius and elevation. Reuse these tokens in shared controls; keep motion subtle and disable it under `prefers-reduced-motion`.
- Provide a small clickable question-mark help control for each major section and relevant character/scene subtool. Help must work with pointer, touch and keyboard, include desktop titles, close with Escape, restore focus, and explain purpose, use, steps, controls, example and limits in Persian.
- Clearly mark planned sections and explain that scene notes are not interpreted as animation/camera commands. Never describe planned audio, camera, behavior or export as available.
- At 1024px and wider, retain the desktop workspace; at 768–1023px use compact horizontal navigation and a collapsible inspector; below 768px prioritize the preview and use secondary panels as drawers/stacked content. Keep time progression LTR and application layout RTL.
- Browser acceptance is required at 1920×1080, 1366×768, 1024×768, 768×1024 and 390×844. Check overflow, panel resize/reset, help focus/Escape, viewport/fullscreen, timeline and existing editor workflows before marking the redesign visually accepted.

### Editor helpers and laptop presentation

- Provide a compact, explicit viewport toggle for editor helper visibility. It hides prop/character transform gizmos and selection bounds without clearing the selected item or changing scene data.
- Hide editor helpers temporarily during viewport fullscreen and either laptop viewer mode, then restore the user's manual helper preference when presentation ends.
- Prefer a device-framed laptop presentation that retains the laptop body, bezel and attached screen media. Keep the content-only fullscreen viewer as a separate, clearly labeled secondary option.
- Presentation exit, including Escape, restores the prior editor inspection target and camera. Keep media assignments and production camera state untouched.
- **Status:** Implemented; visual and responsive browser verification pending.

### Phase 05-B scene manager and camera controls

The Scenes navigation opens a compact scene manager backed by the same project scene state/actions as the storyboard and timeline. Scene selection is derived from the global frame, so choosing a card updates the storyboard, timeline and viewport together. Create, rename, duplicate, delete-with-confirmation, drag reorder and keyboard move actions must explain their effect in Persian. The selected scene's detailed configuration remains available in the inspector properties tab.

Scene configuration controls must explicitly say that edits affect only the selected scene; character removal from a scene retains its project identity, while appearance and media remain shared. Camera help distinguishes the editor orbit camera from the production camera and explains that production preview is temporary and restores the editor view. Disabled environment selection must explain that only the registered Studio 01 environment is currently available.

### Permanent user-facing guidance requirement

Every new or modified user-facing section, button, tool or interactive control requires a clear Persian label, a meaningful tooltip or accessible explanation, contextual section help, keyboard/touch access where applicable, accurate usage guidance, and appropriate loading/error/empty states. UI/UX work is not complete until this guidance is present and verified for accuracy.

The header Help action opens the searchable, expandable guide for the whole application; section help opens the same registry's focused topic. The viewport toolbar groups editor/production view, helper visibility, camera reset, fullscreen and secondary camera/presentation actions in a compact row. Camera save feedback must distinguish pending persistence, success and failure; a temporary laptop inspection view must not be saved as a production camera.

### Contextual inspector

Keep the Projects workspace focused on project CRUD; do not show a generic Properties tab there. In character, scene and environment workspaces, label the two panel views by their actual purpose (workspace tools and selected item properties). Selecting a timeline/storyboard scene opens that scene's configuration; selecting a character or prop opens its existing model-specific controls. A laptop selection shows the existing display/media controls. Keep the panel heading and contextual help tied to the active workspace and selection, not stale selections from another section. Unsupported camera selection controls must not be invented; production camera settings live in the selected scene configuration. Preserve independent scrolling, collapse behavior and selection state when switching sections.
### Editor camera navigation

Viewport camera navigation offers a smoothed Orbit mode, an explicit pointer-locked Free Fly mode, and a Focus on Selection command. The compact navigation menu uses the centralized Persian `cameraNavigation` help topic and describes the WASD/QE/Shift/Escape shortcuts. Focus remains available to mouse and touch users without requiring keyboard navigation. Keyboard movement is active only while the viewport owns pointer lock; text inputs are excluded, Escape releases the lock, and the canvas prevents browser scrolling only during active movement. Display the active mode and keep the speed range keyboard operable. Editor navigation is transient; the current scene's production camera changes only through the explicit save-view action.
