# Signal Studio AI — Progress Checklist

**Document:** `context/PROGRESS_CHECKLIST.md`  
**Status:** Initial baseline — planning only  
**Roadmap:** `context/ROADMAP.md`  
**Last reviewed:** 2026-11-02
**Project mode:** Single-user, local Windows application

## 1. How to Use This Checklist

- `[x]` means **implemented AND verified against the stated acceptance criteria**. Documentation tasks may be checked after the document is present and reviewed; they do not imply application code exists.
- `[ ]` means **not implemented, partially implemented, or not adequately verified**. Add a note distinguishing these conditions.
- Track **implementation** and **verification** separately when a feature is coded but browser validation is missing. Never silently turn such an item into `[x]`.
- Verification evidence should identify the date, command/test name, browser/manual steps, result, and relevant file or commit. `npm run build` alone does not verify interactive behavior.
- Codex must update this file and `BUG_TRACKER.md` after each phase. Changes to technical contracts must also update `DECISIONS.md` and the affected context document.
- Previous deleted prototypes, example screenshots, and historical Codex reports are **not** evidence of implementation in this new project.
- No later phase starts without user approval and an accepted handoff from the current phase.

### Status Vocabulary

- **Not started:** no implementation yet.
- **In progress:** partly implemented, acceptance criteria outstanding.
- **Implemented / unverified:** code exists but required browser/visual or integration evidence is missing.
- **Blocked:** external technical dependency or reproducible issue prevents completion; link to `BUG_TRACKER.md`.
- **Verified:** implementation and acceptance tests passed; item can be checked.

## 2. Phase 00 — Documentation & Design Contracts

**Phase status:** In progress. The drafts below have been prepared in conversation; their presence in the actual project directory and consistency as a complete set have not been independently verified.

- [ ] `context/PROJECT_OVERVIEW.md` exists in the local project and is reviewed.
- [ ] `context/TECH_STACK.md` exists and is consistent with approved local-only scope.
- [ ] `context/ARCHITECTURE.md` exists and defines clear ownership boundaries.
- [ ] `context/DATA_MODELS.md` exists, with stable IDs and versioned structures.
- [ ] `context/CHARACTERS_AND_AUDIO_REQUIREMENTS.md` exists and distinguishes mixed audio from speaker identity.
- [ ] `context/BEHAVIOR_SYSTEM.md` exists and defines layer-local behavior priority.
- [ ] `context/UI_UX_GUIDELINES.md` exists and specifies Persian RTL and LTR timeline behavior.
- [ ] `context/CODING_STANDARDS.md` exists with test and performance requirements.
- [ ] `context/ROADMAP.md` exists and is approved.
- [ ] `context/PROGRESS_CHECKLIST.md` is placed in the local project and reviewed.
- [ ] `context/BUG_TRACKER.md` is created.
- [ ] `context/DECISIONS.md` is created, recording approved and unresolved decisions.
- [ ] Root `AGENTS.md` is created and points to the context documents.
- [ ] Cross-document review confirms consistent character/scene/asset terminology, storage and timeline policies.
- [ ] Phase 00 is explicitly approved before application setup.

**Acceptance evidence:** paths reviewed; document conflicts resolved; architectural decisions logged; no claim of application implementation.

## 3. Phase 01 — Local App Foundation

**Phase status:** Implemented / unverified. The 2026-11-01 static checks and localhost response passed; browser interaction, visual layout, keyboard focus, responsive behavior, and hydration remain unverified because no browser surface was available.

- [x] Initialize Next.js, React, strict TypeScript, Tailwind CSS v4 and linting using compatible pinned versions. Verified by installed packages, `npm run typecheck`, `npm run lint`, and `npm run build` on 2026-11-01.
- [ ] Create functional Persian RTL shell and local navigation with distinct section content. Implemented in `src/components/`; each destination has unique copy, but browser clicking remains unverified.
- [ ] Establish readable typography, accessible controls, dark theme and responsive layout. Styles and focus rules are implemented; visual and keyboard checks remain unverified.
- [x] Clearly mark unavailable future features; no fake clickable controls. Source and rendered initial HTML inspected on 2026-11-01; controls are section navigation and help only.
- [x] Run locally on Windows without cloud login or deployment. `npm run dev` served `http://127.0.0.1:3000/` with HTTP 200 on 2026-11-01; process stopped after the check.
- [ ] Validate typecheck, lint, build, and browser navigation/hydration behavior. First three passed on 2026-11-01; browser checks remain unverified.
- [ ] Update documentation and obtain Phase 01 approval.

