# SIGNAL STUDIO AI — Video Production Requirements

**Document type:** Product Requirements & Long-Term Vision  
**Development stage:** MVP  
**Status:** Living specification — not an implementation-completion report

## 1. Product Vision

Signal Studio AI is a professional, beginner-friendly 3D animation and video production application built with Next.js, TypeScript, React Three Fiber, and Three.js.

The primary goal is to allow users to create complete animated educational videos, podcasts, and social media clips without manually coding every animation.

The application must eventually support:

- Multiple independent 3D characters.
- Character facial expressions and natural body animations.
- Dialogue and audio synchronization.
- Speaker-driven listening and reactions.
- Dynamic educational whiteboards and presentations.
- Scene-based storytelling.
- Timeline-based animation editing.
- Cinematic camera direction.
- Persian subtitles.
- Downloadable MP4 video output.

The application must be an actual video production editor, not merely a 3D scene viewer.

## 2. Approved Visual Direction

Follow the user-approved animated educational podcast reference.

Preferred style:

- High-quality stylized 3D animation.
- Friendly, expressive characters.
- Natural movements with readable emotions.
- Professional podcast and educational environments.
- Cinematic composition and lighting.
- Clean, readable educational graphics.
- Smooth camera transitions.
- Clear Persian subtitles.

Photorealism is not required.

Current character models are MVP prototypes and may be refined later.

## 3. Character System

The system must support:

- Multiple characters per project.
- Humans, AI mascots, robots, and future GLB models.
- Character model libraries.
- Independent character identities.
- Independent scene instances.
- Custom appearance and clothing.
- Sitting, standing, moving, and rotation.
- Character visibility and placement.
- Stable character instance IDs.

Initial characters:

- Kamyar — human host.
- Hamid — human guest.
- ChatGPT — friendly white AI robot.
- Claude — orange cube-shaped AI mascot.

Do not hardcode application architecture around these four characters.

## 4. Natural Character Acting

The final system must support a comprehensive library of natural acting behaviors.

### Facial Expressions

- Neutral
- Happy
- Laughing
- Excited
- Sad
- Angry
- Worried
- Afraid
- Surprised
- Confused
- Thinking
- Curious
- Embarrassed
- Frustrated
- Listening
- Speaking
- Agreeing
- Disagreeing

Expressions must visibly affect supported facial components.

These include:

- Eyes and eyelids.
- Eyebrows.
- Mouth and lips.
- Cheeks.
- Jaw.
- Head movement.

Do not expose fake or visually ineffective expressions.

### Body and Hand Gestures

Support:

- Hand-to-chin thinking.
- Hand waving.
- Open-hand explanation.
- Pointing at objects.
- Head nodding and shaking.
- Shrugging.
- Folding arms.
- Resting hands on tables.
- Leaning forward and backward.
- Sitting and standing.
- Holding educational tools.

Gestures must coordinate with emotions rather than playing as unrelated animations.

Model capabilities must be validated before enabling a gesture.

## 5. Gaze and Attention

Characters must eventually support:

- Looking at another character.
- Looking toward an active speaker.
- Looking at a laptop.
- Looking at a whiteboard.
- Looking at selected props.
- Looking toward the camera.
- Looking behind or beside themselves.
- Looking at custom world-space targets.

Support both manual direction and optional automatic attention behaviors.

Automatic behaviors must allow director overrides.

## 6. Audio and Dialogue

Users must be able to:

- Upload audio files.
- Record dialogue when supported.
- Assign audio to specific characters.
- Set dialogue start and end times.
- Edit speaker assignments.
- Preview synchronized dialogue.
- Delete or replace audio.
- Control audio volume.
- Work with multiple speakers per scene.

The system must support future automatic lip sync.

Lip sync should use supported mouth shapes, visemes, or equivalent animation channels.

Audio and animation must share a common timeline.

## 7. Speaker-Driven Reactions

The final application must support configurable speaker-driven behavior.

Example:

When Kamyar speaks:

- Kamyar performs speaking gestures.
- His mouth moves in synchronization with audio.
- ChatGPT looks toward Kamyar.
- Hamid may nod or smile.
- Claude may listen or display another selected reaction.
- The camera may focus on Kamyar.

All automatic behavior must be configurable.

Users must be able to manually override actions.

## 8. Educational Presentation System

Support reusable educational props and content.

### Educational Assets

- Whiteboards and blackboards.
- Screens and laptops.
- Mobile phones and tablets.
- Books and notebooks.
- Teaching pointers.
- Shapes and arrows.
- Text labels and diagrams.
- Educational images and videos.

### Educational Animations

Support:

- Revealing text step by step.
- Displaying diagrams progressively.
- Showing arrows and highlights.
- Animated educational illustrations.
- Character pointing gestures.
- Characters standing beside teaching boards.
- Synchronized teaching content and dialogue.

Educational content must be editable and timeline-compatible.

## 9. Scenes and Storyboard

Users must eventually be able to:

- Create scenes.
- Rename scenes.
- Duplicate scenes.
- Delete scenes.
- Reorder scenes.
- Set scene duration.
- Select scene environments.
- Add or remove characters per scene.
- Configure character presence and transforms.
- Configure camera shots.
- Add educational content.
- Preview scene transitions.

Scenes must remain independent while sharing reusable project assets.

## 10. Timeline and Scene-Time Model

All time-dependent systems must share a consistent scene-time model.

The timeline must eventually support separate tracks for:

- Characters.
- Animation and gestures.
- Facial expressions.
- Gaze and attention.
- Audio and dialogue.
- Camera shots.
- Educational content.
- Subtitles.
- Prop interactions.

