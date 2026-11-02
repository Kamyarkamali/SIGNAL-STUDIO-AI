# Signal Studio AI — Bug Tracker

**Path:** `context/BUG_TRACKER.md`  
**Status:** Phase 03-A through 03-E accepted; Phase 04-A accepted; Phase 04-B MVP/prototype handoff accepted; Phase 04-C3 MVP accepted after user-confirmed 8/8 manual tests; Phase 04-C2 visual failures remain open in BUG-0024, with arm/hand and thinking behavior tracked in BUG-0029/0030; Phase 05-A refinement implemented but not fully accepted after 12 PASS / 1 NOT VERIFIED and open BUG-0031/0032; Phase 05-B implemented with browser verification pending; BUG-0027/0028 implemented with browser verification pending; Phase 04-B and C3 production-quality checks remain separate
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

### BUG-0010 — Claude model silhouette did not match its approved cube reference

- **Status:** FIXED_UNVERIFIED · **Severity:** P2 · **Phase:** 04-B1
- **Evidence:** The registered Claude renderer used a pear-shaped body, separate animal-like head, optional pointed/rounded ears, tail, and facial geometry unlike the orange cube reference in `references/characters/claude/claude.jpg`.
- **Fix:** Replaced the renderer with a rounded orange cube head/body, independent rectangular eye and mouth groups, four short block lower limbs, and a large over-ear headset. Kept model and renderer IDs and persisted customization keys stable; their controls now affect body color, headset pad color/style, and eye color.
- **Regression coverage:** `tests/characters.test.mjs` verifies the stable renderer contract, cube geometry declaration, independent face groups, headset, limbs, and removal of animal geometry.
- **Verification:** `npm run typecheck`, `npm run lint`, `npm test` (44/44), and `npm run build` passed. The CUA browser inventory was empty. Actual studio framing, appearance from multiple views, intersections, browser console, and integrated-GPU responsiveness remain unverified; keep this issue `FIXED_UNVERIFIED` pending manual browser inspection.

### BUG-0011 — Newly added characters intersected the chair vertically

- **Status:** FIXED_UNVERIFIED · **Severity:** P2 · **Phase:** Character seating placement correction
- **Evidence:** Confirmed default instances inherited Studio 01 anchor Y=0, while the rendered chair seat surface is at local Y=0.67. Procedural models also have different lower support points.
- **Fix:** New instances remain unassigned. When the user explicitly assigns a seat, anchor surface/facing metadata and model-local contact/position/rotation offsets compute one aligned transform. Existing saved transforms are never recomputed on load; reselecting the current seat is a no-op and unassignment preserves the transform.
- **Regression coverage:** Tests cover model offsets, orientation, seat conflict prevention, manual transforms, save/reopen, unknown seat fallback, older unassigned records, and unchanged chair origins/seat height.
- **Verification:** `npm run typecheck`, `npm run lint`, `npm test` (47/47), `npm run build`, and `git diff --check` passed. No browser was available; visual fit and interactive assignment remain unverified.

### BUG-0012 — ChatGPT robot face lacked expression and chest logo

- **Status:** IMPLEMENTED_UNVERIFIED · **Severity:** P2 · **Phase:** 04-B2; manual acceptance retest failed
- **Evidence:** The user reported this as one of two failures in a 10-test run (8 passed). Inspection confirms the prior renderer did have a sourced OpenAI SVG, but it was a small mark on a shallow box plane and the smile was a thin ring; this fell short of the approved `references/characters/chatgpt/chatgpt.png` appearance.
- **Fix:** Enlarged and front-mounted the sourced SVG mark on a flat plane, replaced the thin smile ring with a filled curved smile shape, and strengthened the dark pupil/cyan eye/highlight layering. Kept the existing expression presets and model identity. User visual retest is still required; do not mark visually accepted.
- **Regression coverage:** `tests/characters.test.mjs` checks the stable model/customization contract, individual static eye/brow/mouth presets, legacy expression mappings, supported/rejected surface placements, and stable placement IDs; it also asserts the larger flat chest plane and filled smile geometry.
- **Verification:** Targeted final run: typecheck, lint, 69/69 tests and production build pass. Browser appearance, multiple-view logo alignment, tabletop/seat clearance, console behavior and integrated-Radeon performance require manual viewport inspection; do not mark visually accepted.

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

**Phase 04-B implementation review (2026-11-02):** Added model-specific procedural renderers, supported per-identity appearance controls, schema v5 and a v4 compatibility migration. Automated tests cover registry distinctions, customization validation/isolation, legacy migration and existing persistence/media/environment regressions. No browser visual review was available in this implementation pass; model fit, intersections, customization visibility/persistence, console behavior and integrated-GPU performance remain unverified. The models have no implemented facial or body rigs; this is a documented scope limitation, not a claimed animation bug.

**Phase 04-B MVP handoff reconciliation (2026-11-02):** The user explicitly approved Kamyar, ChatGPT, Claude, and Hamid for MVP/prototype use and authorized Phase 04-C1. This is not final production-quality acceptance for Kamyar or Hamid. Preserve the prior 10-check result exactly as reported: 8 PASS and 2 FAIL; the failures were ChatGPT appearance/OpenAI chest logo and main studio wall-sign customization, and the eight passes were not itemized. No later browser retest was reported, so the historical outcomes remain unchanged. Prototype approval does not verify independent identities/instances; add/remove/show/hide/selection/transforms; seating conflicts; visible customization and save/reopen; base-model replacement and compatible appearance handling; missing-model fallback; placement and prop clearance; or browser console and integrated-GPU behavior. The wall-sign failure remains recorded but is outside Phase 04-B. Review found no recorded, confirmed active P0/data-loss/persistence/security blocker. BUG-0014 remains P1 `FIXED_UNVERIFIED` and must stay visible as verification debt. Under the MVP handoff policy, scoped Phase 04-C1 work may proceed; all outstanding checks remain required for functional/production acceptance and are not marked PASS.

### BUG-0009 — Character library could not delete saved identities

- **Status:** FIXED_UNVERIFIED · **Severity:** P2 · **Phase:** Character library
- **Reported on:** 2026-11-02
- **Reported behavior:** User confirmed that the Persian character library allowed renaming and adding identities but offered no way to delete a saved identity.
- **Fix summary:** Added a distinct «حذف شخصیت» confirmation flow for project identities. The domain operation refuses deletion when scene instances still reference the identity and explains that instances must be removed separately with «حذف از صحنه». Deletion saves through the existing revision-checked project service before replacing local project state; failure leaves the library identity intact. Built-in registry definitions/shared model assets are not editable or deleted by this operation. Missing/repeated IDs are rejected safely.
- **Regression tests:** `tests/characters.test.mjs` covers successful deletion, model registry preservation, referenced-instance blocking, missing/repeated deletion, unrelated identity/instance preservation, save/reopen persistence, and existing rename/add behavior.
- **Verification:** `npm run typecheck`, `npm run lint`, `npm test` (43/43), and `npm run build` pass on 2026-11-02. No browser acceptance evidence yet.
- **Remaining limitation:** Keep this bug open as `FIXED_UNVERIFIED` until the user verifies confirmation, dependency handling, post-save list removal and refresh persistence in the browser.

### BUG-0013 — Studio prop selection immediately activated transform gizmos

