# Signal Studio AI — Bug Tracker

**Path:** `context/BUG_TRACKER.md`  
**Status:** Phase 03-A through 03-E accepted; Phase 04-A accepted; overall Phase 03 remains open pending unrelated checks
**Product:** Local-only Windows 3D animation editor

## Purpose

Track reproducible defects in the **current** codebase. Do not carry bugs from the deleted prototype forward as if they have been reproduced in the new project. Those experiences are recorded separately as regression risks.

## Bug workflow

Statuses: `NEW` → `TRIAGED` → `IN_PROGRESS` → `FIXED_UNVERIFIED` → `VERIFIED` → `CLOSED`. Use `BLOCKED` when testing or fixing cannot proceed. Reopen if the issue recurs.

Severity:
- `P0`: data loss, corrupt project, security exposure, or core workflow unusable.
- `P1`: important functionality broken with no reasonable workaround.
- `P2`: partial defect or reliable workaround exists.
- `P3`: cosmetic issue or minor usability defect.

## Bugs and observations — new project

**Phase 03-C acceptance (2026-11-02):** The user explicitly accepted the committed implementation (`b2c566b`) after manual verification and authorized Phase 03-D. The report did not include separate outcomes for each interactive check listed in `PROGRESS_CHECKLIST.md`; those retain pending status. No additional defect was reported.

**Phase 03-D implementation review (2026-11-02, before user acceptance):** Studio 01 geometry and lighting were refined without changing stored prop identities or project schema. Typecheck, lint, 28/28 tests and production build passed. The computer-use inventory returned no browser or app, so source and automated tests alone could not establish rendered appearance or GPU performance. The later user report below supersedes this limit for its stated checks.

**Phase 03-D user verification (2026-11-02):** The user reported **16/16 manual acceptance checks passed**, including visual quality, furniture proportions, materials, lighting, host-facing laptop, object editing, persistence, camera behavior, performance and browser console. No new defect was reported. This verifies those reported areas despite the agent's unavailable browser; exact per-test steps, screenshots and FPS figures were not supplied. Unreported detailed and unrelated checks remain pending in `PROGRESS_CHECKLIST.md`. Phase 03-D is accepted; overall Phase 03 remains open.

**Phase 03-E implementation review (2026-11-02):** Added a schema v3 project-level display assignment model and migrations from v1/v2; managed local image/video import and byte-range media delivery; a texture plane on the laptop's actual screen surface; image contain/cover, brightness and basic video play/pause; retained media references for screen-off; and an editor-only close-up camera restore path. Automated aspect, migration, retention, upload, save/reopen and duplication tests were added. No timeline switching or cinematic camera automation was implemented.

**Phase 03-E user verification and acceptance (2026-11-03):** The user explicitly confirmed **all 13/13 manual browser acceptance tests passed** and accepted the phase. No defect was reported. The report did not enumerate individual test steps or provide screenshots, console transcript or performance measurements, so no additional evidence is claimed. Unrelated acceptance items remain open in `PROGRESS_CHECKLIST.md`.

**Phase 03-E final checks (2026-11-03):** `npm run typecheck`, `npm run lint`, `npm test` (33/33), `npm run build` and `git diff --check` passed. `.env`/`.env.local`, dependency and build caches are ignored; no project data or temporary files were included.

**Phase 03-C interactive report (2026-11-02):** The user confirmed that the dynamic prop editor works after opening an active project. No new application defect was reported. This does not establish separate results for each selection, gizmo, visibility, save/reopen, responsive, console or integrated-GPU check; those remain pending in `PROGRESS_CHECKLIST.md`. The agent's computer-use inventory exposed no browser for independent verification.

**Phase 03-C implementation review (2026-11-02):** Project schema v2 and the project-level studio prop editor passed `npm run typecheck`, `npm run lint`, `npm test` (27/27) and `npm run build` in the finalization run. Temporary-store tests covered v1 migration, backups, reopen, duplication, independent transforms and invalid-scale rejection. No new reproduced application defect was confirmed.

**Phase 03-B (2026-11-01):** The seated-use issue below was identified from source geometry and corrected. Typecheck, lint, 22/22 automated tests and the production build passed after the change. The agent's browser inventory was empty and the in-app browser was unavailable, so Studio 01 composition, object intersections, orbit/zoom, resize, GPU performance and console state are **unverified**. The existing project schema and project data were not changed.

