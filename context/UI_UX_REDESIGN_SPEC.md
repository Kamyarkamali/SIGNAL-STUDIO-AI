# SIGNAL STUDIO AI — UI/UX Redesign Specification

## Status

Approved design direction.

Implementation and browser acceptance pending.

## 1. Product Vision

Signal Studio AI is a Persian-first professional 3D animation, podcast, and educational video creation studio.

The interface must be powerful but easy for beginners.

The user should be able to manage scenes, characters, audio, speaker intervals, animation events, cameras, and studio assets through a coherent creative workflow.

Do not confuse visual redesign with implementation of future roadmap functionality.

## 2. Visual References

Reference files:

- `references/ui-redesign/capcut-reference.png`
- `references/ui-redesign/blender-reference.png`
- `references/ui-redesign/davinci-reference.png`

### CapCut — Primary UX Reference

Use for:

- Clean and understandable navigation.
- Media asset library.
- Large preview/player.
- Contextual properties panel.
- Layered timeline.
- Simple editing controls.
- Visual clarity and beginner-friendly interactions.

### Blender — 3D Animation Reference

Use for:

- 3D viewport organization.
- Character selection.
- Transform tools.
- Camera navigation.
- Animation tracks.
- Pose and behavior editing.
- Timeline and action hierarchy.

Do not copy Blender's complexity or cluttered controls.

### DaVinci Resolve — Advanced Timeline Reference

Use for:

- Professional multitrack timeline.
- Scene and clip organization.
- Audio lanes and waveform representation where supported.
- Precise timecode.
- Track visibility and controls.
- Editing workspace layout.
- Inspector-based property editing.

Do not copy these applications pixel-for-pixel.

Use their strengths to create a coherent original Signal Studio AI interface.

## 3. Non-Negotiable Architecture Rules

Preserve all existing implemented capabilities.

Preserve:

- Project schemas and migrations.
- Project persistence.
- APIs and backend services.
- Scene management.
- Storyboard.
- Scene-local arrangements.
- Character system and GLB support.
- Character animations.
- Gaze system.
- Animation event evaluation.
- Existing priority resolution.
- Audio asset and clip data.
- Speaker intervals.
- Production cameras.
- Editor camera navigation.
- Environment and props.
- Laptop media.
- Existing timeline logic.
- Existing rendering optimizations.

Do not replace the existing domain architecture with a parallel implementation.

No data loss, destructive migration, or silent feature removal is acceptable.

## 4. Target Workspace Architecture

Use:

1. Compact global header.
2. Collapsible primary navigation.
3. Context-aware asset/library panel.
4. Prominent 3D viewport and production preview.
5. Selection-based properties inspector.
6. Unified multitrack timeline.
7. Centralized Persian contextual help.

Every panel must have one clearly defined responsibility.

Avoid duplicated functionality across unrelated panels.

## 5. Unified Timeline

Use one shared timeline timebase.

The timeline should visually organize:

- Scenes.
- Existing character action events.
- Existing audio clips.
- Speaker intervals.
- Supported media/display events.
- Future camera event tracks.
- Future subtitles.

Only implemented features may be interactive.

Planned features must be clearly marked as unavailable.

Do not implement Phase 07/09/11 functionality as a side effect of redesign.

## 6. Scene-Centered Workflow

A user should be able to:

1. Open a project.
2. Select a scene.
3. Select or add scene content using supported tools.
4. Attach an existing audio clip through supported placement operations.
5. Inspect speaker intervals.
6. Create supported character actions.
7. Configure an existing production camera.
8. Preview the scene.
9. Save and reopen without losing data.

Minimize unnecessary navigation between different workspaces.

## 7. Professional Persian UX

All user-facing interfaces must use Persian RTL.

The timeline and timecode remain LTR.

Every button, field, and complex setting must have meaningful Persian guidance.

Use:

- Contextual tooltips.
- Small help icons.
- Expandable global Help Center.
- Step-by-step workflows.
- Useful empty states.
- Clear errors and success feedback.

Explain whether each action affects the selected scene or the entire project.

Do not create a duplicate help system.

## 8. Layout and Responsive Behavior

Prioritize usable viewport size and editing clarity.

Support:

- 1920×1080 desktop.
- 1366×768 laptop.
- 1024×768 compact desktop.
- 768×1024 tablet.
- 390×844 mobile.

Use resizable/collapsible panels and adaptive layouts.

Avoid overlapping controls, excessive scrolling, tiny text, and unused space.

Do not force the full desktop editor into a narrow mobile screen.

## 9. Visual Design

Preserve the Signal Studio AI identity.

Use:

- Professional dark charcoal/navy surfaces.
- Restrained turquoise accents.
- Consistent typography.
- Clear visual hierarchy.
- Semantic action colors.
- Subtle micro-interactions.
- Accessible focus states.
- Consistent spacing and iconography.

Use existing components where practical.

Adopt additional UI libraries only when justified by actual interaction needs.

## 10. Engineering and Performance

Preserve the mounted Three.js canvas where possible.

Avoid unnecessary GPU allocations, WebGL contexts, and React rerender loops.

Target integrated AMD Radeon graphics.

Separate layout and presentation state from project-domain state.

Keep code modular, typed, and testable.

## 11. Design Acceptance Criteria

The redesign is not accepted merely because automated tests pass.

Verify:

- No feature loss.
- No project data loss.
- Clear workflow navigation.
- Large and usable 3D viewport.
- Discoverable audio clips and speaker intervals.
- Usable animation timeline.
- Correct camera tools.
- Functional Persian help.
- Responsive layouts.
- Correct Save/Refresh behavior.
- Stable playback and rendering.

Use actual browser visual comparisons against the design references.

## 12. Delivery Strategy

Implement incrementally.

Audit first, then redesign the workspace shell, panels, timeline, contextual inspector, and visual details.

Maintain working functionality throughout.

Do not automatically commit or push.

Document remaining limitations and browser acceptance debt.

## 13. Current implementation record (2026-11-03)

The existing editor already provides a compact project header, collapsible Persian navigation, a single mounted Three.js viewer, selection-routed properties, separate scene and animation authoring modes, and a unified project-frame timeline for scenes, supported character actions, audio clips, and speaker intervals. Existing project APIs, persisted records, time conversions, and evaluation remain authoritative.

The unified timeline now has bounded presentation zoom (50%–400%), a project-scale reset, a visible zoom percentage, and tick density that follows its visible width. Zoom changes only the rendered width; stored frame positions, project FPS, selection, and event movement continue using the existing project frame mapping. Horizontal scrolling remains available in the track scroller.

This pass does not establish responsive or browser acceptance. Audio playback is not synchronized to the project playhead; camera and subtitle event tracks remain unavailable; BUG-0024, BUG-0029, and BUG-0030 remain open. Do not interpret the UI implementation record as completion of a roadmap phase or production acceptance.