- **Status:** FIXED_UNVERIFIED · **Severity:** P2 · **Area:** Studio object editing
- **Reported behavior:** A single click selected a studio prop and immediately displayed transform controls, interfering with camera navigation.
- **Fix:** Added separate temporary selection/edit state. A viewport single-click is inert for props; double-click selects and enters Move-first edit mode. The Persian environment panel provides explicit selection and Move, Rotate, Scale, finish actions; numeric fields remain available for a panel-selected prop. Empty-space click and Escape clear prop selection and exit edit mode; selecting another prop exits the former edit mode. Protected props cannot enter edit mode. OrbitControls lock only during gizmo drags and restore on release/unmount. Character viewport selection/edit remains unchanged.
- **Regression coverage:** `tests/object-edit.test.mjs` covers selection/edit transitions, protected objects, exit behavior, OrbitControls restoration and temporary state exclusion from persisted arrangement data. Existing character and arrangement tests remain in the suite.
- **Verification:** `npm run typecheck`, `npm run lint`, `npm test` (58/58), `npm run build`, and `git diff --check` pass. Browser mouse, keyboard, touch, selection highlight, camera navigation and drag-cancellation behavior remain unverified.

### BUG-0017 — Empty-space click and Escape did not clear the active prop

- **Status:** IMPLEMENTED_UNVERIFIED · **Severity:** P2 · **Area:** Studio object editing
- **Reported behavior:** While editing a selected prop, the viewport ignored empty-space misses; Escape only exited gizmo mode and retained selection. Clicks on real room geometry also counted as hits and therefore were not treated as empty space.
- **Implementation:** Clear the shared temporary selection/edit state on R3F genuine pointer misses and on clicks that hit protected structural room geometry. Escape now clears prop selection, edit mode and inspection state. Editable prop single-click remains inert; double-click switching and character interaction remain unchanged. Gizmo handlers stop propagation. R3F's click-distance threshold prevents orbit/pan drags from becoming misses; zoom does not dispatch clicks.
- **Regression coverage:** Extended `tests/object-edit.test.mjs` for empty clearing, switching, Escape wiring, protected surfaces, gizmo propagation, R3F movement threshold and panel isolation.
- **Verification:** Typecheck, lint, all 68 tests and production build pass. Browser mouse/touch interaction remains unverified because no browser surface was available in this session.

### BUG-0018 — Kamyar procedural appearance requires visual review

- **Status:** USER-APPROVED PROTOTYPE · **Severity:** P2 · **Phase:** 04-B3
- **Evidence:** The user supplied original Kamyar portraits `references/characters/kamyar/kamyar1.jpg`, `kamyar2.jpg`, and `kamyar3.jpg`, plus `references/characters/group/group.png` for art direction. The existing renderer assembled an ellipsoid face, cap/fringe balls, and detached beard ellipsoids; no glasses option existed. The user asks for a recognizable, polished stylized human, not a low-quality primitive placeholder.
- **Current state:** The user chose stylized procedural characters over photo-to-GLB creation. Kamyar retains stable identity/model/renderer/customization/placement contracts and the nine hair/eight beard variants. On 2026-11-02 the user explicitly approved all four current character prototypes, superseding the earlier appearance rejection. No individual angle checks or GPU/performance results were reported. This records prototype approval, not photorealism or production-model status; GLB remains optional.
- **Regression coverage:** `tests/characters.test.mjs` checks model registration, supported customization, attachment structure, finite geometry and jaw/hair bounds, plus seat placement and save/reopen. Existing ChatGPT/Claude, model-switching, project and studio regressions remain in the suite.
- **Verification:** Automated tests cover preset distinctions, legacy ID mapping, invalid preset fallback, visibility, persistence and identity independence. User approval applies to the current prototype appearance only; detailed view coverage and integrated-Radeon performance were not reported. New studio lighting interactions await browser review.
- **Asset requirement:** No production GLB is required by the current direction. The validated GLB adapter/importer remains an optional future path. Preserve stable model/identity/instance IDs, transforms, placements and customization semantics if a replacement is later selected.

### BUG-0014 — Existing character identity could not change its base model

- **Status:** FIXED_UNVERIFIED · **Severity:** P1 · **Area:** Character library
- **Reported behavior:** Users could choose a base model only while creating an identity; changing an existing identity required deletion and recreation.
- **Fix:** Added registry-derived base-model replacement for existing identities with a Persian confirmation dialog. Keeps identity/name and every linked instance/state intact; compatible appearance fields transfer, incompatible custom values are disclosed and replaced by target defaults. The existing revision-checked project save path persists the identity update. The renderer resolves the new model through the unchanged identity reference.
- **Regression coverage:** `tests/characters.test.mjs` covers ChatGPT→Claude and Claude→Kamyar, preserved IDs/transforms/visibility/anchors, compatible/incompatible appearance, shared instances, unrelated identities, missing targets/sources and reopen persistence. Existing rename/delete/customization/placement tests remain active.
- **Verification:** `npm run typecheck`, `npm run lint`, `npm test` (61/61), `npm run build`, and `git diff --check` pass. Manual browser confirmation and library/properties/viewport refresh verification remain outstanding. The current registry has no Hamid model, so only registered models are offered.

### BUG-0015 — Studio sign and wall art could not be customized

- **Status:** IMPLEMENTED_UNVERIFIED · **Severity:** P2 · **Area:** Studio decoration; manual acceptance retest failed
- **Reported behavior:** The user reported that main wall sign customization failed in a 10-test run (8 passed). The sign was exposed under the generic “decorative lights” label, making the editable sign hard to identify in the Environment panel.
- **Implementation:** The existing renderer/editor/persistence path already supports text, local image upload, colors, lighting, transforms, visibility and restoring defaults. Made the studio prop explicitly discoverable as “wall sign and decorative lights”, exposed image contain/cover fitting, and added regression checks across panel, renderer, asset and save/reopen/reset flows. Stable prop IDs and default design are unchanged.
- **Regression coverage:** `tests/studio-decoration.test.mjs` verifies panel-to-renderer wiring, sign text/image persistence and restoration alongside frame and camera regressions.
- **Verification:** Targeted final run: typecheck, lint, 69/69 tests and production build pass. User must retest the complete browser workflow, including sign selection, text/image/colors, save, refresh/reopen and restore default; do not mark resolved until that passes.

### BUG-0016 — Studio editor camera was restricted to front/upper angles

- **Status:** IMPLEMENTED_UNVERIFIED · **Severity:** P2 · **Area:** Editor camera
- **Implementation:** Enabled orbit across near-top and near-bottom polar limits, pan, zoom, and an editor-only reset action. Production camera data is untouched.
- **Regression coverage:** `tests/studio-decoration.test.mjs` checks camera bounds, pan, reset behavior wiring and the visible reset action.
- **Verification:** Typecheck, lint, 66/66 tests and production build pass. Rear/side visibility, safe bounds, reset interaction and production-camera separation still need browser confirmation; no browser surface is available in this session.

### BUG-0019 — Editor workspace required excessive document scrolling

- **Status:** REOPENED — USER REJECTED PREVIOUS LAYOUT; RECOVERY UNVERIFIED · **Severity:** P2 · **Area:** Editor workspace layout
- **Reported behavior:** Section controls and properties were stacked above the scene viewport, with the timeline below the page; users had to scroll between the scene and controls.
- **Regression cause:** The first bounded layout put large section editors and selected properties into one narrow scroll column, kept full-height properties cards, and capped the preview width with a height formula. The user rejected the resulting hierarchy and appearance.
- **Recovery:** Keep the bounded desktop shell and original dark RTL identity, but separate section editing and selected properties into tabs in the left panel. Selecting a character/prop opens properties; navigation opens section controls. The viewport remains centered and the mobile panel is a dismissible drawer. Remove the environment list's nested scrollbar and tighten the placeholder timeline. Project and scene-state wiring remains unchanged.
- **Regression coverage:** `tests/workspace-layout.test.mjs` now exercises section/selection tab transitions, collapse, reopening, mobile dismissal and retention of feature panels.
- **Verification:** The previous 74/74 pass applied to the rejected layout and is not visual acceptance. Current typecheck, lint, 80/80 tests and production build pass after recovery and GLB pipeline work. Browser viewport fit, scrolling, drawer, and editing interactions remain pending.
- **Deferred:** Drag resizing of panels; current stable layout supports adaptive panel dimensions and collapsing the inspector.

