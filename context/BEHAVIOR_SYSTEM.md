# Character, Scene and Environment Properties — Behavior Priority System

## 1. Core Requirement

Signal Studio AI must support configurable properties, behaviors, and animation capabilities for characters, scenes, and environments.

Users must be able to select, configure, schedule, enable, disable, and prioritize supported behaviors directly through the application's graphical interface.

The behavior system must be data-driven and reusable across multiple animation projects.

## 2. Character Properties and Behaviors

Each character may define:

- Appearance properties.
- Personality and behavioral presets.
- Default idle animations.
- Speaking behaviors.
- Listening behaviors.
- Facial expressions.
- Eye and head movement.
- Hand and body gestures.
- Gaze targets.
- Emotional reactions.
- Supported animation capabilities.

Users must be able to override default behavior settings for individual scenes or timeline events.

Only behaviors supported by the selected character model should be available for execution.

## 3. Scene Properties and Behaviors

Each scene must support configurable:

- Character presence and visibility.
- Character positioning and orientation.
- Camera behavior.
- Lighting changes.
- Environment settings.
- Scene transitions.
- Scripted animation events.
- Dialogue-driven reactions.
- Timing and behavior priorities.

Scene-specific settings must not unintentionally modify shared character or environment definitions.

## 4. Environment Properties and Behaviors

Environment definitions may support:

- Lighting presets.
- Ambient effects.
- Animated props.
- Background animations.
- Time-of-day settings.
- Weather effects where supported.
- Interactive or scripted environment events.

Users must be able to configure supported environment behaviors independently for each scene.

Do not expose unavailable effects as working features.

## 5. Behavior Priority System

The animation engine must support configurable behavior priorities.

Default priority order:

1. Manual director overrides.
2. User-approved AI-generated actions.
3. Automatic dialogue-driven behaviors.
4. Default idle behaviors.

The application must allow users to adjust priorities within safe, compatible rules.

A higher-priority behavior overrides a lower-priority behavior only when both control the same animation property or conflicting animation layer.

Independent compatible behaviors must be allowed to run simultaneously.

For example, a character should be able to:

- Speak.
- Smile.
- Look toward another character.
- Move its hands.

All at the same time when the character model supports these actions.

## 6. Animation Layers

Behaviors must be organized into independent animation layers, such as:

- Mouth and speech.
- Eyes and blinking.
- Head and gaze.
- Facial emotions.
- Arms and gestures.
- Body posture.
- Character positioning.
- Character visibility.
- Camera control.
- Environment effects.

Each behavior event must define its affected layers or properties.

Conflicts must be resolved per layer rather than globally.

## Gaze and Character Interaction System

Signal Studio AI must support a configurable gaze and interaction system for characters.

Characters must be able to direct their attention toward:

- Another character
- The camera
- A scene prop or object
- A fixed world position
- A neutral or idle direction

### Supported Gaze Behaviors

The system should support:

- One-way gaze  
  Example: Kamyar looks at ChatGPT.

- Mutual gaze  
  Example: Kamyar looks at ChatGPT while ChatGPT looks at Kamyar.

- Group gaze  
  Example: a third character looks at Kamyar and ChatGPT while they are talking.

- Speaker-listener gaze  
  Example: the active speaker looks at another character or toward the audience, while listeners look at the speaker.

- Camera gaze  
  Example: one or more characters look directly at the camera.

- Prop-directed gaze  
  Example: a character looks at a laptop, whiteboard, microphone, or another object in the scene.

### Simultaneous Multi-Character Gaze

Multiple characters must be able to perform gaze behaviors at the same time.

Examples:

- Kamyar looks at ChatGPT.
- ChatGPT looks at Kamyar.
- A third character looks at both of them in sequence or according to a selected target.
- Two or more characters look at the camera at the same time.

The behavior system must support these interactions without breaking other active behaviors such as speaking, blinking, smiling, or hand gestures.

### Gaze Control Layers

Gaze behavior should be evaluated through separate controllable layers, such as:

- Eye direction
- Head direction
- Upper-body orientation where supported

Body orientation must remain independent from eye and head gaze unless an explicit behavior links them together.

### Gaze Priority

Gaze behavior must follow the general behavior priority system.

Example default gaze priority:

1. Manual director gaze events
2. User-approved AI-generated gaze events
3. Dialogue-driven automatic gaze
4. Default idle gaze behavior