**Final architecture review (2026-11-02):** Typecheck, lint, 24/24 automated tests and production build passed after the camera-anchor correction. Browser inventory was again empty and the in-app browser unavailable. Visual acceptance, close-up obstruction and hardware performance remain unverified. No project data or schema was changed.

**User visual acceptance (2026-11-02):** The user reported **12/12 Phase 03-B manual browser checks passed**, including studio composition, laptop facing the host, furniture layout, lighting, character placement space, orbit/zoom, 16:9 resizing, project regressions, browser console and performance. No new defect was reported. This confirms the tested visual and interaction behavior despite the agent's earlier unavailable browser. No FPS measurement, screenshot, separate 9:16 framing check, or test with real character models was supplied. Phase 03-B is accepted; Phase 03-C and overall Phase 03 remain open.

### BUG-0008 — Studio camera suggestions lacked conversation, close-up and vertical compositions

- **Status:** FIXED_UNVERIFIED · **Severity:** P2 · **Phase:** 03-B
- **Evidence:** The environment defined only `wide` and `front` poses. Neither pose identified seats or provided a vertical group/conversation suggestion. The first geometry test also exposed insufficient horizontal margin for a proposed 9:16 guest close-up.
- **Fix:** Added serializable poses for two seats, each of three seats, three-seat group, and vertical conversation/group/studio views. Added metadata referencing stable seat placement IDs, moved the wide view toward the open front, and increased guest close-up distance for vertical clearance. The editor orbit camera remains independent.
- **Regression test:** `tests/environment.test.mjs` validates pose and metadata integrity, seat references, format coverage and approximate seat clearance; all 24 tests pass.
- **Verification limit:** These are framing suggestions, not an implemented camera mode, timeline or export. The user's 12 checks did not separately cover every new production-camera suggestion or 9:16 framing. Prop occlusion with real character models remains unverified.

### BUG-0007 — Podcast seating and laptop were oriented for the viewer

- **Status:** VERIFIED · **Severity:** P2 · **Phase:** 03-B
- **Evidence:** Source geometry put the laptop screen hinge at local negative Z and keyboard at positive Z. The laptop instance had near-zero yaw while the host sat at negative Z, placing the screen nearer the host and the keyboard farther away. Both desk microphones were also near the audience edge of the desktop, beyond comfortable seated speaking distance.
- **Fix:** Rotate the laptop toward the host, align it with the host seat, move both chairs toward the usable desk edge, reposition the desktop microphones, and provide the guest with a side table and microphone. Add the host-facing display surface to the laptop geometry.
- **Regression test:** `tests/environment.test.mjs` checks keyboard/screen order, display-facing direction, desk clearance, seat alignment and microphone reach for all three seats.
- **Verification:** The user confirmed laptop orientation, furniture layout and character placement space in the 12/12 manual browser run on 2026-11-02. Seated fit with actual character models remains a later Phase 04 check; no model was added in 03-B.

**Phase 03-A acceptance (2026-11-01):** The user reported all eight manual browser checks passed: visible 3D rendering, orbit, zoom, lighting, resizing, navigation stability, project-management regression, and no new browser console errors. No new Phase 03-A application defect was reported. The earlier browser-unavailable observation applied to the agent's environment before the user-run check. Forced WebGL failure/context-loss behavior was not included in the report and remains unverified. npm reported 16 moderate dependency advisories at installation; they were not triaged in this phase. Existing Phase 01 observations retain their recorded statuses unless independently rechecked.

### BUG-0001 — Mobile preview frame could lose 16:9 ratio

- **Status:** FIXED_UNVERIFIED · **Severity:** P2 · **Phase:** 01
- **Evidence:** `.viewport-stage` declared `aspect-ratio:16/9` with a 240 px mobile minimum height; at narrow widths the minimum height overrides the ratio.
- **Fix:** Removed the conflicting minimum height, kept the guidance readable below the frame on narrow screens.
- **Verification:** Source review, typecheck, lint, test, and build passed on 2026-11-01. Actual browser dimensions remain unverified.

### BUG-0002 — Helper text was undersized

- **Status:** FIXED_UNVERIFIED · **Severity:** P3 · **Phase:** 01
- **Evidence:** Several informational labels and timeline captions used 9–11 px CSS sizes.
- **Fix:** Raised informational text to at least 12 px and improved muted-text contrast.
- **Verification:** Source review and automated checks passed on 2026-11-01; visual readability remains unverified.

