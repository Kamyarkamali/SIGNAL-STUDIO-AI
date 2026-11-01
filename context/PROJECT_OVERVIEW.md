# Signal Studio AI — Project Overview

**Project Name:** Signal Studio AI

**Project Type:** Web-Based 3D Animation Production Studio

**Primary Language:** Persian (fa-IR)

**Development Status:** Phase 03-C implementation; browser acceptance pending

**Version:** 0.1.0 — Planning

## 1. Product Vision

Signal Studio AI is a web-based, scene-oriented 3D animation creation platform.

The platform enables users to produce animated videos using customizable 3D characters, environments, recorded dialogue, character reactions, camera movements, and scene-based storytelling.

The application combines manual animation direction with optional AI-assisted features.

Users must be able to produce new animated episodes without modifying the application's source code.

## 2. Target Users

- YouTube content creators.
- Podcast creators.
- Beginner animation creators.
- Developers creating educational videos.
- Content creators who want to animate conversations between humans and AI characters.

The application must remain understandable to users without programming or professional animation experience.

## 3. Core Product Capabilities

### 3.1 Project Management

- Create, rename, duplicate and delete projects.
- Save and reopen previous projects.
- Organize multiple animation episodes.
- Preserve project settings and assets.

### 3.2 Character Management

- Create characters with custom names.
- Select different 3D character models.
- Customize supported facial features, hairstyles, clothing and colors.
- Add or remove characters from individual scenes.
- Control character position, rotation, scale and visibility.
- Reuse characters across multiple projects and scenes.

### 3.3 Environment Management

- Maintain a reusable library of 3D environments.
- Select an environment for each scene.
- Add new supported environments.
- Customize supported lighting and environmental settings.
- Reuse existing environments without rebuilding them.

### 3.4 Scene and Storyboard Management

- Create multiple scenes within a project.
- Set individual scene durations.
- Reorder scenes using drag and drop.
- Assign characters and environments to scenes.
- Define scene transitions.
- Write scripts and directing notes.
- Preview individual scenes or the entire episode.

### 3.5 Audio and Dialogue

- Upload existing audio recordings.
- Support conversations with multiple speakers.
- Define speaker intervals manually.
- Assign dialogue segments to characters.
- Support audio-only speakers.
- Edit dialogue timing.
- Synchronize audio with visual animations.
- Keep dialogue metadata independent from original audio files.

### 3.6 Character Animation

- Facial expressions.
- Talking and listening animations.
- Mouth movements synchronized with active speech.
- Eye movement and blinking.
- Head movement and gaze direction.
- Body and hand gestures.
- Emotional reactions.
- Customizable reaction timing and intensity.

### 3.7 Camera and Directing

- Multiple camera presets.
- Scene-specific camera configuration.
- Manual camera positioning.
- Animated camera transitions.
- Timeline-controlled camera events.
- Fullscreen preview.
- Click-to-play/pause interaction.
- Future user-defined and fixed shots, optional speaker-following, over-the-shoulder and display close-up views, with independent 16:9 and 9:16 framing.

### 3.7.1 Educational Display Media (future)

- Upload local programming screenshots/images and supported educational videos for laptop, monitor and digital display surfaces.
- Select image, video or screen-off states repeatedly within a scene; screen-off preserves the chosen asset for later reuse.
- Schedule display changes and camera changes independently on the timeline. Camera cuts or movements must not reset display playback.
- Use one deterministic project-time mapping for source-video frames in seeking, preview and final export.

### 3.8 Timeline Editor

- Visual multi-track timeline.
- Audio tracks.
- Dialogue and speaker tracks.
- Character animation tracks.
- Camera tracks.
- Scene transitions.
- Precise seeking and playback controls.
- Editable timeline events.

### 3.9 AI-Assisted Direction

The future AI Director should be able to suggest:

- Character reactions.
- Emotional expressions.
- Gestures.
- Gaze targets.
- Camera angles.
- Scene direction.

AI-generated suggestions must be editable, reversible and subject to user approval.

AI must never silently overwrite manual editing decisions.

### 3.10 Video Rendering and Export

- Deterministic frame-by-frame animation.
- Scene-based and full-episode rendering.
- Original audio synchronization.
- Configurable resolution and frame rate.
- MP4 export where technically supported.
- Render progress and cancellation.

Video rendering must not depend on real-time screen recording.

## 4. User Experience Requirements

- Fully Persian interface.
- RTL editor layout.
- LTR timeline time axis.
- Clear and organized navigation.
- Beginner-friendly workflows.
- Contextual help for major tools.
- Large 3D preview area.
- Consistent and accessible controls.
- No decorative or nonfunctional buttons.
- Responsive layout.
- Manual control over all essential animation settings.

## 5. Product Principles

1. Build features incrementally.
2. Prioritize working functionality over feature quantity.
3. Keep character identity, 3D models and scene instances separate.
4. Keep environments independent from scenes.
5. Use reusable assets and animation systems.
6. Preserve manual control over AI suggestions.
7. Ensure that preview and final rendering follow consistent animation timing.
8. Avoid modifying unrelated systems during feature development.
9. Validate features before marking them complete.
10. Maintain project documentation throughout development.

## 6. Initial Use Case

The first production example will feature:

- Kamyar: a stylized developer with dark hair, a short beard and a black hoodie.
- ChatGPT: a small, cute AI robot with an expressive digital face.
- An existing podcast studio environment.
- A Persian conversation about React, Next.js and AI assistance.

These characters and this environment are initial examples, not hardcoded limitations of the platform.

**Future programming-tutorial workflow:** Kamyar and ChatGPT converse in the studio; Kamyar introduces code; an over-the-shoulder shot reveals a laptop showing an uploaded VS Code screenshot or tutorial video; dialogue and display media remain synchronized; the camera returns to a chosen studio shot; a later phase exports the synchronized episode. This workflow is planned, not implemented in Phase 03-B.

## 7. Project Scope

The final vision includes all capabilities described above.

However, development will follow independently testable phases.

The initial implementation must focus on reusable project data, asset management, scene rendering and character management.

Advanced facial animation, AI directing, and offline video rendering will be implemented in later phases.

No planned feature should be described as already implemented.

## 8. Success Criteria

The product will be successful when a beginner can create a new project, select characters and environments, upload a dialogue recording, assign speakers, configure scenes and reactions, preview the animation, and export a synchronized video without writing code.

## Multi-Environment Support

Signal Studio AI must support a reusable library of multiple real 3D environments.

The product must not be limited to a single podcast studio environment.

Initial environment targets should include:

- Podcast Studio
- Open Outdoor Space
- Office / Company Workspace

Future environments may include:

- Classroom
- Conference Room
- Bedroom Studio
- Tech Lab
- Cafe
- Custom user-created environments

Users must be able to select an environment for each scene.

Different scenes in the same project may use different environments.

Each environment may provide its own:

- Visual style
- Lighting setup
- Default props
- Camera anchor suggestions
- Supported customization options

Environment switching must not break character definitions, audio assignments, dialogue timing, or scene structure.

Only real available environments should be shown as selectable options in the user interface.

The architecture must remain extensible so additional environments can be added in future phases without requiring a rewrite of the scene system.