**Phase 01 evidence (2026-11-01):** Node 22.21.0, npm 11.6.2; `npm test` passed 1 navigation configuration test; `npm run typecheck`, `npm run lint`, and `npm run build` passed. `npm run dev` and a later `npm run start` both served HTTP 200 on `127.0.0.1:3000`; production HTML contained `lang="fa"`, `dir="rtl"`, viewport, and timeline. Browser inventory returned no available browser, so navigation clicks, RTL rendering, mobile layout, focus behavior, and hydration were not tested. Manual follow-up: run `npm run dev`, open `http://127.0.0.1:3000/`, visit every navigation item and Help, verify distinct content and persistent viewport/timeline, inspect desktop and narrow widths, tab through controls, and check the browser console for hydration errors. No Phase 02 work started.

**Focused Phase 01 QA (2026-11-01):** Source review found separate content branches for all ten navigation destinations plus Help; Scenes and Characters use independent branches and guidance. The shell uses `lang="fa"`/`dir="rtl"`, and the timeline ruler explicitly uses `dir="ltr"`. CSS declares a 16:9 viewport; a conflicting mobile minimum height was removed, and helper text below 12 px was enlarged. The root `AGENTS.md` was restored after Next.js appended its own block; `agentRules: false` prevented regeneration on a development-server restart. After these fixes, `npm run typecheck`, `npm run lint`, `npm test` (1 pass), and `npm run build` passed. These are source and build checks, not browser interaction evidence.

**Still unverified:** Navigation clicks, independent panel updates, actual 16:9 geometry, LTR visual flow, typography appearance, 1920×1080 / 1366×768 / narrow mobile layout, keyboard focus, and a clean browser console. Playwright is not installed or cached; the browser tool exposed no browser, and Windows computer use reported an unavailable native connection. The source of the `cz-shortcut-listen` DOM mutation is confirmed as ColorZilla, but removal of the hydration warning in a clean profile is unverified. Keep Phase 01 at **Implemented / unverified** and leave browser-dependent boxes unchecked. No Phase 02 work started.

**Tailwind and font migration (2026-11-01):** Migrated component layout, spacing, colors, typography, responsive behavior, hover and focus styles from handwritten CSS to Tailwind v4 utilities. Retained only CSS-first theme tokens, dark color scheme, and decorative shell/preview/timeline backgrounds in `globals.css`. Font metadata identifies the installed files as Yekan Bakh FaNum with Arabic script support; the shell loads its used 400/600/700/800 WOFF2 weights via `next/font/local` with swap and system fallbacks. `npm run typecheck`, `npm run lint`, `npm test` (1 pass), and `npm run build` passed. Production HTML includes `lang="fa"`, `dir="rtl"`, four font preloads, and no extension-injected markup. All four generated font URLs returned HTTP 200 with `font/woff2`. Compiled CSS contains the font-sans, aspect-video, grid, responsive, and timeline classes. Browser inventory returned no available browser, so actual font rendering, visual comparison, geometry, interaction, focus, responsive viewports, and hydration console are **unverified**. Phase 01 remains **Implemented / unverified**.

**Hydration investigation (2026-11-01):** Source and server HTML were inspected. Chrome's installed Translator extension inserts `translate-tooltip-mtz translator-hidden` into the body; ColorZilla inserts `cz-shortcut-listen`. These match the reported unexpected DOM. No application-side defect was confirmed; metadata and SSR were preserved. A clean profile could not be launched, so the warning's disappearance with extensions disabled remains unverified. See BUG-0004.

## 4. Phase 02 — Projects, Persistence & Asset Registry

**Phase status:** Accepted (2026-11-01). Automated checks and server/disk tests passed; the user reports all 10 Phase 02 manual browser acceptance tests passed. The unrelated unchecked roadmap items and Phase 01 verification gaps below remain open.

