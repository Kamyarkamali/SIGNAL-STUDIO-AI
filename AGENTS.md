# Signal Studio AI — Instructions for Codex and Coding Agents

## Product and scope

This is a **local-only, single-user, Persian RTL** 3D animation editor for Windows. The project is being rebuilt from scratch. Historical prototype features are **not implemented** in this new project unless confirmed by current code and tests.

## Required reading — before any code change

1. `context/PROJECT_OVERVIEW.md` — product and scope
2. `context/ROADMAP.md` — authorized phase and acceptance criteria
3. `context/PROGRESS_CHECKLIST.md` — actual verified progress
4. `context/ARCHITECTURE.md` and `context/DATA_MODELS.md` — boundaries and contracts
5. `context/TECH_STACK.md` and `context/CODING_STANDARDS.md` — selected stack and quality rules
6. `context/UI_UX_GUIDELINES.md` — interface interactions
7. `context/BEHAVIOR_SYSTEM.md` — authoritative behavior priorities
8. `context/CHARACTERS_AND_AUDIO_REQUIREMENTS.md` — identity, presence, and speaker assignment
9. `context/DECISIONS.md` and `context/BUG_TRACKER.md` — decisions and known issues

If a referenced file is missing or contradictory, describe the problem. Never invent its contents. Prefer the approved ADR for resolved design decisions; ask for approval before changing approved scope.

## Non-negotiable execution rules

- **Do not implement a future phase without an explicit request.** The user must authorize the current phase.
- Start by reading code and documenting a small implementation plan scoped to that phase. Then implement and verify, rather than stopping at the plan.
- No unrelated feature expansion, fake buttons, phantom environment choices, or nonfunctional settings.
- Keep the app local; do not add authentication, paid APIs, public server exposure, or cloud dependencies without approval.
- Preserve user data and working features. Never erase projects to fix a bug.
- Treat model assets, reusable character definitions, scene instances, and audio speaker identities as separate concepts with stable IDs.
- A new library character is **not** a visible scene instance until explicitly added and rendered.
- A speaker is assigned through timed data, never guessed from audio volume. Hidden/audio-only speakers must not animate other mouths.
- Use layered, capability-aware behavior and per-property priority resolution from `BEHAVIOR_SYSTEM.md`.
- Keep animation state deterministic at arbitrary timeline positions; live preview and final export must share evaluation logic.
- Use optimized modular TypeScript and cleanup for GPU/audio resources. Avoid huge coupled files and frequent React rerenders during playback.
- All visible labels/help/errors are in natural Persian. App layout is RTL; timeline ruler and waveform time flow LTR.
- No unsupported animation option may appear as functional. Avoid creating arbitrary low-quality environment/model placeholders to populate menus.

## Milestone acceptance and progression

Track three distinct outcomes:

1. **MVP/prototype acceptance:** Explicit user approval accepts a milestone for the stated MVP/prototype use. It may authorize the next explicitly approved development milestone while noncritical browser, visual, or GPU verification debt remains, provided there is no known critical functional or data-integrity blocker. Record the scope and date of the approval; do not describe it as production acceptance.
2. **Functional verification:** Track each required behavior and test separately. Keep unverified checklist items unchecked; passing automated tests do not establish browser behavior. Preserve reported PASS/FAIL totals and individual outcomes exactly.
3. **Production-quality acceptance:** Requires the phase's mandatory functional checks, visual quality review, persistence/regression checks, and relevant browser/device/performance evidence. MVP approval does not waive these requirements.

Stop progression for a confirmed critical blocker, including data loss/corruption, broken persistence, security exposure, incompatible schema/data migration, or a critical functional defect that prevents the authorized dependent work. A `FIXED_UNVERIFIED` issue is verification debt unless evidence shows it is still broken or it blocks the next milestone; keep its severity and open verification record visible. An MVP handoff does not authorize unrelated phases: the user must explicitly authorize the next work.

## Testing and evidence

- Run the tests appropriate to changed functionality; at minimum run typecheck, lint, build when configured, plus relevant unit tests.
- For interactive behavior, attempt browser testing; build success or HTTP 200 does **not** equal functional verification.
- Report `IMPLEMENTED`, `VERIFIED`, `UNVERIFIED`, and `BLOCKED` accurately. Do not claim visual tests without a real browser/viewport check.
- Include regression coverage for new bugs. Historical failures are listed as regression risks in `BUG_TRACKER.md`.
- Never invent performance measurements, render outputs, test results, or browser evidence.

## Documentation updates after each authorized phase

1. Update `context/PROGRESS_CHECKLIST.md`; `[x]` means completed **and** adequately verified.
2. Update `context/BUG_TRACKER.md` with new/reproduced defects and verification status.
3. Update `context/DECISIONS.md` if a technical decision changes; record trade-offs.
4. Update other context documents only if contracts or scope actually changed.
5. Give a final concise report: phase, files changed, features delivered, tests run, what remains unverified, next recommended task.

## Current default

**Phase 00: planning/documentation. No application code or dependency installation unless the user explicitly starts a development phase.**