1. Reproduce before labeling a new-project issue confirmed.
2. Fix root cause; add a targeted regression test.
3. Run relevant unit/integration checks and browser tests for interactive changes.
4. `FIXED_UNVERIFIED` is **not** `VERIFIED`.
5. Update `PROGRESS_CHECKLIST.md` only after the corresponding acceptance evidence exists.
6. Never erase bug history; mark closed with evidence.

### BUG-0020 — Character library had no project-local GLB import

- **Status:** IMPLEMENTED_UNVERIFIED · **Severity:** P2 · **Area:** Character library and project asset storage
- **Reported gap:** The GLB adapter could only resolve code-registered bundled paths; users could not import, preview, configure, persist, reuse, or safely remove a model from the editor.
- **Implementation:** Added a Persian import dialog with isolated 3D preview/configuration, GLB content and size checks, project-local asset storage, model metadata in the optional asset-manifest field, dynamic active-project registry, adapter rendering, and dependency-checked model deletion. Duplicate projects copy imported files and receive project-scoped URLs. No user project data was used as a test fixture.
- **Regression coverage:** `tests/character-import.test.mjs` checks valid/malformed model handling, project storage/reopen, independent IDs and instances, duplication and in-use deletion.
- **Verification:** Typecheck, lint, 84/84 tests, production build and `git diff --check` pass. Browser interaction, actual authored GLB rendering, fit, responsive usability, console and integrated-GPU performance remain unverified; no production model asset is bundled.

### BUG-0021 — Hamid character model was not registered

- **Status:** VERIFIED — PROTOTYPE APPROVED · **Severity:** P2 · **Area:** Character library and renderer
- **Reported gap:** The built-in registry and renderer did not include Hamid as an independently reusable character.
- **Implementation:** Added stable model ID `character-model:hamid`, a dedicated procedural renderer/head shape, a continuous fuller T-shirt torso profile, model-specific placement metadata and supported identity appearance fields. Existing schema v5 and character IDs remain unchanged. This is a stylized prototype, not a production likeness or rigged asset.
- **Regression coverage:** `tests/characters.test.mjs` covers registry and renderer capability metadata, distinct geometry, customization independence, multiple instances, guest-seat assignment, transforms, project reopen and duplication.
- **Verification:** Automated registration, appearance, placement and persistence coverage passed (`npm test` 85/85 at implementation). On 2026-11-02 the user explicitly approved the corrected Hamid appearance as part of approval for all four prototypes; no individual visual test results were supplied. Detailed studio clearance and integrated-Radeon behavior are not implied.

### BUG-0022 — Studio 01 lacked a right enclosure wall and project lighting controls

- **Status:** IMPLEMENTED_UNVERIFIED · **Severity:** P2 · **Area:** Studio 01 environment
- **Reported gap:** The room renderer had no right-side wall/ceiling, and studio lighting was fixed in code rather than editable and saved in the project.
- **Implementation:** Added a fitted right wall/ceiling with editor-only wall visibility, project-level bounded key/fill/accent controls, warm/neutral/cool presets, practical-light toggle and reset. Existing arrangements receive defaults; camera anchors, prop IDs/transforms and laptop media data are preserved.
- **Regression coverage:** `tests/arrangement.test.mjs` checks defaults, limits, reset, persistence/reopen and project duplication. `tests/environment.test.mjs` checks the room/laptop/light-control wiring; the existing environment/media tests remain active.
- **Verification:** `npm run typecheck`, `npm run lint`, `npm test` (87/87), `npm run build`, and `git diff --check` pass. No browser surface was available; light appearance, wall joins, camera orbit, laptop detail alignment and integrated-Radeon responsiveness remain pending.

### BUG-0023 — Studio viewport was too small and had no viewport-only fullscreen mode

- **Status:** IMPLEMENTED_UNVERIFIED · **Severity:** P2 · **Area:** Editor viewport and workspace layout
- **Reported behavior:** The usable 3D viewport occupied too little of the existing editor workspace, and users could not expand only the scene preview to fullscreen.
- **Implementation:** Reduced surrounding workspace padding and inspector width within the existing layout. Added a compact viewport-toolbar control that uses the browser Fullscreen API on the viewport section only; its state follows `fullscreenchange`, Escape exits through the browser, and unsupported/denied requests show Persian feedback. The 16:9 frame remains contained in fullscreen CSS; the existing R3F scene stays mounted and its canvas resizes with the viewport. No project or camera state is changed.
- **Regression coverage:** `tests/viewport-fullscreen.test.mjs` covers enter/exit, unsupported and denied APIs, state/event wiring, scene mount stability, and fullscreen frame/layout rules.
- **Verification:** `npm run typecheck`, `npm run lint`, `npm test` (91/91), `npm run build`, and `git diff --check` pass. Browser inventory exposed no browser or app surface; resizing, layout restoration, camera/selection retention, responsive behavior, browser errors and visual usability remain unverified.

### Phase 04-C1 — Manual character preview browser verification debt

- **Status:** IMPLEMENTED_UNVERIFIED · **Severity:** P2 · **Area:** Character animation preview
- **Reported behavior:** No new defect reported. This record tracks the acceptance evidence still required for the newly implemented preview foundation.
- **Implementation:** Added explicit-time deterministic preview evaluation and per-instance transient playback for supported local head/arm pivots. Preview state is not project data. Procedural channel metadata is capability-gated; imported GLB clip/skeleton inspection does not advertise runtime preview support.
- **Interrupted-check recovery:** The return-to-idle endpoint multiplied a negative arm offset by zero and produced IEEE `-0`, failing exact neutral-pose equality. The evaluator now returns the canonical zero pose at completion. ESLint also identified two synchronous state resets in effects for project/model changes; preview state is now keyed by project/model and derived without cascading effect updates.
- **Automated coverage:** `tests/character-animation.test.mjs` checks supported/unsupported actions, deterministic arbitrary-time evaluation/seeking, bounds, return-to-idle, independent outputs, persistence separation and cleanup wiring. Existing character/project/Studio regression tests remain active.
- **Verification:** Typecheck, lint, 96/96 tests, production build and `git diff --check` pass. No browser surface was available. Verify actual head/arm motion, reset/stop, instance independence, transform preservation, panel accessibility and demand rendering in browser; keep C1 unaccepted until reviewed.
- **Remaining limitation:** GLB clips, facial expressions, gaze, lip sync, automatic reactions and timeline scheduling have no runtime adapter in C1.

### Phase 04-C2 — Expressive preview browser verification debt

- **Status:** IMPLEMENTED_UNVERIFIED · **Severity:** P2 · **Area:** Character animation preview
- **Reported gap:** C1 offered only three simple head/arm actions, with limited timing control and no expressive variety.
- **Implementation:** Initial C2 implementation added ChatGPT/Claude expression preview and faster surprise/excitement timing, but manual viewport review rejected it. Recovery details and confirmed root cause are recorded under BUG-0024 below.
- **Regression coverage:** Recovery tests cover named renderer nodes, mouth visibility, capability metadata, deterministic timing/blinking, reset, independent instances, gaze coexistence, and active-preview invalidation.
- **Verification:** Initial 99/99 and later 118-test automated run are historical. Current recovery: 121/121 tests, typecheck, lint, build and diff check pass. Browser verification unavailable; three visual failures remain OPEN.
- **Remaining limitation:** Kamyar/Hamid support is limited to existing procedural eye, brow and mouth components; no jaw/cheek topology rig or GLB expression adapter exists. One coordinated preview preset plays at a time; automatic behavior scheduling, audio and timeline animation remain out of scope.