- [x] Implement local create, rename, duplicate, save, reopen and delete project workflows. Automated and HTTP checks passed; the user confirmed the Persian browser workflow, including refresh persistence and deletion confirmation, in the 10-test manual acceptance run on 2026-11-01.
- [x] Implement versioned project JSON and managed asset folders. Schema v1, directory initialization, and stored files were verified in temporary-directory tests and an HTTP disk check.
- [ ] Implement schema validation, safe migration, atomic writes/backups and missing-asset handling. Validation, atomic replacement, backup, and safe asset resolution were tested; no prior schema exists to migrate, and browser missing-asset feedback is not yet available.
- [ ] Implement import/replace/delete asset lifecycle with reference checks and confirmation. Binary import and its UI are deferred by the narrower Phase 02 request; no asset import is presented as working.
- [x] Ensure project starts without unrequested demo audio. The creation test confirms empty asset, clip, scene, and event collections.
- [x] Verify persistence across full process restart and reject unsafe paths/invalid files. Production HTTP flow persisted a project, stopped and restarted the server, reopened it, renamed, duplicated, and recoverably deleted it. Unit tests reject corrupt JSON, unsupported versions, stale revisions, invalid names, unsafe asset paths, and traversal IDs.
- [x] Obtain Phase 02 approval. The user reported all 10 manual browser acceptance tests passed and accepted Phase 02 on 2026-11-01.

**Phase 02 evidence:** `npm run typecheck`, `npm run lint`, `npm test` (12/12), and `npm run build` passed on 2026-11-01. Tests include failed atomic replacement cleanup, missing-asset recovery, and Origin/Host validation. A production server on `127.0.0.1:3102` used the absolute `SIGNAL_STUDIO_DATA_DIR` path to `.tmp/phase02-http-check`. Create → save → inspect `project.json` → stop/restart server → list/open → rename → duplicate/open → delete both returned the expected data; the final project list was empty. The test root is isolated and ignored by Git. Automatic approval review rejected recursive cleanup of that test root, so it remains under `.tmp/`. Browser inventory returned no browsers; actual modal focus, keyboard use, autosave timing, responsive styling, and console/hydration behavior remain **unverified**. Phase 03 was not started.

**Phase 02 API regression (2026-11-01):** The reported `POST /api/projects` 403 was reproduced on the active port-3000 development server with browser-style Host and Origin headers. Next.js normalized `nextUrl.origin` to `localhost` despite an incoming `127.0.0.1` Host. The guard now compares Origin to the validated received Host and checks the actual server port. Browser-header POSTs from both served origins returned 201; mismatched or untrusted Origins returned 403. A browser-header create/save/reload/open/rename/duplicate/delete flow passed. Raw HTTP Host probes confirmed mismatched port and untrusted hostname are rejected. This confirms HTTP guard behavior, not the still-unverified Chrome UI workflow; see BUG-0006.

**User manual acceptance (2026-11-01):** The user confirmed that all 10 Phase 02 browser acceptance tests passed, including project creation, persistence after refresh, rename, duplication, deletion confirmation, save status, and Phase 01 UI regression checks. The previously reported project-creation 403 was not reproducible in that tested workflow. This user report verifies those stated behaviors; it does not provide separate measurements for every Phase 01 viewport size, keyboard/focus path, clean-profile hydration console, or future binary-asset import. Those items remain unchecked where applicable. Phase 03 has not started.

## 5. Phase 03 — 3D Viewport & First Environment

**Phase status:** In progress. Phases 03-A, 03-B, 03-C and 03-D are accepted; individual unreported browser checks and overall Phase 03 acceptance remain open.

### Phase 03-A — Core 3D engine foundation (2026-11-01)

- [x] Install and pin compatible Three.js, React Three Fiber, Drei, and Three type declarations. `npm ls` and typecheck confirmed the exact installed versions.
- [x] Add a modular client-only Canvas with perspective editor camera, orbit/zoom, reference ground, lit test mesh, 16:9 container, demand rendering and DPR cap. The user confirmed visible 3D rendering, orbit, zoom, lighting and resizing in the manual browser acceptance run. The mesh is explicitly labeled temporary development content.
- [x] Define and test a serializable production camera contract independent of editor controls. Camera validation tests passed.
- [ ] Provide Persian WebGL-unavailable and initialization-failure states, context-loss handling and listener cleanup. Implemented and unit-tested; GPU failure appearance remains unverified in a browser.
- [x] Verify actual Canvas rendering, orbit, zoom, lighting, resizing, navigation stability, project-management regression and absence of new browser console errors. The user confirmed all eight manual acceptance checks passed on 2026-11-01.

