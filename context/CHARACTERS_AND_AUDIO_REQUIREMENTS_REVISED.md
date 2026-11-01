# Signal Studio AI — Character, Environment Creation & Audio Requirements

**Destination:** `context/CHARACTERS_AND_AUDIO_REQUIREMENTS.md`  
**Status:** Product requirements — not implemented  
**Platform:** Local single-user Windows application  
**UI language:** Persian (`fa-IR`), RTL; timeline time axis LTR

> This document consolidates the character, character-presence, character-customization, asset-creation, and audio/speaker requirements. It describes intended behavior, not completed functionality. Implementation must follow the approved roadmap.

## 1. Purpose and scope

Users must be able to build animated episodes without editing application source code: choose or customize characters, place them in scenes, upload recordings, assign each spoken interval to the correct speaker, and preview synchronized responses. The same entities must be reusable across projects.

Keep these concepts distinct:

- **Model preset / model asset:** a reusable 3D geometry/rig and its capabilities.
- **Character definition:** a named identity referencing a model and default appearance/behavior.
- **Scene character instance:** one placement of a character in a specific scene, with its own transform, visibility, and overrides.
- **Audio asset:** an imported recording stored locally.
- **Audio clip:** placement of an audio asset on the episode/scene timeline.
- **Speaker identity:** a character or an audio-only person associated with speech intervals.
- **Speaker interval:** a timed assertion of who is speaking within an audio clip.

All persistent references must use stable IDs, never display names or temporary browser Blob URLs.

## 2. Prebuilt character library

The initial library must provide the following distinct, usable character presets:

| Preset | Intended appearance | Expected compatible capabilities |
| --- | --- | --- |
| **Kamyar** | Stylized human, dark hair, short beard correctly attached to jaw/chin, black hoodie | Supported facial, head, arm, body and speech animations |
| **ChatGPT** | Small, cute white robot with a digital face and expressive eyes/mouth | Digital face, speaking/listening, eye and body reactions |
| **Claude** | Visually distinct stylized AI mascot, proposed warm orange palette | Supported facial/body reactions and speaking behaviors |

These are artistic character interpretations, not necessarily official brand mascots. Future presets may represent Gemini, Copilot, original fictional AI characters, or additional humans. The system must not hardcode the initial three names or limit character count.

A character entry must clearly distinguish **“Save to library”** from **“Add to current scene.”** Creating a character definition alone must not be falsely presented as a visible scene character.

## 3. Character customization

Expose only properties that the selected model actually supports.

**Supported human customization, where implemented:** hair and eye colors, skin color, clothing colors, supported hairstyle/beard presets, supported outfits/accessories, display name, and default size.

**Supported robot customization, where implemented:** body and digital-face colors, illuminated accents, headphone/accessory colors, supported facial-expression presets, display name, and size.

Requirements:

- Changes must visibly affect the correct rendered model.
- Multiple characters based on the same model must retain independent appearance settings.
- The mouth and beard must be separate animatable/visual elements; beard meshes must be correctly positioned relative to the head.
- A customized character can be saved under a new name and reused across projects.
- The UI must not offer nonexistent hairstyles, rigs, or animation capabilities.
- Changing the library default and applying a **scene-specific override** must be two explicit, distinguishable actions.

## 4. Dynamic character presence and scene placement

Through the app, a user must be able to:

- Add any saved character to any scene at any point in editing.
- Remove an instance from a scene without deleting its library definition or its appearances in other scenes.
- Show/hide an instance, including visibility intervals on the timeline.
- Define entrance/exit times; later add compatible entrance/exit animations.
- Position, rotate and scale instances independently; reset transforms.
- Select characters from a list and, when supported, directly from the 3D viewport.
- Configure body facing direction separately from head/eye gaze targets.
- Keep the camera, environment props, and existing character transforms stable when adding another character.
- Save and restore scene-specific transforms and visibility after scene switching or restarting the app.

**Placement safety:** New characters must not silently spawn on top of other characters or important props. Use a sensible free spot or a clearly labeled placement mode. Do not automatically reposition other scene elements. Camera reframing requires a user action or an explicitly enabled automatic-framing setting.

**Visibility and identity are separate:** A speaker can be hidden or off-screen while remaining audible. An audio-only speaker does not require a 3D model. A hidden speaker must not cause an unrelated visible character to mouth-sync.