### Laptop close-up and prop selection visual refinement

- **Status:** IMPLEMENTED_UNVERIFIED · **Severity:** P2 · **Area:** Laptop display and object editing UX
- **Reported behavior:** Laptop close-up framing was awkward; there was no fullscreen view of the current display; selected props could show a wireframe outside active editing.
- **Implementation:** The close-up camera now uses a front/overhead screen-centered pose and restores the full prior editor camera state. Added a project-local image/video dialog with browser fullscreen and a modal fallback. Prop bounds are shown only during explicit edit mode; single viewport clicks remain inert and double-click continues to enter edit mode.
- **Regression coverage:** `tests/laptop-viewer.test.mjs` covers camera pose/state, viewer open/fullscreen/close state, media wiring and camera restoration. `tests/object-edit.test.mjs` asserts selection alone does not display bounds and retains double-click/empty-space behavior. Existing display persistence/media tests remain active.
- **Verification:** Typecheck, lint, 102/102 tests, production build and `git diff --check` pass. No browser/app surface was available; visual framing, image/video readability, fullscreen Escape, responsive behavior and camera restoration remain unverified.

### BUG-0024 — C2 emotional expressions and energetic timing failed manual review

- **Status:** OPEN · **Severity:** P2 · **Area:** Phase 04-C2 character preview
- **Evidence:** User reported 9 PASS / 3 FAIL manual checks: happy/sad/angry/surprised expressions unclear; supported eyes/mouths/eyebrows not visibly changing; energetic reactions too weak/slow. User subsequently rejected the latest facial-animation result because expressions still did not visibly change in the actual viewport, despite the prior 118 automated tests passing. Preserve both reports as failures; neither is superseded by this recovery. The 99/99 and 118-test counts are historical results from their respective runs.
- **Root cause investigation:** The preview clock and demand-render invalidation were active, and gaze/head channels were separate. The actual gap was the missing full adapter from evaluated expression state to renderer face objects: mouth presentation was partly selected through static React props while eye/brow transforms were separate, and Kamyar/Hamid had no facial-expression capability/application path.
- **Recovery implementation:** Added a model-aware adapter applying evaluated pose values to actual named face nodes, visible named mouth meshes, expression-specific eye/brow/mouth transforms, deterministic playback blink and explicit neutral preview/reset. Added limited expression support to existing Kamyar/Hamid geometry without claiming full facial rigging. C3 gaze implementation was not modified.
- **Verification:** Recovery automated suite passes 121/121, typecheck, lint, production build and diff check pass. This does not overturn the reported visual failure. Browser viewport was unavailable; visual appearance, transitions and normal-distance legibility are UNVERIFIED. Keep C2 rejected and BUG-0024 OPEN until user confirms the acceptance gate.
- **Verification required:** Manual browser review of front/three-quarter views at normal podcast distance, gaze plus expression, interruption/reset and saved transforms. No outcome is inferred for the nine passing checks or any retest.
- **Additional user-reported open scope (2026-11-04):** The user also reports incorrect laughing/smiling mouth shapes, insufficient rendered eyebrow motion, uncoordinated facial expressions across eyes/brows/mouth/head, and low-energy excited reactions. These are tracked here rather than duplicated as separate tickets. Acceptance additionally requires distinguishable smile versus laugh, inward/down anger brows, inner-up sadness brows, raised surprise brows, subtle asymmetric thinking brows, coordinated eyes/mouth/head, smooth transitions and bounded reactions. No browser confirmation has been provided.
- **Stabilization implementation (2026-11-04):** Added a deterministic laughing pose preset that coordinates head/shoulder/elbow oscillation with the existing facial-expression path. Automated checks confirm the `laughing` expression is selected, but they do not establish the rendered mouth shape, eyebrow visibility, or natural timing. Status remains OPEN pending viewport review.

### BUG-0029 — Arm and hand gestures are too limited and disconnected

- **Status:** OPEN · **Severity:** P2 · **Area:** Character acting / gesture preview
- **Reported behavior:** Current arm and hand gestures are too limited. Expected supported acting includes natural shoulder/elbow/wrist/hand coordination with head, face and torso, and no rigid/disconnected movement, unsafe joint rotations, or intersections with face/body/table/props.
- **Capability boundary:** Do not claim hand gestures where a model lacks controllable arm, elbow, wrist or hand joints. Current lightweight procedural human models have limited controls; actual rig capability must be inspected before exposing actions.
- **Verification required:** Manual front/three-quarter and seated interaction review, including prop/table clearance, natural transitions and independent multi-character behavior. This issue remains open.
- **Stabilization implementation (2026-11-04):** Added named elbow and wrist pivots around the procedural lower arm geometry for Kamyar, Hamid, and ChatGPT; retained hand pivots and added explicit attachment names. New elbow/wrist/hand pose channels are evaluated and blended per channel. Visual rest-pose alignment, collisions, tabletop clearance, and naturalness are UNVERIFIED. Claude/imported GLBs remain unadvertised for articulated arm actions. Status remains OPEN.

### BUG-0030 — Thinking preview lacks supported physical acting

- **Status:** OPEN · **Severity:** P2 · **Area:** Character acting / thinking behavior
- **Reported behavior:** Thinking does not communicate a believable physical state. Where a character rig supports it, the target behavior includes a hand moving toward the chin, slight head tilt, thoughtful eye direction, subtle asymmetric eyebrow pose, natural pauses and smooth return to neutral.
- **Capability boundary:** Hand-to-chin requires sufficient arm, elbow, wrist and hand control. Do not imply the gesture works for unsupported models; a head-only pose is not equivalent.
- **Verification required:** Browser verification of model-specific capability, full gesture path, face/prop clearance, pauses, interruption and neutral recovery. This issue remains open.
- **Stabilization implementation (2026-11-04):** Thinking now samples a deterministic attack/hold/release hand-to-chin pose with shoulder, elbow, wrist, hand and head offsets. The action is offered only when all four named right-arm pivots are present in model metadata; event evaluation applies the same gate. Automated tests verify availability gating and stable frame-time evaluation. Rendered hand contact, eye direction, collisions, and smooth visual recovery remain UNVERIFIED. Status remains OPEN.

### BUG-0025 — Phase 04-C3 gaze behavior production verification remains open

- **Status:** MVP_ACCEPTED; production verification open · **Severity:** P2 · **Area:** Character gaze and attention
- **Implementation:** Added timestamp-driven, bounded gaze evaluation; per-instance temporary editor state; character-head, prop-bound, laptop-display, active-camera, world-point, local-direction and manual attention targets; ChatGPT iris offsets; safe fallback for unavailable targets. Gaze does not alter project transforms, camera state, project schema, or C2 expression channels.
- **Regression coverage:** `tests/character-gaze.test.mjs` covers declared capabilities, parent transforms, quaternion/world-to-local targeting, limits and unreachable rear targets, arbitrary-time determinism, attention return, missing targets, independent eye support and transient persistence. Existing character, project, studio and C2 tests remain active.
- **Automated verification (2026-11-02):** Typecheck, lint, 108/108 tests, production build and `git diff --check` pass. No browser/app surface was available.
- **MVP verification (2026-11-02):** User confirmed all eight Phase 04-C3 manual browser tests PASS and accepted C3 for MVP/prototype development. Test names and individual outcomes were not supplied; no per-case results are inferred.
- **Production verification required:** Preserve the separately tracked visual, interaction, target-device/performance and evidence requirements. C2's separate BUG-0024 remains open and is not resolved by this acceptance.