**Evidence:** The user reported all eight Phase 03-A manual browser acceptance checks passed on 2026-11-01: 3D rendering, orbit, zoom, lighting, resizing, navigation stability, project-management regression and no new browser console errors. The final `npm run typecheck`, `npm run lint`, `npm test` (16/16), and `npm run build` all passed on 2026-11-01. WebGL-disabled fallback appearance and forced context-loss recovery were not part of the eight reported checks and remain unverified. **Phase 03-A accepted**; this does not close Phase 03.

### Phase 03-B — First real environment (accepted 2026-11-02)

- [x] Render **Modern Podcast Studio — Studio 01** with a composed room, desk, chairs, bookshelf, laptop, microphones, acoustic wall, decorations, plants and practical lights. The user confirmed visual composition, furniture, laptop orientation and lighting in the manual browser run.
- [x] Register only the implemented studio using a stable environment ID, separate prop definition IDs and default instance IDs. Unit tests verify registry resolution, uniqueness, valid transforms and independent arrangement copies.
- [x] Define serializable production-camera suggestions and host/co-host/guest placement anchors without changing the project schema. Unit tests validate camera data and anchor separation.
- [x] Add seat-based camera suggestion metadata for studio, two-seat conversation, individual close-ups and three-seat group framing in 16:9 and 9:16. Registry and geometry tests validate pose data, placement references and approximate horizontal clearance; these are suggestions only, not camera behavior or export support.
- [x] Keep nonexistent environments out of the registry and UI. Source review and registry test show one actual environment.
- [x] Verify composition, prop spacing, orbit/zoom, resize, navigation stability, console behavior and performance in a real browser on the target hardware. The user reported all 12 manual acceptance checks passed; the reported areas include visual composition, laptop facing the host, furniture layout, lighting, space for future character placement, orbit, zoom, 16:9 resizing, project regressions, browser console and performance. Individual timing/FPS measurements were not supplied.

**Phase 03-B evidence:** `npm run typecheck`, `npm run lint`, `npm test` (22/22), and `npm run build` passed on 2026-11-01 after the seated-use correction. Existing navigation, project-persistence, camera and WebGL-unit regressions passed. No real GLB asset is loaded: Studio 01 is a procedural environment assembled from independent props. External asset loading and missing-file recovery remain future work. No project JSON schema or stored project data changed.

**Seated-use correction:** The laptop now faces the host at negative Z, with keyboard nearer the chair than the screen. Host/co-host chairs are closer to the desk, microphones are positioned for their seated users, and the guest has a separate side table and microphone. `tests/environment.test.mjs` covers these spatial relationships. Visual clearance with future character models remains unverified; see BUG-0007.

**Final architecture review (2026-11-02):** Source review found that `wide` and `front` alone did not describe conversation, close-up, three-seat, or vertical framing. The wide suggestion was moved toward the open front of the set; additional serializable production-camera poses and seat-ID metadata were added without changing the editor camera, project schema, prop IDs, or character placement. `npm run typecheck`, `npm run lint`, `npm test` (24/24) and `npm run build` passed. Automated checks establish only approximate seat clearance and the existing laptop/desk/microphone alignment. The agent's browser was unavailable at that review; the later user run below supersedes that limit for its reported checks. The required `context/CHARACTERS_AND_AUDIO_REQUIREMENTS.md` is absent; only `_REVISED.md` exists and was reviewed as the available source.

**User manual acceptance (2026-11-02):** The user confirmed **12/12 Phase 03-B browser checks passed**. Reported checks cover the studio composition, host-facing laptop, furniture arrangement, lighting, character placement space, orbit and zoom, 16:9 resize behavior, project regressions, browser console and performance. This supersedes the agent's earlier browser-unavailable limit for those tested areas. No screenshots, console transcript, FPS figures or separate 9:16/cinematic-camera test evidence were supplied. **Phase 03-B accepted**; Phase 03-C and overall Phase 03 remain open.

**Future scope recorded, not implemented at that review:** Phase 05-B remains scene-local arrangements; Phase 03-E now implements basic image/video/off display on the laptop only; Phase 06-B extends media display to additional props; Phase 07 covers deterministic display-state timeline events and master-timeline source-video timing; Phase 09 covers cinematic camera modes/events; Phase 11 covers synchronized offline output. These are independent scopes and none of the latter features are implied by basic laptop display playback.