Requirements:

- Deterministic timestamp-based evaluation.
- Frame-accurate seeking.
- Precise timing.
- Playback and pause.
- Timeline scrubbing.
- Track visibility and editing.
- Animation blending and priority.
- Future frame-by-frame export.

Given identical scene data and timestamp, the evaluated result must be reproducible.

## 11. Cinematic Camera System

Support:

- Wide shots.
- Medium shots.
- Character close-ups.
- Two-person conversations.
- Group shots.
- Whiteboard-focused shots.
- Laptop display close-ups.
- Character POV shots.
- Manual camera movements.
- Smooth camera transitions.
- Camera cuts.
- Optional speaker-following behavior.

Editor and production cameras must remain independent.

Camera movements must be compatible with timeline seeking and video export.

## 12. Laptop Presentation

The laptop must work as an educational presentation device.

Required viewing modes:

1. Device View — realistic open laptop with visible hardware.
2. Screen Focus — readable educational content within a realistic screen bezel.
3. Content Only — raw media without laptop framing.

Support:

- Image and video content.
- Correct aspect ratios.
- Media replacement and deletion.
- Fullscreen viewing.
- Clean presentation without editor overlays.
- Camera-safe close-up framing.
- Timeline-compatible media playback.

## 13. Persian Subtitles

Support:

- Persian RTL subtitle rendering.
- Manual subtitle editing.
- Dialogue-linked subtitle timing.
- Subtitle styling.
- Configurable position.
- Line wrapping.
- Safe margins for vertical and horizontal video.
- Synchronized subtitle export.

The subtitle system must produce readable text in exported videos.

## 14. Video Rendering and Export

The final system must export complete videos containing:

- Animated 3D scenes.
- Character movements.
- Facial expressions.
- Lip sync.
- Camera transitions.
- Educational presentations.
- Dialogue and other audio.
- Persian subtitles.

### Required Export Features

- MP4 format.
- Audio/video synchronization.
- Landscape 16:9.
- Portrait 9:16.
- Configurable resolution.
- Configurable frame rate.
- Export progress feedback.
- Error handling.
- Deterministic frame rendering.

Final output must not include:

- Transform gizmos.
- Selection boxes.
- Debug lines.
- Editor handles.
- Unnecessary interface elements.

## 15. Professional UI/UX

Preserve the established product design:

- Persian RTL interface.
- Professional dark theme.
- Turquoise accent colors.
- Consistent typography.
- Compact editing panels.
- Large 3D viewport.
- Fullscreen preview.
- Accessible tools.
- Clear tooltips.
- Responsive layout.
- Beginner-friendly workflows.

Avoid disruptive interface redesigns.

Prioritize usability over visual decoration.

## 16. Performance

Target integrated AMD Radeon graphics.

Requirements:

- Efficient geometry and materials.
- Demand-based rendering where compatible.
- Controlled WebGL resource usage.
- Avoid unnecessary render loops.
- Avoid excessive React re-renders.
- Reusable animation evaluation.
- Safe resource cleanup.
- Responsive editor interactions.

Video export performance must be evaluated independently from preview performance.

## 17. Initial End-to-End MVP Video Milestone

Before advanced visual polishing, the application must demonstrate one complete 15-second animated video.

### Scene 1 — 0–5 seconds

Kamyar speaks.

The production camera focuses on Kamyar.

Other characters may react.

### Scene 2 — 5–10 seconds

Claude responds.

Kamyar looks toward Claude.

The camera switches to Claude.

### Scene 3 — 10–15 seconds

An educational whiteboard displays a concept.

The camera focuses on the presentation.

A character points toward the content where supported.

### Required MVP Result

- Three functional scenes.
- Synchronized dialogue audio.
- Basic character animation.
- Camera switching.
- Educational content.
- Persian subtitles.
- Downloadable MP4 video.

Target output: 1080×1920 at 30 FPS, subject to rendering performance and supported export capabilities.

This is a future acceptance milestone, not a currently implemented feature.

## 18. Open Animation Defects

The following issues remain unresolved until manual browser verification:

- BUG-0024: Insufficient emotional expression clarity, facial movement, and reaction energy.
- BUG-0029: Limited hand and arm gestures.
- BUG-0030: Thinking animation lacks meaningful physical gestures.

Additional known limitations:

- Natural laughing and smiling require better mouth animation.
- Angry expressions require more visible eyebrow behavior.
- Human procedural models have limited facial rigging.
- Automatic audio-driven reactions are not yet implemented.
- Timeline-driven acting and complete video export remain future work.

Do not silently mark these issues resolved.

## 19. Development Principles

1. Reuse existing systems before creating new ones.
2. Keep data and rendering responsibilities separate.
3. Preserve stable IDs and backward compatibility.
4. Maintain independent character animation state.
5. Separate editor-only and production-rendering functionality.
6. Preserve deterministic time-based evaluation.
7. Support manual creative control.
8. Do not claim unverified visual behavior.
9. Keep documentation consistent with implementation.
10. Prioritize a complete production workflow over unnecessary cosmetic refinements.

## 20. Documentation Policy

This document defines target product requirements.

It does not indicate that every requirement has been implemented.

Use:

- ROADMAP.md for development order.
- ARCHITECTURE.md for implementation design.
- DATA_MODELS.md for persisted schemas.
- BEHAVIOR_SYSTEM.md for animation and behavior specifications.
- BUG_TRACKER.md for unresolved defects.
- PROGRESS_CHECKLIST.md for implementation and acceptance status.

Update these files as development progresses.

Never treat planned capabilities as completed functionality.
