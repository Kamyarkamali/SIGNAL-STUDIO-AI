# Signal Studio AI — Next Session Handoff

## Status: Work in Progress

The latest development session was stopped due to limited Codex tokens. Some features may be incomplete or unverified.

## Last Known Stable Checkpoint

- Left navigation and contextual inspector redesigned.
- Six Persian workspaces implemented.
- Audio drag-and-drop, timeline editing, playback and persistence implemented.
- Previous verification: 191/191 unit tests and 4/4 Playwright tests passed.

These results predate the latest character behavior changes.

## Current Unfinished Work

Audio-synchronized character behavior sequencing.

Latest reported progress:

- Added regression coverage for speaker changes at frame boundaries.
- Added coverage for muted audio and audio-only voices.
- Added coverage for scene visibility and moved/trimmed clips.
- Added coverage for manual action priority and save/reload.
- Fixed missing registration of the `speaking` facial expression preset.

## Verification Still Required

- Run all unit and browser tests after the recent changes.
- Verify the two-character workflow in Chrome.
- Confirm speaking and listening animation.
- Confirm characters look toward each other.
- Inspect facial, head, arm, and hand movements.
- Verify pause, resume, seeking, speaker changes and reload.
- Check BUG-0024, BUG-0029 and BUG-0030.
- Confirm that existing audio workflows remain functional.

## Next Session Instructions

1. Read this file first.
2. Review `git status` and recent commits.
3. Inspect the latest changes before editing any files.
4. Run focused tests for character behavior evaluation.
5. Continue Chrome visual verification.
6. Fix confirmed defects without rebuilding existing animation systems.
7. Update this handoff after verification.

## Next Planned Feature

Smart Camera Director — camera direction based on active speaker, character behavior, and timeline events.

Do not begin this feature until audio-driven behavior sequencing is verified.

## Important

Do not assume incomplete features are finished.

Preserve existing project data, persistence contracts, audio playback, timeline coordinates, and animation events.