### Phase 03-C — Project-level studio prop editor (accepted 2026-11-02; detailed checks pending)

- [x] User confirmed that the dynamic prop editor works after opening an active project (2026-11-02). This is a general interactive check, not separate evidence for every operation below.

- [ ] Select, add, remove, restore, hide, show and duplicate supported prop instances through Persian controls and the live viewport. Implemented; viewport interaction is **UNVERIFIED** in a real browser.
- [ ] Move, rotate and scale the selected prop with numerical fields and Drei gizmos, keep orbit controls from competing during drag, and show a selection outline. Implemented; gizmo/selection visual behavior is **UNVERIFIED** in a real browser.
- [x] Validate project-level prop IDs, references, finite transforms and positive scales; protect structural room props. Domain tests pass. This does not claim scene-local independence.
- [x] Read v1 projects without modifying their files, back up before first v2 write, and persist/reopen/duplicate independent v2 project arrangements. Temporary-store service tests pass.
- [ ] Verify autosave status, refresh/reopen, project switching, responsive layout, console state and integrated-GPU performance in a browser. Automated persistence tests do not replace this check.
- [ ] Complete and verify remaining original Phase 03 viewport features, including quality and fullscreen behavior.
- [ ] Obtain acceptance of the overall Phase 03 milestone.

**Phase 03-C evidence (2026-11-02):** Source and test review confirm project-level schema v2, safe in-memory v1 migration, atomic save/backups and independent prop operations. `npm run typecheck`, `npm run lint`, `npm test` (27/27) and `npm run build` passed. The user confirmed that the dynamic prop editor works after opening an active project. The report did not identify which individual selection, visibility, transform, persistence, responsive, console or performance checks were exercised; these remain pending above. The agent's computer-use inventory exposed no apps or browsers for an independent check. No character, audio, educational display, cinematic camera or export feature was added. Overall Phase 03 acceptance remains pending.

**Phase 03-C acceptance (2026-11-02):** The user explicitly accepted the committed Phase 03-C implementation (`b2c566b`) and authorized Phase 03-D. The acceptance does not supply results for the individual unchecked browser cases above; those remain pending. Overall Phase 03 is still open.

### Phase 03-D — Studio 01 visual refinement (accepted 2026-11-02)

- [x] User reported **16/16 manual acceptance tests passed** after the visual upgrade. Reported areas: studio visual quality, furniture proportions, materials, lighting, laptop orientation, object editing, persistence, camera functionality, performance and browser console. Exact per-test steps, screenshots and FPS measurements were not supplied.

- [ ] Inspect refined room, furniture, laptop, microphones, bookshelf, plants and lights from wide and close camera angles in a real browser; judge proportions, material balance, intersections and sightlines.
- [ ] Confirm the laptop display faces the host, the keyboard and hinge align, and future character seats and microphones remain usable in the rendered scene.
- [ ] Recheck Phase 03-C selection, transform gizmos, visibility, add/duplicate/remove/restore, save/reopen and independent projects against the refined visuals.
- [ ] Measure or observe responsiveness on integrated Radeon graphics and inspect the browser console for new errors.
- [x] Obtain user visual acceptance for Phase 03-D. The user explicitly accepted the phase after reporting 16/16 manual checks passed.

**Phase 03-D implementation evidence (2026-11-02, before user acceptance):** `npm run typecheck`, `npm run lint`, `npm test` (28/28) and `npm run build` passed. The new geometry test checks the unchanged laptop/desk origins, host-facing display placement, frame bounds and tilt. The computer-use inventory returned no browser or app, so the agent could not independently verify rendered appearance, editor interaction after refinement or target-GPU responsiveness. The later user report below supplies manual evidence for its stated areas.

**Phase 03-D user acceptance (2026-11-02):** The user confirmed all **16/16 manual acceptance tests passed**, covering the reported visual, editing, persistence, camera, performance and console areas above. This supersedes the agent's browser-unavailable observation for those reported areas. The unchecked detailed cases above and unrelated WebGL failure, fullscreen/quality and overall Phase 03 checks stay open where the report gives no individual result. **Phase 03-D accepted.**

### Phase 03-E — Laptop educational display