### BUG-0003 — Development server modified root agent guide

- **Status:** VERIFIED · **Severity:** P2 · **Phase:** 01
- **Evidence:** `next dev` appended a generated rules block to the pre-existing root `AGENTS.md`.
- **Fix:** Restored the original guide and set `agentRules: false` in `next.config.ts`.
- **Verification:** The development server restarted after the config change; a further request did not regenerate the block on 2026-11-01.

### BUG-0004 — Browser extensions mutate the DOM before hydration

- **Status:** TRIAGED · **Severity:** P2 · **Phase:** 01
- **Evidence:** The prerendered HTML has no `translate-tooltip-mtz`, `translator-hidden`, or `cz-shortcut-listen` markup. The installed Chrome **Translator** extension (`pnpdnibdembnnlaiibkeandepjajegoi`, version 3.0.0) runs on all URLs and its `js/content.js` inserts `<div class="translate-tooltip-mtz translator-hidden">` into `document.body`. The installed **ColorZilla** extension (`bhlhnicpbhignbdhedgjhgdocnmhomnp`, version 4.1) adds `cz-shortcut-listen` to the body in `js/global-shortcut.js`.
- **Assessment:** These exact unexpected nodes and attributes originate from browser extensions. Source review found no corresponding application markup, browser-only render logic, invalid nesting, or nondeterministic initial render. No application-side fix was justified. The metadata and SSR remain intact.
- **Workaround:** In Chrome, open `chrome://extensions`, open each extension's details, and disable Translator and ColorZilla or set their site access to exclude `http://localhost` and `http://127.0.0.1`. Reload the app.
- **Verification limit:** A clean extension-free browser profile could not be run in this environment. The reported hydration warning and full console behavior remain unverified after disabling the extensions.

### BUG-0005 — Persian project names with half-space were rejected

- **Status:** VERIFIED · **Severity:** P2 · **Phase:** 02
- **Evidence:** The first project-service test rejected «ویرایش‌شده» because the validator treated U+200C as a forbidden formatting character.
- **Fix:** Permit U+200C in project names while rejecting other control/format characters.
- **Verification:** The rename and persistence tests passed after the fix on 2026-11-01.

### BUG-0006 — Legitimate browser project creation returned HTTP 403

- **Status:** VERIFIED · **Severity:** P1 · **Phase:** 02
- **Reported behavior:** `POST http://127.0.0.1:3000/api/projects` returned `403 Forbidden` from the actual application.
- **Reproduction:** On the active development server, `Host: 127.0.0.1:3000` plus `Origin: http://127.0.0.1:3000` returned `403 ORIGIN`; the equivalent script request without `Origin` returned `201`. Logging confirmed Next.js supplied `request.nextUrl.origin` as `http://localhost:3000` while the received Host and Origin were both `127.0.0.1:3000`.
- **Observed condition:** Diagnostic logging showed that the guard compared `Origin: http://127.0.0.1:3000` with `request.nextUrl.origin: http://localhost:3000` and returned 403. This conclusion is limited to the reproduced request and logged values.
- **Fix:** Validate the received Host against the localhost allowlist, then compare Origin protocol and host to that Host on write requests. Cross-origin requests remain blocked.
- **Verification:** On 2026-11-01, browser-header POSTs returned `201` when served from both `http://127.0.0.1:3000` and `http://localhost:3000`; same-origin DELETEs returned `200`. Against the `127.0.0.1` Host, POSTs from `http://evil.example` and `http://localhost:3000` returned `403 ORIGIN`. A browser-header create → save → page reload → open → rename → duplicate → delete workflow passed on port 3000, with the project count unchanged afterward. Raw HTTP Host probes rejected a mismatched port and `evil.example:3000` with `403 LOCAL_ONLY`. The user subsequently confirmed all 10 manual browser acceptance tests passed; the 403 was no longer reproducible in that workflow. `tests/request-origin.test.mjs` covers canonicalized URL, origin mismatch, local Host, and port checks.

**Phase 02 acceptance:** The user confirmed all 10 manual browser acceptance tests passed, including creation, refresh persistence, rename, duplication, deletion confirmation, save status, and Phase 01 UI regression checks. The automated suite contains 12 passing tests from the previous run; rerun results are recorded in the checklist. The temporary HTTP fixture is in ignored `.tmp/phase02-http-check`; automatic approval review rejected its recursive cleanup. Unrelated clean-profile hydration and detailed Phase 01 viewport/focus measurements remain open.