### BUG-0026 — Laptop presentation needs clean editor-helper visibility and device framing

- **Status:** IMPLEMENTED_UNVERIFIED · **Severity:** P2 · **Area:** Laptop preview and viewport presentation
- **Reported behavior:** Laptop preview should read as viewing the physical laptop, while gizmos, selection bounds and editor helpers should not pollute presentation.
- **Implementation:** Added manual helper visibility and temporary automatic hiding during viewport fullscreen and both laptop viewer modes without clearing selection or changing transforms. Added device-framed fullscreen presentation using the real 3D laptop and display surface; camera inspection state is restored on exit. Widened the inspection camera framing and aligned camera up to the transformed screen. Retained the content-only viewer as a separate secondary option.
- **Regression coverage:** `tests/laptop-viewer.test.mjs` verifies helper gates, device presentation wiring, previous inspection restoration, camera alignment, and real laptop display rendering. Existing object edit and media tests remain in the suite.
- **Verification:** Typecheck, lint, 109/109 tests, production build and `git diff --check` pass. No browser/app surface was available. Browser review is still required for actual framing, occlusion, responsive behavior, fullscreen/Escape, helper restore, media readability, and preserved camera/selection state.

**Viewer refinement (2026-11-03):** Replaced the generic content modal layout with device-framed, screen-focus and explicitly separate content-only modes. Added a Persian mode switcher, explicit fullscreen controls, preserved mode across fullscreen changes, and Escape-to-exit-fullscreen without dismissing the viewer. Browser appearance and interaction verification remains pending; see Laptop educational viewer modes in `PROGRESS_CHECKLIST.md`.

### BUG-0027 — Device View bezel collapsed into a thin strip

- **Status:** IMPLEMENTED_UNVERIFIED · **Severity:** P1 · **Area:** Laptop viewer presentation
- **User evidence:** Real browser screenshot showed Device View as an extremely thin horizontal laptop-like shape.
- **Root cause:** The HTML bezel relied on `width:auto` despite having no intrinsic media size (media was absolutely positioned/filled), so its centered flex layout could collapse. Its earlier base was also only 24–48 px tall and did not read as a keyboard/body.
- **Implementation:** Give the bezel a responsive definite width and a frame aspect ratio based on `laptopVisualSpec`; size the media aperture to match the actual frame/screen dimensions. Add a connected hinge, visibly proportioned body, keyboard and trackpad. Preserve active project assignment, contain/cover and brightness.
- **Regression coverage:** `tests/laptop-viewer.test.mjs` checks camera direction, screen/frame proportions, screen centering, hinge/body alignment, screen tilt and definite CSS sizing.
- **Verification:** Automated checks pass (114/114 suite, typecheck, lint, build, diff check). Manual browser/visual verification of shape, angles, responsive sizing and content orientation remains pending; this issue is not marked fixed.

### BUG-0028 — Imported display images could not be deleted safely from the library

- **Status:** IMPLEMENTED_UNVERIFIED · **Severity:** P2 · **Area:** Project media lifecycle
- **Reported gap:** Users had no media-library delete action, and assignment removal could be confused with deleting the underlying project file.
- **Implementation:** Added a confirmed imported-image delete flow with busy/error feedback and refreshed active project/list state. The locked project-service check blocks deletion while the image is referenced by a laptop assignment, studio sign/frame, or any other serialized project data; the conflict explains that references must first be removed. Laptop image assignment removal is separately available and preserves video assignment.
- **Regression coverage:** `tests/display.test.mjs` verifies unreferenced file/manifest deletion, unrelated video preservation, reference blocking and intact persistence, future-reference scan and assignment-only removal.
- **Verification:** Automated checks pass (114/114 suite, typecheck, lint, build, diff check). Browser review of dialog usability, dependency workflow and persistence remains pending; this issue is not marked fixed.

### Phase 05-A verification record — multi-scene foundation

- **Status:** IMPLEMENTED_UNVERIFIED; browser acceptance pending.
- **Evidence:** Automated scene/schema/persistence/playback tests are added. Manual browser checks for create, edit, reorder, delete confirmation, playback, refresh/reopen and viewport synchronization have not been performed in this task.
- **Limitations:** Project-level character placements and studio arrangement remain shared across scenes until Phase 05-B. Per-scene production-camera data is persisted, but camera controls and evaluation are not implemented. BUG-0024, BUG-0029 and BUG-0030 remain OPEN.

### BUG-0031 — Scene content is not meaningfully authorable

- **Status:** OPEN · **Severity:** P2 · **Area:** Phase 05-A scene authoring
- **User report:** Scene operations work, but scenes do not yet feel meaningfully authorable. Manual Phase 05-A report: 12 PASS / 1 NOT VERIFIED; exact scene-boundary selection is NOT VERIFIED.
- **Implemented refinement:** Added per-scene description, optional organizational type, title, duration and director notes; added selected-scene properties UI and card summaries. Metadata does not cause automatic acting or camera behavior.
- **Verification remaining:** Automated persistence/duplication and field tests are added. Keep this issue open until the user confirms the authoring workflow is clear and metadata saves/reopens correctly in the real browser. Preserve the exact-boundary result as NOT VERIFIED.

### BUG-0032 — Storyboard management is confusing and lacks drag-and-drop

- **Status:** OPEN · **Severity:** P2 · **Area:** Phase 05-A storyboard UX
- **User report:** Scene management is confusing and does not provide drag-and-drop reordering.
- **Implemented refinement:** Added a visible native drag handle, drop-target highlight, immediate persisted order updates and retained keyboard-operable move buttons. Dragging is isolated from scene selection. Added a visual LTR ruler with proportional scene boundaries, playhead and ruler click-to-seek.
- **Verification remaining:** Automated source/domain coverage does not establish interaction quality. Browser-check pointer drag, drop feedback, keyboard reordering, selection retention, offset updates, viewport/timeline synchronization and responsive layout before closing.

### Professional workspace UX redesign — browser verification debt

- **Status:** IMPLEMENTED_UNVERIFIED · **Severity:** P2 · **Area:** Workspace layout and contextual help
- **Scope:** Redesigned the shell around a larger viewport, compact header, collapsible navigation, bounded inspector/timeline resizing, responsive panel behavior and centralized Persian contextual help. Existing project/scene/character/viewport workflows and project/API data contracts were retained.
- **Automated verification:** Typecheck, lint, 132/132 tests, production build and `git diff --check` pass. Tests cover help registry completeness, help interaction wiring, resize bounds and layout structure.
- **Verification remaining:** No browser/app surface was available. Review requested desktop, laptop, tablet and mobile sizes; check resize and reset, Escape/focus behavior, full-screen, no overflow, viewport stability and existing workflows. Do not mark visually accepted based on automated checks.
- **Related open reports:** BUG-0024, BUG-0029 and BUG-0030 remain OPEN; BUG-0031/0032 and exact scene-boundary NOT VERIFIED are preserved.

### Phase 05-B verification record — scene-local authoring and production camera