### Future target and rotation contract (planning only)

The future target type must support another character by stable instance ID, the production camera, the active laptop/display surface, a scene prop by stable instance ID, a world-space point, a point behind the character, a custom direction vector, and a neutral direction. Gaze direction is independent from production-camera direction. Model adapters may divide a gaze target across eyes, head and upper body; each layer remains independently capability-gated and manual director overrides win only on the same layer. Missing/deleted targets resolve to a defined neutral direction rather than a stale transform. No automatic gaze tracking or target evaluation is implemented by this Phase 04-B2 work.

### Future facial behavior layers (Phase 04-C and later; not implemented here)

Static expression presets are configuration applied directly to supported model components. Future natural behavior requires deterministic, time-evaluable blink, expression transitions, eye/head movement, speaking mouth shapes, listening reactions and emotion changes. Mouth/speech, eyes/blink, head/gaze, facial emotion, arms and posture remain separate layers; explicit director events override lower-priority behaviors only for properties they actually control. Lip sync and automatic reactions remain unsupported until their own phase, capability checks and tests are complete.

### Future character POV camera (planning only)

Models may declare a local first-person camera anchor near eye level and a canonical local forward direction. Editor-only POV inspection must keep camera state separate from the editor orbit camera and any production camera state. A future controller may support forward/side/back direction, target look-at, per-model position/rotation offsets, configurable FOV and safe clipping/occlusion limits. Timeline-driven POV moves must use deterministic camera evaluation and manual director priority when camera authoring is approved; this document does not enable POV controls or Phase 09 work.

A higher-priority gaze behavior overrides a lower-priority gaze behavior only for the affected gaze layers.

### Timing and Scheduling

Gaze behaviors must support:

- Start time
- Duration
- Blend-in
- Blend-out
- Priority
- Target selection
- Optional target switching
- Optional intensity or weighting

Users must be able to schedule gaze events on the timeline.

### Target Resolution

A gaze target may refer to:

- A character instance
- A character definition where resolvable to a visible instance
- The active production camera
- A prop instance
- A fixed world-space coordinate
- A predefined scene anchor

If a target becomes invalid, hidden, or unavailable, the system must safely fall back to a neutral direction or another defined fallback target.

### Beginner-Friendly UI Requirements

The Persian interface should provide simple controls for gaze behaviors, such as:

- "نگاه به"
- "نگاه به دوربین"
- "نگاه به شخصیت"
- "نگاه به وسیله"
- "نگاه دوطرفه"
- "هدف نگاه"
- "مدت نگاه"
- "اولویت نگاه"

Advanced controls for blending and layered targeting may remain optional.

### Acceptance Criteria

This capability is complete only when:

1. A character can look at another character.
2. Two characters can look at each other simultaneously.
3. A character can look at the camera.
4. A character can look at a prop or scene object.
5. Multiple characters can perform gaze behaviors at the same time.
6. Gaze behavior can coexist with speaking and other compatible behaviors.
7. Gaze events can be scheduled on the timeline.
8. Invalid or missing targets are handled safely.
9. Gaze behavior persists after saving and reopening the project.
10. Preview and offline rendering produce consistent gaze behavior.

## 7. Timeline Scheduling

Every behavior event should support:

- Unique event ID.
- Target entity ID.
- Behavior type.
- Start time.
- Duration.
- Priority.
- Intensity.
- Blend-in duration.
- Blend-out duration.
- Enabled/disabled state.
- Optional parameters.

Users must be able to reorder behavior priorities and edit event timing.

Changes must immediately affect the preview and remain persistent after saving.

## 8. Beginner-Friendly Behavior Editor

The Persian interface must provide:

- A list of available behaviors.
- A description of each behavior.
- Animation capability indicators.
- Priority controls.
- Timeline scheduling.
- Preview behavior.
- Enable/disable controls.
- Reset to default settings.

Use clear Persian terms such as:

- "رفتارها"
- "اولویت رفتار"
- "حرکت پیش‌فرض"
- "واکنش خودکار"
- "دستور دستی"
- "پیش‌نمایش رفتار"

Advanced blending and layer controls should remain optional.

## 9. Deterministic Behavior Evaluation

Behavior priority resolution must be deterministic.

For the same project data and frame number, the engine must produce the same evaluated animation state.