- [x] Implement project schema v3 with safe v1/v2 in-memory migration; persist display assignments separately from prop definitions; preserve associated image/video asset IDs while off.
- [x] Import PNG/JPEG/WebP and MP4/WebM into project-local managed asset directories, validate MIME signatures and size, and serve media through local project-scoped routes with byte-range support.
- [x] Render media texture on the actual named laptop screen surface under its parent transform; implement contain/cover fitting, brightness, low-cost reflection, and basic video play/pause.
- [x] Add editor-only close-up inspection that saves/restores editor camera and leaves production camera metadata unchanged.
- [x] Add automated schema migration, off-state retention, aspect-fit and project asset-directory tests.
- [x] User confirmed all 13 Phase 03-E manual browser acceptance tests passed, including the image, video, off-state, transform, inspection and rendered behavior criteria. Individual test names/results were not enumerated in the report.
- [x] User explicitly accepted Phase 03-E (2026-11-03).

**Phase 03-E implementation evidence (2026-11-02):** Project schema v3, project-local image/video management and the R3F laptop display surface are implemented. Automated tests cover contain/cover geometry, v2 migration, off-state retention, managed upload, save/reopen and project duplication. The earlier computer-use inventory had no available browser/apps; the later user run recorded below supersedes that limitation for its reported tests.

**Phase 03-E user acceptance (2026-11-03):** The user explicitly confirmed **all 13/13 manual browser acceptance tests passed** and accepted Phase 03-E. This confirms the phase's required browser acceptance as reported. The user did not provide individual test names, screenshots, console transcript or performance measurements; no extra detail beyond the 13/13 result is inferred. **Phase 03-E accepted.** Unrelated Phase 03 checks above remain open, and overall Phase 03 is not marked complete.

**Phase 03-E finalization checks (2026-11-03):** `npm run typecheck`, `npm run lint`, `npm test` (33/33) and `npm run build` passed after acceptance. `git diff --check` passed. `.env`/`.env.local`, `node_modules`, and `.next` match `.gitignore`; no user project data, secrets, caches or temporary files appeared in the working tree.

## 6. Phase 04 — Character Models, Library & Scene Instances

**Phase status:** Phase 04-A accepted after user-confirmed 33/33 manual acceptance tests. Phase 04-B production models are not started.

### Phase 04-A — Reusable character library and project placement

- [x] Define validated stable-ID model registry with renderer, front-axis, default transform, placement roles, and only supported capability metadata. Registry exposes one explicitly temporary generic development model, not production character designs.
- [x] Separate model definitions, project-local named identities, character instances, and editable project-level presence state.
- [x] Create and rename identities, add multiple instances of the same identity, select from the Persian list or viewport, show/hide/remove, and edit position/rotation/scale with reset placement. User confirmed all 33 manual tests; rename, scaling/persistence, and panel usability were explicitly called out.
- [x] Render characters in a separate R3F layer with temporary placeholder and missing-model fallback; user-confirmed manual acceptance covers the character preview and editor behavior.
- [x] Persist independent character data; migrate schema v1-v3 to v4; keep v3 source data until successful save/backup; test reopen and project duplicate isolation.
- [x] Preserve existing prop/environment/display assignment data in schema migration tests.
- [x] Complete the interactive checklist and accept Phase 04-A (user-confirmed 33/33 PASS).

**Automated evidence (2026-11-02):** After the rename/scaling fix, `npm run typecheck`, `npm run lint`, `npm test` (39/39), `npm run build`, and `git diff --check` passed. Character tests cover rename validation and ID stability, independent scale, gizmo scale bounds, save/reopen, identity/instance separation, unknown model references, v3 migration, and project duplication; legacy v1/v2 and prop/display regressions also passed. These checks do not verify rendered interaction.

**Manual browser report (2026-11-02):** The user initially reported 30 PASS, 1 FAIL, and 2 NOT VERIFIED. Follow-up explicitly confirmed all **33/33 PASS**, including the fixed rename test, character scaling and persistence, and Persian panel usability. The user explicitly accepted Phase 04-A. Individual outcomes for the original 30 tests were not itemized; the aggregate 33/33 is the acceptance source of truth.

**Manual browser checklist — accepted by the user's 33/33 report:**