- **Status:** IMPLEMENTED; browser/visual verification pending. The user has not accepted Phase 05-B.
- **Delivered:** Independent scene-local character presence/transforms, registered environment reference, Studio 01 prop and lighting overrides, production-camera configuration/preview, schema v7 migration and Scenes navigation integration using the existing scene state/actions.
- **Coverage:** Typecheck, lint, production build, `git diff --check`, and 138/138 automated tests pass. Tests cover scene override independence, camera target fallback/presets, v6 migration, duplicate and persistence, and Scenes panel wiring to the same CRUD/reorder/select callbacks as the storyboard/timeline.
- **Unverified:** Real viewport camera framing/clipping, scene switching in browser, prop/character visible changes, panel usability/responsiveness, save/reopen interaction, and full manual verification. The old Phase 05-A result remains 12 PASS / 1 NOT VERIFIED (exact scene-boundary selection); no new manual outcome is inferred.
- **Limits:** Studio 01 is the only registered environment. Unsupported future environments, camera animation/keyframes, framing crop and automatic camera behavior are not implemented.
- **Preserved defects:** BUG-0024, BUG-0029 and BUG-0030 remain OPEN.

### Camera capture and premium guidance refinement — verification record

- **Status:** IMPLEMENTED_UNVERIFIED · **Area:** Production camera and workspace UX
- **Reported defect:** Saving/restoring a scene production camera was unreliable. Investigation found that capturing the editor FOV retained a previous scene zoom, so preview divided the captured FOV again. The action could also capture a temporary laptop inspection pose and silently do nothing when the camera was unavailable.
- **Change:** Normalize zoom to 1 on capture, clear the old target reference, reject temporary inspection/preview states, restore editor FOV on reset, and acknowledge the actual project save or report failure. The global Help button now opens searchable accordion guidance from the existing registry; the viewport toolbar groups controls and keeps secondary actions accessible.
- **Automated checks:** Typecheck, lint, 140/140 tests, production build and `git diff --check` pass; camera capture and unchanged neighboring scene have focused regression coverage.
- **Verification remaining:** Browser save/reopen, scene switching, camera framing/restore, laptop inspection, help interaction and responsive visual review. Keep this record open until manual verification. BUG-0024, BUG-0029 and BUG-0030 remain OPEN.

### BUG-0033 — Contextual inspector mixes project and editing controls

- **Status:** IMPLEMENTED_UNVERIFIED · **Severity:** P2 · **Area:** Workspace inspector
- **User report:** The inspector was crowded and disconnected from current work. The generic Properties view could show unrelated guidance in Projects or future-only sections.
- **Change:** Scene selection from storyboard/timeline now opens selected-scene configuration. Existing character and prop selection continues to route to dedicated editors; laptop selection retains media controls. Projects uses a single project-management view, while unrelated property tabs are hidden. Inspector heading and help follow the current section and selection.
- **Verification remaining:** Automated selection wiring and existing scene, character, laptop and project regressions; browser review of each selection path, preserving edits across section changes, panel resizing and responsive behavior. Keep open until visual verification.

### BUG-0034 — Fixed room prop override crashes scene resolution

- **Status:** FIXED_UNVERIFIED · **Severity:** P1 · **Area:** Phase 05-B scene-local prop configuration.
- **Confirmed root cause:** `arrangementSchema` intentionally requires non-editable room-shell and acoustic-wall instances to match the registered defaults exactly. Scene override writes accepted these stable prop IDs, and `resolveSceneArrangement` merged their overrides before calling `arrangementSchema.parse`, producing the reported ZodError.
- **Change:** Kept the schema refinements intact; disabled fixed-structure controls, rejected writes to fixed props with Persian feedback, validated supported transforms/decorations, and changed resolution to safely ignore unsupported legacy overrides while returning a warning. Valid scene-local prop overrides remain independent.
- **Automated coverage:** Focused tests cover fixed structure, valid visibility/transforms, strict schema rejection, scene isolation, duplicate independence, v6 migration fallback, and save/reopen.
- **Verification remaining:** Browser reproduction and visual confirmation of scene switching/warning feedback remain pending. BUG-0024, BUG-0029 and BUG-0030 remain OPEN.

### Phase 05-C verification record — deterministic scene-local character actions

- **Status:** IMPLEMENTED_UNVERIFIED. This phase record does not close any earlier acting defect.
- **Delivered:** Schema v8 timed scene-local character actions; deterministic frame evaluation, capability gating, channel priority, scene duplication/migration behavior, main navigation, timeline event lane, contextual inspector and centralized Persian help.
- **Regression risks preserved:** BUG-0024 facial expression quality/emotional energy, BUG-0029 limited arm/hand gestures, and BUG-0030 insufficient thinking gestures remain OPEN. The editor schedules existing supported channels; it does not claim to fix visual quality or add unsupported rigs.
- **Verification:** Typecheck, lint, production build and 152/152 automated tests pass, including project-service save/reopen and project-duplication persistence plus navigation/editor/help wiring. Browser interaction, real viewport poses and responsive layout remain UNVERIFIED until manual review.
- **Limits:** No audio/dialogue scheduling, lip sync, full Phase 07 behavior resolver, camera events, subtitle/educational tracks or export. BUG-0034 room-structure error and BUG-0035 camera navigation remain IMPLEMENTED_UNVERIFIED pending their recorded browser checks.

### BUG-0035 — Editor camera is difficult to navigate and frame precisely

- **Status:** IMPLEMENTED_UNVERIFIED · **Severity:** P2 · **Area:** Viewport camera navigation.
- **User report:** Orbit constraints make it difficult to explore the studio and position the camera in front of a selected character, including close face framing.
- **Change:** Expanded orbit range with damping, added transient pointer-locked free-fly and bounds-based smooth focus (head bounds/model forward axis for characters). Scene production cameras remain separate and are saved only with the existing explicit action.
- **Automated coverage:** Focus framing and front-facing direction; free-fly movement, vertical motion, speed and bounded delta; pointer-lock, text-input guards, cleanup and production-camera separation wiring.
- **Verification remaining:** Real browser checks for orbit/pan/zoom feel, ChatGPT face framing, prop/laptop focus, pointer capture/escape, scene switching, touch and save/reload are pending. No browser surface was available. Existing open animation defects are unchanged.

### BUG-0036 — Animation workspace controls overflow and crowd the editing panel

- **Status:** IMPLEMENTED_UNVERIFIED · **Severity:** P2 · **Area:** Animation workspace layout.
- **User report:** Controls overlap or clip, the inspector feels narrow and dense, and the viewport loses visual prominence.
- **Audit:** The project has no shadcn/ui/Radix component dependency. Existing panes already have independent overflow and resize support, but animation selects lacked explicit width constraints and the event list/advanced controls were always expanded.
- **Change:** Constrained inspector inputs to available width, applied `min-width: 0` to the main workspace grid, capped the event-list scroll area, and collapsed the event list and advanced settings behind native keyboard-operable disclosures. Reused the current workspace, single canvas, timeline and help infrastructure; no dependency or application-state change.
- **Verification:** Typecheck, lint, tests, production build and diff check pass. Browser viewport review at 1920×1080, 1366×768, 1024×768 and 390×844 remains pending; keep open until visual behavior is confirmed.

### BUG-0037 — Animation timing fields cannot be typed into

- **Status:** IMPLEMENTED_UNVERIFIED · **Severity:** P1 · **Area:** Phase 05-C event creation and inspector.
- **User report:** Start seconds and duration frames could not be cleared/replaced. A later manual browser check confirmed both creation fields (`0.00`, `45`) reject typing and Ctrl+A replacement; the earlier inspector-only change did not fix them.
- **Confirmed root cause:** The creation panel's two displayed inputs were explicitly `readOnly` and `addEvent` always used the playhead frame and default duration. The earlier inspector defect involved immediate `type="number"` normalization and was fixed separately. The viewport keyboard handler already ignores editable targets.
- **Change:** Creation inputs now hold raw local LTR text while focused, validate/normalize on blur or Enter, revert on Escape, show Persian errors, and pass the entered scene-bounded integer frames into the existing add-event command. Scene/project switching resets drafts through a stable key. Selected-event inspector behavior remains unchanged.
- **Verification:** Typecheck, lint, production build, 157/157 tests and `git diff --check` pass. Source wiring and frame/serialization regression checks were added. The project has no component DOM test runner, and the available browser tool exposes no browser. Actual keyboard typing, focus/caret, timeline update and save/reopen remain pending user browser retest. Keep open until confirmed.