Do not rely on uncontrolled randomness, wall-clock timing, or previous frame execution.

Behavior precedence and conflict resolution must be testable independently from Three.js rendering.

## 10. Acceptance Criteria

This capability is complete only when:

1. Characters can have configurable default behaviors.
2. Scenes can override character behavior settings.
3. Supported environment behaviors can be configured.
4. Users can schedule behavior events.
5. Users can change behavior priorities.
6. Compatible animations can run simultaneously.
7. Conflicting behaviors are resolved predictably.
8. Changes are visible in the 3D preview.
9. Behavior configurations persist across sessions.
10. Preview and offline rendering produce consistent behavior.

These requirements define the product architecture and must be implemented incrementally according to the approved roadmap.

Do not implement the entire behavior system during the initial project setup.

### Natural Listener Reactions

Characters must support natural listening behaviors, including:

- Looking toward the speaker
- Blinking
- Subtle head nodding
- Smiling
- Concern and empathy
- Surprise
- Thoughtful expressions
- Neutral listening
- Supported hand and body gestures

Multiple characters may listen and react simultaneously.

Listener reactions must not accidentally trigger speaking
or mouth animations.

Reactions must respect character model capabilities.

Users must be able to enable, disable, prioritize,
and schedule listener reactions.

Manual director events override conflicting automatic reactions.

Camera focus must remain independent from listener behavior.

## Phase 04-C1 implemented: deterministic manual pose preview

The editor now supports transient `neutral`, `head-turn`, `head-nod`, `arm-gesture`, and `return-idle` preview actions. The shared pure evaluator takes an explicit source timestamp and duration, clamps motion to conservative local rotation ranges, and returns the same pose for the same action/configuration/time regardless of evaluation order. Preview is keyed by character instance ID; stop resets named local pivots and return-to-idle blends the current transient pose back to neutral. The editor schedules demand renders only while playback runs and cancels its frame callback on completion or teardown.

Preview availability is capability-based. Current procedural renderers declare head rotation only where a `head-pivot` exists and arm gestures only where shoulder-centered arm pivots exist. Claude has no arm gesture. GLB skeletons, morph targets and clips are inspected by the import adapter, but no imported animation preview is exposed yet because the current renderer has no deterministic clip adapter. No model currently claims facial expressions, eye gaze, mouth control, lip sync, standing/sitting transitions or a full rig. This is a limited preview foundation, not the complete layered behavior engine.

## Phase 04-C2 implemented: expressive manual preview

The preview action catalog now includes quick/thoughtful nods, head shake/tilt, wave, explanation, and emotional presets (neutral, happy, excited, surprised, sad, angry, worried, confused, thinking, listening and laughing). Presets combine only declared channels. A named-node adapter applies face configurations to ChatGPT and Claude digital features and to the existing procedural eye, brow and mouth components on Kamyar and Hamid. This limited human adapter does not provide jaw/cheek topology deformation or full facial rigging; imported GLBs remain unsupported.

Playback settings are transient and bounded: speed 0.5–2x, intensity 0.25–1.5x, transition 0.08–0.8 seconds, return 0.15–1.5 seconds, and four easing curves. The evaluator remains stateless at explicit timestamps. Facial controls use deterministic attack/release weights and preview-only deterministic blinks; surprise and excitement use shorter category-specific attack envelopes and stronger bounded head/arm poses while calm actions retain the configured transition. Named renderer nodes for supported models receive expression transforms and mouth-shape visibility, while gaze remains on its independent channel. The human face controls are limited to current components; there is no jaw/cheek deformation or GLB adapter. The UI currently plays one coordinated preset at a time. No speaker/listener automation, lip sync, timeline scheduling or video export is implemented. User rejected the prior visible result; this recovery is not visually verified and all three C2 defects remain open.

## Future behavior and production architecture (planned)

### Phase 04-C3 implemented: manual gaze and attention preview

Gaze is an independent transient channel keyed by character instance ID. The pure evaluator accepts explicit source time, eases between a captured local gaze pose and the resolved target direction, and clamps model-supported head, eye and torso outputs. Runtime target resolution reads the current scene graph: character head pivots, a prop's transformed bounds (the laptop's actual display surface), the active editor camera or an authored world point. Manual directions are character-local. Hidden/deleted/unavailable targets return to neutral safely. The editor/production camera and persisted character root transform are not changed.