- [x] Create and rename an identity; confirm the catalog marks its model as temporary.
- [x] Add two instances of one identity; confirm both are visible, separately selectable, and neither moves the other.
- [x] Select each instance from the list and click the viewport model; confirm properties selection matches.
- [x] Hide and show each model and confirm viewport visibility changes.
- [x] Move, rotate (including facing direction), and scale by gizmo and numeric fields; verify orbit resumes after gizmo drag and invalid scales are rejected.
- [x] Reset placement; remove one instance; confirm the identity remains available and another instance is unchanged.
- [x] Save, refresh, reopen the same project, and verify identities, visibility and transforms persist.
- [x] Switch projects and duplicate a project; confirm character state is independent.
- [x] Open an existing project and confirm environment props, laptop media assignments, and character fallback remain valid.
- [x] Check narrow/responsive UI, keyboard focus, browser console, orbit/zoom, and responsiveness on integrated graphics.

**Unverified:** No Phase 04-A acceptance item remains open according to the user's 33/33 report. Unrelated, previously open checks from other phases are unchanged.

### Phase 04-B — Approved production character models (not started)

- [ ] Implement approved Kamyar, ChatGPT and Claude production concepts from the revised character requirements; replace renderer without changing identity or instance IDs/transforms.
- [ ] Verify actual model appearance, orientation and future supported capabilities before exposing them as available.
- [ ] Obtain separate Phase 04-B approval.

## 7. Phase 05 — Scene Manager, Storyboard & Timing

**Phase status:** Not started.

- [ ] Create, rename, duplicate, delete and drag/reorder scene cards.
- [ ] Define independent scene settings, duration and environment references.
- [ ] Derive global offsets from scene order and explicit transition timing policy.
- [ ] Implement scene-only and full-episode preview boundaries.
- [ ] Verify scene switching/duplication does not distort characters, props or camera.
- [ ] Verify changes persist after restart and scene duration affects actual preview behavior.
- [ ] Obtain Phase 05 approval.

## 8. Phase 06 — Audio Assets & Manual Speaker Assignment

**Phase status:** Not started.

- [ ] Upload, preview, replace, remove and persist WAV/MP3 audio files locally.
- [ ] Render a real waveform and editable speaker intervals.
- [ ] Assign any interval to a character ID, audio-only speaker or explicitly unassigned/silent state.
- [ ] Support split, merge, drag, resize, seek and segment-only preview.
- [ ] Ensure mixed recordings do not default to Kamyar and deleted audio never returns automatically.
- [ ] Verify speaker changes across several intervals, plus save/reload behavior.
- [ ] Obtain Phase 06 approval.

## 9. Phase 07 — Deterministic Timeline & Behavior Priorities

**Phase status:** Not started.

- [ ] Build a pure project-at-frame evaluator independent of UI and Three.js objects.
- [ ] Define event boundaries, global/scene-local timing and overlap policy.
- [ ] Evaluate character visibility, active speaker, animation layers and camera deterministically.
- [ ] Apply manual > approved AI > automatic dialogue > idle precedence **only on conflicting layers**.
- [ ] Verify random-order and sequential frame evaluation produce the same state.
- [ ] Test hidden speaker handling, event priority and exact boundary frames.
- [ ] Obtain Phase 07 approval.

## 10. Phase 08 — Facial Animation, Gaze & Reactions

**Phase status:** Not started.

- [ ] Implement real mouth/face animation on compatible Kamyar and robot models, not decorative placeholders.
- [ ] Only the assigned visible speaker animates its mouth; audio-only speakers do not animate unrelated mouths.
- [ ] Implement natural blinking, listening, facial expression and supported gestures.
- [ ] Implement body orientation separately from constrained head/eye gaze and safe target fallbacks.
- [ ] Support layered reactions, timeline control and behavior priority rules.
- [ ] Verify seek/pause behavior and visually inspect animation on actual models.
- [ ] Obtain Phase 08 approval.

## 11. Phase 09 — Cameras & Scene Direction

**Phase status:** Not started.

- [ ] Separate inspection/edit camera from production camera.
- [ ] Implement scene-specific shot presets, camera timeline events and transitions.
- [ ] Provide persisted director notes and **distinct** executable direction events.
- [ ] Ensure off-screen/hidden characters are not incorrectly targeted by automatic camera logic.
- [ ] Verify direct seeking, repeatability, transitions and stored camera edits.
- [ ] Obtain Phase 09 approval.