### BUG-0038 — Scheduled character actions are not visibly playing reliably

- **Status:** IMPLEMENTED_UNVERIFIED · **Severity:** P1 · **Area:** Phase 05-C playback and character viewport runtime.
- **User report:** Creating and saving scheduled actions succeeds, but the intended character does not visibly perform the action during playback or seek.
- **Confirmed root causes:** The project playback clock published frames only every 100 ms (10 Hz), so the demand-rendered character pose could update much less often than the project's frame rate. Also, the transient manual-preview map was spread after scheduled poses and could replace an active event for that character. The evaluator already resolved scene-local frames and stable instance IDs; renderer named pivots existed and were written by `useFrame`.
- **Change:** Playback now samples the monotonic clock through requestAnimationFrame and only publishes changed integer frames. Active supported scene pose events, including a zero pose at their exact start frame, take precedence over manual previews; scheduled gaze takes precedence over temporary gaze previews. The shared character pose adapter applies evaluated rotations to actual named Three.js pivots and restores cached local baselines when seeking out of the interval.
- **Verification:** Typecheck, lint, build, 160/160 tests and diff check pass. Added evaluator-to-Three.js pivot tests for target identity, start/midpoint/backward seek and baseline restoration, plus playback/priority wiring assertions. Browser playback, pause, gaze target framing, visual salience, scene switch and save/reload remain UNVERIFIED; no browser surface was available. Keep open until manual visual confirmation.

### BUG-0039 — Animation event timing lacks clear start/end time controls

- **Status:** IMPLEMENTED_UNVERIFIED · **Severity:** P2 · **Area:** Phase 05-C event timing UX.
- **User report:** Start seconds plus duration frames are confusing; the user needs explicit start/end with hours, minutes, seconds and frames.
- **Confirmed cause:** The editor exposed separate start-seconds and duration-frames fields, with no end field or timecode mode.
- **Change:** Added a shared start/exclusive-end range editor with HH:MM:SS:FF and seconds modes, derived duration display, editable local drafts, blur/Enter validation, Escape revert, Persian errors, FPS-aware frame validation, and conversion into the unchanged integer `startFrame`/`durationFrames` schema. Creation and selected-event editing both use it.
- **Verification:** Typecheck, lint, build, 160/160 tests and diff check pass. Added parse/format, FPS/frame bounds, scene boundary, renderer integration and input wiring tests. Actual browser typing, toggle behavior, timeline block synchronization and persistence after refresh remain UNVERIFIED. Keep open until manual browser verification.

### BUG-0040 — Animation authoring workspace is cramped and event timing/order are difficult to understand

- **Status:** IMPLEMENTED_UNVERIFIED · **Severity:** P2 · **Area:** Phase 05-C animation workspace and timeline editing.
- **User report:** The preview is too small for the task, scene management competes with animation editing, overlapping actions are difficult to distinguish, and ordering, timing and priority are not clearly separate.
- **Audit:** A single dock rendered the full storyboard plus one 32px event overlay lane. The list was sorted by start frame, so there was no independent saved presentation order. Event priority already resolved conflicting pose channels in the evaluator, and integer-frame scene-local timing was already persisted.
- **Change:** The dock switches between scene overview and focused per-character/category tracks without remounting the viewport. Added per-scene zoom, a scene selector, pointer-drag frame movement that preserves event duration and clamps to scene bounds, persistent event-list reorder via existing array order with drag and keyboard arrow controls, and a visible per-channel priority field in the event inspector. No schema, evaluator, or time model changed.
- **Automated coverage:** Tests verify list reorder leaves IDs/time/priority unchanged, movement snaps to an integer frame and remains scene-bounded, plus workspace/inspector integration. Typecheck, lint, production build, 162/162 tests and `git diff --check` pass.
- **Verification remaining:** Run full checks and manually inspect event overlap, drag/drop, keyboard operation, persistence, actual viewport size, and the requested desktop/tablet/mobile sizes. No visual/browser acceptance is claimed. Keep open until verified.

### Phase 06 verification record — local audio assets and manual speaker ranges

- **Status:** IMPLEMENTED_UNVERIFIED; Phase 06 remains in progress and has no MVP/manual acceptance yet.
- **Delivered:** Schema v9 and v1-v8 migrations; managed WAV/MP3 import, range-enabled playback serving, same-ID replacement, reference-safe deletion and duplicate file copying; clips, speaker identities and non-overlapping clip-local speaker ranges; native playback, sample-derived waveform, numeric clip/range edits, split/merge and selected-range playback; centralized Persian audio guidance.
- **Automated verification:** `npm run typecheck`, `npm run lint`, and `npm run build` passed; `npm test` passed 166/166 tests; `git diff --check` passed. The initial sandboxed build hit a TypeScript worker `EPERM`; rerunning with approved elevated execution completed successfully.
- **Unverified:** Real WAV/MP3 upload and decode, media playback, waveform appearance, selected-range stopping, refresh persistence through the UI, keyboard/touch controls, responsive layouts and global Help Center integration in a browser.
- **Known limits:** Timeline audio now follows project playback frames; clip gain above unity is still metadata and is not audibly boosted, and timeline drag gestures are not implemented. Automatic speaker inference, lip-sync and export remain outside Phase 06. BUG-0024, BUG-0029 and BUG-0030 remain OPEN.

### BUG-0041 — Audio clip placement and speaker timing are difficult to understand in scene context

- **Status:** IMPLEMENTED_UNVERIFIED · **Severity:** P2 · **Area:** Workspace timeline discoverability.
- **Audit:** Clips use project-global integer frames; source trims and speaker ranges are seconds in the original file. Those separate coordinate systems, plus the lack of scene-relative placement, made the existing data hard for beginners to locate. This is a workflow/discoverability issue, not missing audio persistence.
- **Change:** Added a visible scene-specific «افزودن صدا» import action that persists the new asset then creates its clip and an initial unknown-speaker interval in one workflow. The attachment uses the server-confirmed asset duration and bypasses the stale pre-import asset list during validation. Existing source trim/placement controls, project-global frame schema and crossing-scene representation remain intact. Speaker ranges now appear within each clip lane, reducing duplicate rows; clip labels include assigned speaker names. Clip preview starts/stops at source trim bounds, and project playback maps global integer frames into source seconds.
- **Automated coverage:** Added frame-to-source playback mapping tests and a two-scene/two-asset project-service test covering independent scene placements, reopen, clip deletion and continued availability of the second clip. Browser import/playback/deletion, speaker assignment, save-refresh and responsive behavior remain unverified because no browser surface was exposed. Keep BUG-0040 and BUG-0024/0029/0030 open.
- **Current run (2026-11-04):** Updated automated and build results are recorded in `context/PROGRESS_CHECKLIST.md`. Browser flow, timeline playback behavior, speaker visibility and responsive layout remain pending visual review. The supplied screenshot was not present in this conversation; this implementation is based on the current code and recorded workflow issue.
- **Beginner workflow update (2026-11-04):** Character identities are now selectable directly from each speaker interval; the existing audio-speaker schema still receives a separate stable speaker ID on assignment. Clip cards present file name, project start time, duration, speaker, preview and delete without exposing frame coordinates. Frame placement, source trim, gain and mute are behind an advanced disclosure. The existing selected-asset preview, waveform and replace action remain visible. Source-level regression assertions were added and all 179 tests, typecheck and lint passed. Browser interaction remains unverified; a first production build attempt compiled but its data-worker spawn returned `EPERM`, and a clean retry is running. Track this as implemented/unverified until it succeeds and the browser workflow is reviewed.
- **Timeline editing addendum (2026-11-05):** Added desktop and library drag targets on scene regions, zoom/scroll-aware LTR frame conversion, snapping, clip move/trim/split, multi-select, same-source sequential merge with speaker choice, overlapping Mix distinction, and session-local undo/redo. Tests exercise these pure operations and v9 save/reopen. These controls are IMPLEMENTED_UNVERIFIED; the browser inventory exposed no surfaces, so drag/drop and audible playback have not been verified. Merge currently requires one asset with contiguous source ranges. Keep Phase 06 open.
- **Merge safety refinement (2026-11-05):** Merge eligibility also requires matching mute and gain values so sequentially joining clips cannot silently discard different playback settings.