Capabilities require both model declarations and actual named pivots. Current models support head rotation; ChatGPT additionally exposes separate iris translation for eye direction. Human and Claude models do not claim eye motion, no current model exposes torso motion, and GLBs remain unsupported until their named rig nodes can be driven. Attention/listening options are manual previews only, not speaker detection or automatic reactions. Gaze can coexist with head/arm previews while leaving face-expression channels untouched. No gaze state is persisted; future authored gaze events must use stable IDs and the common scene-time clock.

The production direction is synchronized audio and dialogue, a deterministic timeline, educational presentation, cinematic camera, subtitles and MP4 export. Future serializable events should address character instances and props by stable IDs; audio speaker intervals, listener state, gaze targets, expressions, gestures, camera direction and prop attachment events remain separate channels evaluated at one scene timestamp/frame. Resolve per-property priorities and manual director overrides deterministically, and keep editor preview state, audio playback clocks, editor camera and production camera independent. Planned gaze targets include characters, camera, laptop/display, props, world-space points, behind-character and custom directions. Planned audio includes recorded tracks, speaker assignments, time ranges and authored viseme channels. Planned cameras include wide/group/close-up/POV shots, landscape and portrait framing and optional depth of field. Planned teaching interactions include hand attachments, pick-up/release events, presentation props and standing positions. These are architecture notes only; no automatic gaze, reaction, audio, lip sync, camera automation, timeline, prop animation or export is implemented here.

## Natural character acting requirements (future; not implemented)

This section defines targets for a future reusable acting library. It does not claim current presets, models or rigs support these actions. Model capability declarations must reflect real controllable renderer/asset channels; unsupported actions must not be presented as functional.

### Acting states and action library

Target states are neutral, happy, excited, laughing, sad, angry, worried, afraid, surprised, confused, thinking, curious, embarrassed, frustrated, agreeing, disagreeing, listening, speaking and celebrating.

Target body and hand actions are hand-to-chin thinking; pointing to a person/object; open-hand explanation; waving; thumbs-up; nodding; head shaking; shrugging; folding arms; resting hands on the desk; leaning forward/back; looking away thoughtfully; sitting/standing; and holding compatible educational props. Filter actions by model capability. Meaningful hand-to-chin movement requires controllable arm/shoulder, elbow, wrist and hand joints; head tilt alone does not satisfy it.

### Acting channels and composition

The final system must keep facial expression, gaze, head, torso, arms, hands and posture independently addressable, then coordinate compatible channels into complete performances. Per-model adapters must declare supported controls and safe joint limits. Composition must define blending, per-property priority, interruption, manual overrides and smooth transitions/recovery. Higher-priority behavior owns only the properties it controls; facial actions must not silently replace gaze or manual poses on other channels.

Evaluation must be deterministic from explicit scene timestamps, support arbitrary-time seeking and be shared by preview and future frame export. Multiple character instances must act independently and simultaneously. Future speech-driven lip sync/listener reactions and interaction with laptops, whiteboards, microphones, phones and other props must use stable IDs and synchronized scene time. Preview poses must preserve saved character world transforms. Runtime costs must remain suitable for integrated AMD Radeon graphics with multiple active characters.

### Current capability limits and visual acceptance

ChatGPT and Claude have stylized digital facial geometry. Kamyar and Hamid are MVP procedural human models with limited facial controls, not fully rigged humans; additional controllable geometry/rigging may be required. Imported GLBs support only channels available in their actual assets and validated by a runtime adapter. Natural hand-to-chin and other hand-specific actions require sufficient joints. Visual quality must be checked in the actual viewport from front and three-quarter views at normal podcast distance; numeric differences or automated tests alone do not prove visible quality.

The open gate includes distinguishable emotions; visible eye, eyebrow and mouth changes; distinct smiling and laughing with eye narrowing and cheek/jaw motion only where supported; appropriate anger, sadness, surprise and thinking brows; bounded energetic timing; smooth transitions; correct stop/reset; compatibility with accepted C3 gaze; unchanged saved transforms; and acceptable performance with multiple characters. BUG-0024, BUG-0029 and BUG-0030 remain open pending manual browser verification. Phase 04-C3 remains accepted for MVP based on the user's 8/8 manual result; that acceptance does not verify these acting requirements.