**Styling/font migration (2026-11-01):** No new application defect was confirmed by typecheck, lint, navigation test, production build, prerendered HTML inspection, and HTTP checks for all four generated font URLs. Browser appearance and hydration remain unverified. Navigation, responsive, focus, and console checks remain open in `PROGRESS_CHECKLIST.md`.

## Bug record template

### BUG-XXXX — Short descriptive title

- **Status:** NEW
- **Severity:** P1
- **Reported on:** YYYY-MM-DD
- **Phase / component:**
- **Environment:** OS, browser, app version, commit
- **Preconditions / project fixture:**
- **Steps to reproduce:**
  1. ...
  2. ...
- **Actual result:**
- **Expected result:**
- **Evidence:** screenshot, console message, log (no secrets)
- **Root cause:** unknown until established
- **Files affected:**
- **Fix summary:**
- **Regression test:** path and assertion
- **Verification:** method, run date, result, tester
- **Remaining limitation:**

## Historical regression risks — deleted prototype

These are **test scenarios**, not active bugs in the new project:

| ID | Risk / required regression test |
|---|---|
| R-01 | Adding a library character must create a visible 3D scene instance when requested. |
| R-02 | Adding or moving a character must not move the camera, furniture, or other characters. |
| R-03 | Beard, mouth, and facial parts must have correct parent transforms and work from multiple views. |
| R-04 | Scene switching, duplication, duration, and offset changes must preserve valid composition and timing. |
| R-05 | Preview click must toggle play and pause in regular and fullscreen modes. |
| R-06 | Audio deletion must persist; demo audio must never silently reload. |
| R-07 | Mixed audio must respect editable speaker intervals; unknown speakers must not default to Kamyar. |
| R-08 | Only the active visible speaker should animate its mouth; audio-only speakers remain audio-only. |
| R-09 | Reaction selection must produce visible supported animation with correct priority. |
| R-10 | Scenes, Characters, Audio, and Settings panels must expose distinct functioning controls. |
| R-11 | Camera framing and character gaze must respect transforms and head/body axes. |
| R-12 | Cut/fade and director events must either operate correctly or be visibly unavailable. |
| R-13 | Project data and imported assets must remain accessible after restart. |
| R-14 | Interactive tests must distinguish browser verification from TypeScript/lint/build success. |

## Triage and closure rules

**Phase 04-A implementation review (2026-11-02):** Added a generic development-only character renderer and project-level registry/identity/instance/state architecture. Automated coverage includes registry validation, identity-instance independence, unknown model retention, v3-to-v4 migration, and save/reopen/duplicate isolation. Interactive browser acceptance is still pending; no visual or GPU performance claim is made. See the Phase 04-A checklist in `PROGRESS_CHECKLIST.md`.

**Phase 04-A user test report (2026-11-02):** Initial report: 30 PASS, 1 FAIL, and 2 NOT VERIFIED. The failure was character renaming. The UI now has an explicit Persian rename control, Enter/blur commit, required/non-empty validation, and reverts blank input. Identity and instance IDs remain stable, shared instances display the updated identity name, and autosave persists it. Regression tests cover identity independence and save/reopen. The user subsequently confirmed **all 33/33 manual acceptance tests passed**, including rename, scaling/persistence, and Persian panel usability; the user explicitly accepted Phase 04-A. This resolves the reported rename defect and closes the two previously unverified tests. Individual results for the first 30 tests were not itemized; no additional per-test detail is inferred.

**Phase 04-A scaling review (2026-11-02):** Numeric scale input enforces the schema-supported range 0.05–20; transform-gizmo commits clamp scale to the same range. Automated tests verify independent scale state, bounds, and persistence after reopening. The user confirmed browser-visible scaling and persistence in the final 33/33 acceptance report. Final automated checks are recorded in the checklist and commit handoff.

1. Reproduce before labeling a new-project issue confirmed.
2. Fix root cause; add a targeted regression test.
3. Run relevant unit/integration checks and browser tests for interactive changes.
4. `FIXED_UNVERIFIED` is **not** `VERIFIED`.
5. Update `PROGRESS_CHECKLIST.md` only after the corresponding acceptance evidence exists.
6. Never erase bug history; mark closed with evidence.