## 12. Phase 10 — End-to-End UX & Preview Stabilization

**Phase status:** Not started.

- [ ] Complete understandable Persian navigation, contextual panels, tooltips and beginner workflow.
- [ ] Keep 3D viewport and multi-track timeline easy to access while editing.
- [ ] Implement reliable click-to-Play/Pause on normal and fullscreen preview.
- [ ] Complete end-to-end user journey from project creation to full preview and reopening.
- [ ] Test every visible control; disable/notate unsupported features rather than faking them.
- [ ] Run automated browser tests plus a documented manual walkthrough.
- [ ] Obtain Phase 10 approval.

## 13. Phase 11 — Offline Frame Rendering & MP4 Export

**Phase status:** Not started.

- [ ] Evaluate renderer package/graphics compatibility and licensing before adding dependencies.
- [ ] Implement independent frame evaluation and 3D capture without relying on real-time MediaRecorder screen recording.
- [ ] Transfer validated local assets and a stable project snapshot to renderer.
- [ ] Synchronize original audio and scene/camera/character state with frames.
- [ ] Implement 720p/30 FPS MP4 baseline, error reporting, progress, cancellation and cleanup.
- [ ] Produce and **inspect** a playable short multi-scene export with correct audio and visuals.
- [ ] Obtain Phase 11 approval.

## 14. Phase 12 — Environment Composition & Asset Import

**Phase status:** Not started.

- [ ] Import compatible GLB/glTF props and validated environment assets.
- [ ] Arrange props/lights/cameras into a reusable environment composition.
- [ ] Save and reuse an environment without altering other scenes.
- [ ] Validate imported rig/animation capabilities rather than promising universal animation.
- [ ] Verify imported asset survival across application restart.
- [ ] Obtain Phase 12 approval.

## 15. Phase 13 — Optional AI Director

**Phase status:** Not started.

- [ ] Provide opt-in, provider-independent AI proposal interface.
- [ ] Validate suggestions against actual character and action capabilities.
- [ ] Support review, edit, accept, reject and undo; never overwrite manual changes silently.
- [ ] Verify full offline manual use remains possible without AI.
- [ ] Obtain Phase 13 approval.

## 16. Phase 14 — Optional Advanced Creation

**Phase status:** Not started, outside initial MVP.

- [ ] Evaluate procedural/parametric character creation and advanced environment authoring.
- [ ] Evaluate optional mesh editing, rigging or AI-assisted asset creation as separate approved projects.
- [ ] Define feasibility, hardware constraints and licensing before implementation.
- [ ] Obtain explicit approval for any advanced feature.

## 17. Cross-Cutting Quality Gates (Every Implementation Phase)

- [ ] Phase-specific typecheck, lint and build results recorded (per phase, not one global pass).
- [ ] Relevant unit and integration tests pass and are named in handoff.
- [ ] Interactive features are browser-verified or explicitly left unchecked as unverified.
- [ ] No regression in existing scene state, assets, audio or saved projects.
- [ ] No known misleading controls or unsupported features represented as working.
- [ ] Performance/resource cleanup risks inspected for affected subsystems.
- [ ] `BUG_TRACKER.md` and `DECISIONS.md` updated when appropriate.
- [ ] This checklist updated with verifiable evidence and user acceptance.

_These cross-cutting items are a repeatable gate template. Recheck and record them separately for each phase; do not permanently mark the entire section complete after one milestone._

## 18. Phase Handoff Record Template

Copy for each development phase (append below or link to a dated handoff):

```md
### Phase NN — Title

- Date:
- Implemented scope:
- Explicitly deferred scope:
- Files changed:
- Typecheck / lint / build:
- Automated tests (name + result):
- Browser/manual checks (steps + result):
- Known bugs / blockers (IDs):
- Context documents updated:
- User acceptance: Pending / Approved (date)
- Final status: Not started / In progress / Implemented-unverified / Blocked / Verified
```

## 19. Current Baseline Summary

**Verified application milestones: 0 / 14** (Phases 01–14).  
**Phase 00:** documentation drafts prepared, final consistency and local-file confirmation pending.  
**Next action:** place and review this checklist, create `BUG_TRACKER.md`, `DECISIONS.md` and `AGENTS.md`, then complete Phase 00 review.  
**Reminder:** no feature of the deleted earlier prototype should be carried forward as implemented.