### Example — visibility timeline

- 00:00–00:10: Kamyar and ChatGPT visible.
- 00:10–00:20: ChatGPT visible; Kamyar hidden.
- 00:20–00:30: Claude added to the picture.
- 00:30–00:40: Kamyar visible again.

These times are illustrative, not default project data.

## 5. Character behavior capabilities

A character model must declare the animation channels and behavior types it can actually perform (such as mouth, eyes, head/gaze, arms, body, facial expressions). Character presets may define default idle, speaking and listening behavior.

Manual scene/timeline overrides should have precedence over approved AI suggestions, automatic dialogue reactions and idle defaults **when they conflict on the same channel**. Independent channels (mouth, gaze, arms, etc.) may operate simultaneously. The authoritative detailed policy is maintained in `context/BEHAVIOR_SYSTEM.md`.

A character added to a scene must not be advertised as fully animation-ready unless its required animation controls work. Missing capabilities should be labeled clearly in Persian.

## 6. Audio asset management

Users must be able to:

- Upload WAV and MP3 audio files.
- Import multiple files into one project, including separate per-character voice tracks or a mixed conversation file.
- Preview, rename in the library, replace and remove an imported audio asset.
- Place audio clips into scenes or the overall episode timeline.
- View a waveform generated from the real audio, not synthetic placeholder data.
- Set clip offset, trim start/end, gain/volume and duration, within supported boundaries.
- Persist the actual audio bytes locally and restore playback after restarting the app.

**No forced demo audio:** A new project begins without audio. Any bundled demo audio is imported only when the user explicitly selects it. Removing audio must stop playback, clear or reconcile active clip references after confirmation, and remain removed after reopening.

**Deletion safety:** If an asset is referenced by clips, warn the user and offer cancellation or a clear, explicit policy for removing/replacing those clip references. Do not silently delete dialogue metadata or user projects.

Store imported assets using validated local files/project-relative references. Do not use localStorage for large audio binaries or rely on temporary object URLs for persistence.

## 7. Manual speaker assignment

The app must provide a clear Persian waveform-based **“تعیین گوینده”** editor in which the user can map any number of intervals from an uploaded recording to a character or audio-only speaker.

For each speaker interval support:

- Stable interval ID and reference to its audio clip.
- Start and end positions in **clip-local source time** with explicit conversion to the project timeline.
- Speaker identity ID, or an explicit silent/unassigned state.
- Optional dialogue text and notes, kept separately from the source audio.
- Selection, playback of only that range, splitting, merging, dragging/resizing and numerical time editing.
- Validation of out-of-range intervals, overlaps and gaps.
- Saving and restoration of manual edits.

Illustrative mapping of a 60-second mixed recording:

| Recording time | Speaker |
| --- | --- |
| 00:00–00:04 | Kamyar |
| 00:04–00:20 | ChatGPT |
| 00:20–00:28 | Kamyar |
| 00:28–00:40 | Claude |
| 00:40–00:50 | Hamid (audio only) |
| 00:50–01:00 | ChatGPT |

**These times are examples only. Never seed them as actual recording annotations.**

### Interval conflict policy

- Use half-open intervals `[start, end)` to avoid double-activation at boundaries.
- For a single mixed mono dialogue recording, the initial manual editor treats sequential speaker assignments as non-overlapping; it must explicitly flag conflicting overlaps.
- For separate audio tracks, concurrent speech is allowed and represented by independent clips/intervals. Mouth animation can be assigned to more than one visible speaker when the project genuinely contains simultaneous voices.
- Unassigned gaps must never silently default to Kamyar or another character.
- Renaming a character must not break ID-based speaker references.

Automatic diarization is a **future optional feature**, not a substitute for the manual editor; no AI result can silently replace user corrections.

## 8. Audio-driven facial animation

During playback, the active speaker mapping selects the correct character(s). Within each assigned segment, audio amplitude or precomputed animation data may control mouth openness; amplitude does **not** identify the speaker.

Requirements:

- Human mouth geometry must be independently movable and unobstructed by the beard.
- ChatGPT/Claude digital mouth animation must occur on the facial display, not decorative chest elements.
- A visible assigned speaker may move mouth, head and compatible gesture channels.
- Listeners may blink, look toward speakers and display explicitly configured reactions without speaking mouth motion.
- An audio-only or hidden speaker remains audible without forcing a visible model to speak.
- Pausing closes/fixes speech animation appropriately; seeking updates correct active intervals without waiting for sequential playback.
- A mixed recording cannot guarantee phoneme-accurate lip sync using amplitude alone; the UI must not promise it.

For deterministic offline rendering, any amplitude-derived animation inputs must be available as reproducible time-indexed data, rather than depending on the current live AudioContext state.

## 9. Synchronization and scenes

Use one authoritative project timeline clock. Audio playback, active-speaker evaluation, visibility, mouth animation, reactions, cameras, and scene transitions must follow it.

Scene-only preview and whole-episode preview must have defined time-range behavior. Audio clips that extend beyond scene boundaries must follow an explicit trim/split/cross-scene policy rather than silently playing after the visible scene ends.

Speaker mapping references the audio source/clip, not a guessed global name. Moving/reordering scenes must preserve correct timing through explicit offsets and source-time conversion.

## 10. Character and environment creation scope

### Level 1 — Prebuilt presets and supported customization (early stages)

Select prepared characters and environments, customize supported properties, save variants and reuse them. The initial real environment is the podcast studio; do not invent low-quality alternatives to fill a menu.

### Level 2 — Compatible asset import and scene composition (dedicated later phase)

Import validated GLB/glTF assets, arrange props, lights, cameras and environment components, and save reusable composed environments. Imported character models must undergo capability checks for skeleton/rig/morph-target compatibility. Composition is not the same as advanced mesh modeling.

### Level 3 — Advanced creation (future, outside initial MVP)

Possible parametric/procedural model creation, mesh editing, rigging and optional AI-assisted asset generation. These capabilities are not committed features of the early implementation.

Keep asset creation separate from asset registration, character definitions, scene composition and animation evaluation. Imported/generated assets must go through the same validated asset registry.

## 11. Persian UI and beginner workflow

Provide distinct, discoverable panels and actions:

- **کتابخانه شخصیت‌ها:** choose/model/customize/save character definitions.
- **شخصیت‌های این سکانس:** add/remove/show/hide/transform character instances.
- **صدا:** import/replace/delete/preview audio assets and clips.
- **تعیین گوینده:** create/edit colored speaker intervals on a real waveform.
- **واکنش‌ها:** select only supported animations, with clear preview and timing.

A user must easily distinguish “created in library” from “visible in this scene.” The main viewport should update immediately after valid character/visibility edits. Use RTL panels and Persian help text, while the time ruler and waveform remain LTR.

Do not ship decorative upload, playback, reaction or scene buttons that do not perform real actions.

## 12. Verification and acceptance criteria

Treat each requirement as complete only after appropriate code, unit/integration, and manual/browser checks. Passing TypeScript, lint and build alone does not confirm rendered behavior.

Minimum acceptance checks:

1. Create two different named characters from one human preset; both can exist as separate definitions.
2. Add one to Scene 2 and confirm an actual new 3D instance appears without disrupting other objects.
3. Independently customize appearances and transforms; switch scenes and reload without losing changes.
4. Hide/remove an instance from one scene without affecting the character library or other scenes.
5. Upload a mixed WAV/MP3 conversation and create arbitrary alternating speaker assignments.
6. Select/split/resize/save intervals; gaps remain unassigned.
7. During preview, only the assigned visible speaker(s) animate their mouths, with audio-only and hidden speakers handled properly.
8. Pause, seek, scene changes and reordering preserve audio/visual synchronization.
9. Replace/delete audio and reopen the project; deleted audio does not return automatically.
10. Confirm unsupported customization/animation capabilities are not presented as working.

These are **product acceptance criteria**, not a claim that the current app has passed them.

## 13. Implementation boundaries

Implement incrementally through the approved `context/ROADMAP.md`. Do not attempt all capabilities during project scaffolding. Maintain separate authoritative specifications for:

- Product-wide scope: `context/PROJECT_OVERVIEW.md`.
- Detailed behavior priority/layers: `context/BEHAVIOR_SYSTEM.md`.
- Entity schemas and time-coordinate rules: `context/DATA_MODELS.md`.
- Architectural boundaries: `context/ARCHITECTURE.md`.

When those specifications conflict, record and resolve the decision before implementation rather than silently guessing.