### Browser QA follow-up — shared audio timeline

- **Confirmed defect / root cause:** Desktop audio drop uploaded and validated the file, but `placeAudioAsset` immediately checked a stale React `activeProject.assetManifest` closure. The just-uploaded asset was therefore rejected and no scene clip was created. Direct uploaded placement now uses the server-validated upload result; library placement still validates its manifest entry. Regression coverage includes the stale-manifest upload path.
- **Additional correction:** Timeline playback previously set every HTML audio player's gain to `1`, ignoring persisted clip gain and mute. Playback now routes through a Web Audio gain node where available, with a volume fallback, and cleans up its context. Also corrected the beginner-facing timeline note that incorrectly said project playback was unsynchronized.
- **Browser evidence:** Chrome/Playwright was available after installing the project-local test runner. Screenshots were captured and inspected at 375×812, 768×1024, 1024×768, 1440×900, and 1920×1080; the document had no horizontal overflow, and the responsive run had zero uncaught page errors or failed requests. Browser E2E created two scenes, attached desktop audio to scene 2, moved and edge-trimmed a clip, played while source `currentTime` advanced in step with the project playhead, split, merged, undid/redid, reloaded, imported a second audio file to the library, dragged it into scene 1, reloaded with both named clips, deleted the scene 1 clip and confirmed deletion survived reload. Zoom/reset preserved the clip's project-coordinate style. The test removed its temporary project after assertions.
- **Limits:** This establishes browser media decoding/time progression, not human audible acceptance. Automated coverage does not yet exercise speaker reassignment between two actual character identities, drag-merge across scene boundaries, or mobile touch/pointer behavior. The narrow mobile navigation still truncates some long section labels even though the document itself does not horizontally overflow; revisit that independently of the audio data contract.
- **Final checks:** Typecheck, ESLint, production build, browser E2E (2/2), audio tests (9/9), timeline tests (12/12), and `git diff --check` passed. Full `npm test` is not green: 177/187 tests passed; the 10 failures are stale source-pattern assertions in existing scene authoring/navigation, transform control, facial renderer, layout/inspector, and Help tests. The suite and these assertions need review; no full-suite pass is claimed.
- **Status at this checkpoint:** Audio workflow IMPLEMENTED and browser-verified for the tested desktop pointer paths. Phase 06 remains open pending human audible review, speaker identity reassignment, manual touch/accessibility review, and any remaining phase acceptance criteria.

### BUG-0043 — Narrow-screen workspace navigation labels are clipped

- **Status:** FIXED_BROWSER_VERIFIED · **Severity:** P2 · **Area:** Responsive workspace shell.
- **Confirmed:** Screenshot inspection at 375×812 shows the horizontally scrolling primary navigation cuts off neighboring labels at the viewport edge. The document itself does not overflow, but the clipped labels make destinations harder to discover.
- **Root cause:** The compact navigation row was wider than the viewport and relied on horizontal scrolling without a clear scroll cue. Labels at the edge were partly visible.
- **Fix:** At widths up to 1023px, show a native Persian section picker with the available and planned destinations labeled accurately and a contextual Help trigger. On mobile, navigation moves keyboard focus into the opened inspector; closing it restores focus to the picker. The close control is visible throughout the mobile breakpoint.
- **Verification:** Chrome screenshots at 375×812 and 768×1024 show the complete selected label and no navigation overflow. E2E checks RTL, keyboard selection, visible focus, inspector focus/return, and the absence of document or navigation horizontal overflow. Touch use still needs human review. No project, timeline or persistence data changed.
- **Regression audit:** The ten failures in the prior 177/187 unit run were individually traced to single-line/adjacent-token source assertions after valid JSX formatting and wrapper changes. The intended scene, transform, facial, layout and Help wiring was inspected and remains present. Updated patterns retain those checks. No test infrastructure defect or confirmed application regression caused these failures. Final full-suite outcome is recorded in `context/PROGRESS_CHECKLIST.md`.
- **Help correction:** The global workspace and timeline guidance still claimed project audio playback was unsynchronized. Browser E2E had verified source-time progression against the project playhead, so the registry now describes current playback and separates it from unavailable automatic speaker detection. This was a user-facing documentation defect; the centralized help test now asserts the positive behavior.
- **Stable checkpoint:** Typecheck, lint, all 187 unit tests, production build, both Chrome E2E tests, and `git diff --check` pass. BUG-0043 is fixed for the tested 375×812 and 768×1024 layouts; manual touch acceptance remains open.

### BUG-0044 — AudioEditor crashes when no audio asset is selected

- **Status:** FIXED_BROWSER_VERIFIED · **Severity:** P1 · **Area:** Audio editor render stability.
- **Confirmed cause:** `sourceDraft?.assetId === selectedAsset?.id` was true when both values were absent (`undefined === undefined`), then the selected branch read `sourceDraft.start` or `.end` while `sourceDraft` was `null`.
- **Fix:** Match a source draft only after both the draft and selected asset exist and their IDs agree. The start/end fallbacks use the shared `sourceDraftValues` guard. No audio state initialization, clip data, timeline frames, or persistence contract changed.
- **Adjacent audit:** Scene placement drafts already require both `placementDraft` and `scene`; speaker interval drafts require both `regionDraft` and `clip` before reading fields. No second unsafe optional-comparison dereference was found in `AudioEditor`.
- **Regression evidence:** The focused unit test covers null draft with no selection, null draft with an asset, a removed asset, a draft for another asset, and a matching draft. Chrome E2E covered no open project, initial empty audio library, a selected asset while `sourceDraft` is still null, switching between two scenes, deletion of the selected clip, deletion of the final asset, and reopening the empty project. No uncaught page error occurred. All three browser tests passed; typecheck, lint, 188/188 unit tests, and build passed.
# BUG-0042 — Timeline scale is not adjustable for overview and detail work

- **Status:** IMPLEMENTED_UNVERIFIED · **Severity:** P2 · **Area:** Shared timeline presentation.
- **Finding:** The unified project timeline had a fixed pixel scale. Long projects could require horizontal scrolling, but there was no control to move between a broad overview and closer timing inspection.
- **Change:** Added 50%–400% bounded timeline zoom, project-scale reset, zoom percentage, adaptive ruler tick density, Persian accessible names and effect-specific help text. Zoom changes the rendered pixel width only; all track positions and event drag calculations continue to use the same total-frame mapping.
- **Automated coverage:** Regression assertions cover bounded controls, reset, accessible labels, scaled width, continued width-based frame mapping, and centralized help. `npm run typecheck`, `npm run lint`, `npm test` (173/173), `npm run build`, and `git diff --check` pass.
- **Verification remaining:** Browser-check zoom, horizontal scroll, event placement and pointer dragging at every requested target size. Keep this issue open until visual and interaction verification.
