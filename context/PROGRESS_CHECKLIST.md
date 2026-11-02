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
- A later phase starts only with explicit user authorization and an accepted handoff. A user-approved MVP/prototype handoff may authorize scoped iterative development while noncritical verification debt remains; it does not mark unchecked tests as passed or constitute production acceptance. Stop for confirmed critical functional, data-integrity, persistence, security, or incompatible-migration blockers.

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

**Phase status:** Phase 04-A accepted after user-confirmed 33/33 manual acceptance tests. On 2026-11-02 the user explicitly approved the current four character prototypes, including Hamid's corrected appearance. No individual manual test results or view-specific checks were reported; this approval supersedes the earlier prototype-appearance rejection without implying unreported checks. Other detailed interaction/performance checks remain as recorded below.

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

### Phase 04-B — Character models and appearance presets (MVP/prototype handoff accepted; functional and production verification pending)

- [x] Add distinct Kamyar, ChatGPT and Claude lightweight procedural renderers, each with a stable model/renderer ID and a +Z forward direction.
- [x] Add per-model capability metadata and functional appearance settings that change rendered geometry/materials.
- [x] Add Persian appearance controls, reset, save and reusable project-local identity behavior.
- [x] Add project schema v5 with backward-compatible v4 migration; preserve saved identities and placements and only map the empty legacy development identity to Kamyar.
- [x] Add automated coverage for distinct models, validated independent appearance, migration, save/reopen and duplicate project isolation.
- [ ] Verify model appearance, face/beard/robot screen, studio placement, intersections and camera framing in an actual browser.
- [ ] Verify appearance customization is visible and independent across identities and survives refresh in the browser.
- [ ] Verify no browser console issues and acceptable integrated-graphics responsiveness.
- [x] User approved the four current character models for MVP/prototype use and explicitly authorized Phase 04-C1 under the MVP handoff policy (2026-11-02).
- [ ] Complete the outstanding functional/browser checks above before final production-quality acceptance.

**MVP handoff reconciliation (2026-11-02):** The user approved Kamyar, ChatGPT, Claude, and Hamid for MVP/prototype development and explicitly authorized Phase 04-C1. This does not accept Kamyar or Hamid as final production-quality models and does not verify unreported browser behavior. Under the revised handoff policy in `AGENTS.md` and ADR-038, Phase 04-C1 may proceed while the existing noncritical functional/browser checks remain verification debt. Keep every unchecked test below and in the B1–B4 subsections open; production-quality acceptance still requires them.

**Preserved manual result:** The user reported 8 PASS and 2 FAIL from a 10-check manual run. The two reported failures were ChatGPT appearance/OpenAI chest logo and main studio wall-sign customization; the other eight were not itemized. This record is preserved as reported. The later prototype approval does not rewrite those outcomes or establish that either failed workflow was retested.

**Mandatory handoff checks still unverified:** In a browser, confirm (1) two identities/instances from a supported model remain independent when appearance and transforms are changed; (2) character add/remove/show/hide/select/transform and seat assignment/occupancy preserve project data; (3) appearance controls visibly work and save/reopen; (4) changing an existing identity's base model preserves identity/instance IDs, transforms and compatible settings; (5) each prototype's placement, orientation and prop clearance are usable; (6) missing-model fallback is safe; and (7) there are no relevant console errors and responsiveness is acceptable on the target integrated graphics. The B1–B4 specific browser checks below also remain open. The wall-sign failure is retained as an unrelated studio issue.

**Automated verification (2026-11-02):** Typecheck passed; lint passed; 43 automated tests passed (including model definition/capability, per-identity customization, v4 migration, persistence/duplication/deletion, and existing environment/media regressions). Production build passed. These checks do not verify visual quality.

**Manual visual acceptance checklist — all pending:**

- [ ] Inspect Kamyar from front and side; confirm hair, face and beard attach correctly and seated proportions suit the studio.
- [ ] Inspect ChatGPT's white body, digital face, small proportions and forward direction.
- [ ] Inspect Claude's warm palette and distinct silhouette.
- [ ] Change each exposed appearance field and confirm the actual model updates.
- [ ] Confirm two identities from the same model keep independent appearance and transforms.
- [ ] Save, refresh, and reopen; confirm names, appearance, visibility and placement persist.
- [ ] Check placement around seats, microphones, desk and laptop; verify no obvious intersections.
- [ ] Check viewport selection/orbit, narrow layout, browser console and integrated-graphics responsiveness.

**Limitations:** These are lightweight procedural first-pass models, not authored production assets. No skeletal/facial rig, morph targets, lip sync, gaze, or animation capability is implemented. There is no browser visual evidence in this run.

### Phase 04-B1 — Claude cube mascot correction (prototype appearance approved; functional browser checks pending)

- [x] Replace the animal-like Claude silhouette with an orange rounded-cube head/body, flat forward face, short block legs, and large over-ear headphones.
- [x] Give each rectangular eye and the small horizontal mouth its own named geometry group for future expression controls; no animation capability is claimed.
- [x] Preserve the existing model ID, renderer key, default scale, customization keys, identity/instance IDs, and project schema. Existing body/face/headphone settings still affect the replacement model.
- [x] Add focused regression coverage for the stable model reference, supported customization, named face parts, cube renderer, headphones, and lower limbs.
- [ ] Inspect Claude from front and oblique views in the actual Studio 01 viewport; verify cube readability, headphone placement, scale, seating, desk/microphone/laptop clearance, and coexistence with other characters.
- [ ] Change and save each Claude appearance setting; refresh/reopen and verify values and independent transforms remain correct.
- [ ] Check browser console and integrated-graphics responsiveness.

**Prototype approval:** Covered by the user's four-model prototype approval above. It does not verify the listed Claude customization, persistence, clearance, console, or performance checks.

### Phase 04-B2 — ChatGPT robot visual refinement (prototype appearance approved; reported FAIL and functional checks retained)

- [x] Refine the existing stable ChatGPT renderer with a rounded shell, soft expressive cyan eyes, highlights, brows, an independent curved friendly smile, and a polished dark display.
- [x] Add improved white body, neck and shoulder connections, articulated lightweight arms/hands and subtle mechanical joints.
- [x] Add a separate correctly proportioned OpenAI chest mark as an SVG visual component, sourced and attributed in `public/characters/openai-mark.svg`.
- [x] Preserve the existing model ID, renderer key, default scale, customization keys, identity/instance references, transforms, seat assignments and other renderers.
- [x] Add structural regression tests for the stable registry contract, independent facial components and sourced chest logo.
- [x] Add 11 coordinated static ChatGPT facial presets with genuinely different mouth geometries, eye proportions/direction and brow shapes; preserve old saved expression values through aliases. Human renderers expose no unsupported robot expressions.
- [x] Generalize the existing saved anchor assignment to seat, supported tabletop and platform points, with model-specific support offsets, anchor scale/surface validation, occupancy/near-overlap checks, and unrestricted unassigned manual positioning.
- [x] Add stable Studio 01 desk-top and rug-platform anchor IDs without moving furniture; keep the old seat API, seat offsets and project schema compatible.
- [x] Document future target gaze, eye/head/body priority, local POV camera anchors and natural facial animation without implementing their runtime behavior.
- [x] Add focused regression coverage for all expression mouth/eye/brow variants, valid and rejected surface placements, overlap prevention, legacy expression/seat compatibility and persisted anchor IDs.
- [ ] Inspect face expression and logo placement from front and oblique views in the actual Studio 01 viewport; check scale, seat, desk, microphone and laptop clearance.
- [ ] Verify face-style customization remains visible, accessory behavior, browser console and integrated-Radeon responsiveness.

**Manual acceptance retest:** The user reported 8 PASS and 2 FAIL out of 10 checks. The failures were ChatGPT visual appearance/OpenAI chest logo and main studio wall sign customization. The other eight were not itemized, so no additional pass is inferred. Targeted refinements and regression checks are recorded under BUG-0012 and BUG-0015; both failed items remain unchecked pending browser retest.

**Prototype approval reconciliation:** The later approval of all four models accepts ChatGPT's current appearance for prototype use. It does not change the historical FAIL above or demonstrate a retest of the face/logo, expression presets, appearance controls, studio clearance, console, or integrated-graphics behavior. The wall-sign failure is unrelated and remains open under its existing record.

**Targeted regression run (2026-11-02):** Typecheck, lint, 69/69 automated tests, and production build pass after the reported failures were addressed in code. This does not supersede the two failed manual results; browser retest and visual acceptance remain pending.

**Automated verification (2026-11-02):** After adding static expression, generic surface-placement and object selection/edit-mode support, `npm run typecheck`, `npm run lint`, `npm test` (58/58), `npm run build`, and `git diff --check` passed. No browser interaction or rendered appearance is claimed.

**Status:** Implementation and automated regression coverage complete; visual acceptance remains pending. Static expressions are supported through discrete geometry presets only; there are no blink, automatic gaze, expression transitions, lip sync, blend shapes or rig controls. See BUG-0012.

### Phase 04-B3 — Stylized procedural human characters (prototype appearance approved; detailed checks pending)

- [x] Preserve `character-model:kamyar`, `kamyar-stylized`, +Z forward direction, default scale, seat contact metadata, identity/instance IDs and saved transforms.
- [x] Continue Kamyar as a lightweight stylized procedural model; use original photos for supported identity cues and group references for style. Photorealistic reconstruction is out of scope.
- [x] Keep identity, instance, transform, placement and saved appearance contracts; preserve the optional GLB importer as a future capability.
- [x] Add nine geometry-backed cuts: textured quiff, side part, short curls, medium waves, slicked back, short fade, crew cut, buzz cut and bald. Top clumps vary in count, flow, texture, height and side profile rather than only scale/color.
- [x] Add clean-shaven, light/medium stubble, short boxed beard, full trimmed beard, goatee, mustache-only and mustache-with-stubble coverage; jaw patches follow the head surface and supported beard styles include fine surface detail.
- [x] Improve facial surface shaping and subtle upper-eyelid definition; use restrained hair-root/highlight material variation without postprocessing.
- [x] Keep existing Persian registry-driven customization, identity-local colors/styles, reset, visibility and project persistence. Map old saved preset IDs to the new styles and safely default unsupported grooming options.
- [x] Add Hamid as a separate stylized procedural model and renderer with independent head geometry, short dark hair, light stubble, black T-shirt, and continuous fuller-torso profiles.
- [ ] Inspect Kamyar from front, side and three-quarter views in Studio 01; verify hairline, jaw/beard/mustache, glasses, clothing, seat contact and desk/microphone clearance.
- [ ] Change each appearance field, save, refresh/reopen, and confirm independent identity settings and transform persistence in a browser.
- [ ] Check browser console and integrated-Radeon performance.

**Automated verification (2026-11-02):** `npm run typecheck`, `npm run lint`, `npm test` (84/84), and `npm run build` pass. Tests validate distinct geometry contracts, preset fallback, customization persistence and identity independence, not resemblance or visual quality.

**Status:** The earlier visual rejection is superseded by the user's explicit approval of the current four character prototypes on 2026-11-02. The approval did not itemize grooming variants, seat clearance, console or performance checks. The models remain stylized prototypes; the optional GLB importer is preserved.

### Phase 04-B4 — Hamid stylized character prototype (prototype appearance approved; functional checks pending)

- [x] Register `character-model:hamid` with its own `hamid-stylized` renderer, placement metadata and capability-backed appearance fields.
- [x] Create independently shaped head geometry and a continuous fuller T-shirt torso surface with bounded natural/fuller/full body profiles.
- [x] Add identity-scoped hair, facial hair, color, clothing and body-profile customization using the existing Persian model-driven controls.
- [x] Preserve schema v5, IDs, transforms, placement, project save/reopen and duplication contracts with focused regression coverage.
- [ ] Inspect front, side and three-quarter views in Studio 01; verify face, hair, stubble, abdomen silhouette, guest-seat fit, desk/microphone clearance, browser console and integrated-Radeon responsiveness.

**Acceptance record:** The user explicitly approved the current four character prototypes, including Hamid's corrected appearance. No individual test count, view coverage or browser measurements were supplied. Hamid remains a stylized prototype rather than a production model; studio fit and performance are not inferred from the approval.

**Automated verification (2026-11-02):** Typecheck, lint, `npm test` (85/85), production build and `git diff --check` pass. The browser inventory was empty, so rendered appearance and studio fit remain unverified.

## Studio 01 room, lighting and laptop realism upgrade (implemented; browser review pending)

- [x] Add a right-side wall and ceiling with overlapping wall/floor/roof boundaries; keep the front open for the editor's audience-facing camera.
- [x] Add transient editor-only visibility control for room walls and ceiling; it does not alter saved prop visibility or project JSON.
- [x] Add persisted project-level key/fill/accent intensity, warm/neutral/cool presets, practical-light toggle and reset, using backward-compatible defaults in existing Studio 01 arrangements.
- [x] Replace keyboard stripes with one compact bilingual Persian/English legends texture; add touchpad edge, ventilation slots, side ports, screen webcam and independent hinges without changing laptop prop origin or media surface.
- [x] Add regressions for lighting limits/default/reset/save/reopen/project duplication, enclosure and editor-only visibility wiring, laptop details, and existing environment/media contracts.
- [ ] Browser-check room joins and camera visibility, side/rear orbit with wall toggle, lighting appearance/reset/persistence, laptop detail alignment, educational media playback, console and target-GPU performance.

**Automated verification (2026-11-02):** `npm run typecheck`, `npm run lint`, `npm test` (87/87), `npm run build`, and `git diff --check` passed. No browser surface was available, so visual appearance, camera sightlines, settings interaction, console and integrated-Radeon performance remain unverified.

#### Phase 04-B3 hair and beard refinement

- [x] Replace the tight scalp-shell appearance with a fitted base plus raised swept lock surfaces, clear hairline profiles, and style-dependent crown/side/back shaping.
- [x] Provide clean-shaven, light/medium stubble, short-boxed/full-trimmed beard, mustache-only, mustache-with-stubble and goatee options; fit facial hair to the jaw and keep the lip area clear.
- [x] Set reference-inspired defaults to neat side-parted dark hair and close trimmed beard from `kamyar1.jpg`–`kamyar3.jpg`.
- [x] Provide nine distinct style definitions with raised clump geometry and separate profile/flow controls.
- [x] Retain independent hair/beard color, beard visibility, glasses and identity-scoped settings; safely normalize previously saved preset IDs.
- [x] Add geometry distinction, option validation, save/reopen, duplication and identity-isolation regression coverage.
- [ ] Browser-check front, side and three-quarter silhouettes, each grooming preset, colors, reset defaults and project duplication.

**Automated verification:** Geometry assertions establish distinct mesh data and control contracts, not visual quality. Current check results are recorded above; Phase 04-B3 remains pending manual visual acceptance.

### Character library base-model replacement

- [x] Allow an existing identity to select a different registered model without changing its ID or custom name.
- [x] Preserve linked instance IDs, visibility, transforms and placement anchors; update shared model rendering through the existing identity reference.
- [x] Keep only appearance fields accepted by the target model; preview incompatible custom values and confirm before replacing them with target defaults.
- [x] Persist the replacement through the revision-checked project save path; cover reload, multiple instances and independent identities with regression tests.
- [ ] Browser-verify the Persian confirmation, library/properties/viewport refresh and save/reopen workflow.
- **Registry limitation:** Current selectable model registry contains Kamyar, ChatGPT and Claude; a Hamid base model is not registered yet.
- **Automated verification:** `npm run typecheck`, `npm run lint`, `npm test` (61/61), `npm run build`, and `git diff --check` pass.
- **Status:** Implemented; browser acceptance not verified.

### Studio prop selection/edit-mode UX extension

- [x] Separate temporary prop selection from transform edit mode; single-click selects without a gizmo and double-click enters Move-first edit mode.
- [x] Add Persian panel selection/edit/Move/Rotate/Scale/finish controls; retain numeric transforms while merely selected.
- [x] Exit on Escape or selection change; protected props cannot show gizmos; restore camera navigation after gizmo drag cleanup.
- [x] Add state-transition, protected-object, temporary-persistence and OrbitControls lock regression tests.
- [ ] Browser-verify mouse single/double-click, Escape, touch panel controls, camera orbit/pan, drag cancel, prop selection outline and persistence; preserve character-edit behavior and laptop media.
- **Status:** Implemented; typecheck, lint, 58/58 tests, build and diff check pass. Interactive acceptance remains unverified. See BUG-0013.

### Character seating placement correction (implemented; browser verification pending)

- [x] Tie Studio 01 seated-anchor surface height to the rendered chair seat specification without changing chair placement.
- [x] Add local support/contact-height metadata per registered character model; the later explicit-assignment extension below supersedes implicit seated placement for newly added instances.
- [x] Preserve existing saved transforms and allow manual Y adjustment; no project schema migration is required.
- [x] Add regression coverage for all registered models, generic future models, chair-origin stability, and manual transform behavior.
- [ ] Verify host, co-host and guest seating in the browser, including feet/limbs, chair intersections, desk and microphone clearance.
- [ ] Save, reopen, and verify adjusted transforms remain unchanged; verify add/remove/show/hide and studio props.

**Status at initial correction:** The original alignment logic was automated-tested (46/46); the later Phase 04-B seating-assignment extension below changes this to explicit assignment. Visual seating, collision clearance, browser console, and integrated-GPU behavior remain unverified until a real viewport check.

### Phase 04-B extension — Reusable character seating assignments

- [x] Make new character instances unassigned by default; remove model-specific seat-role preferences.
- [x] Assign/unassign stable environment seat IDs from the Persian character editor; prevent occupied-seat selection and enforce conflicts in the domain operation.
- [x] Align explicit seat assignments with anchor surface/facing and model contact, local position, and yaw offsets using the instance's current scale.
- [x] Preserve manual transforms on save/reopen and same-seat selection; unassigning retains the current transform.
- [x] Preserve optional assignment compatibility for older projects; report unknown/missing anchors and offer safe unassignment without migration.
- [x] Add assignment, occupancy, persistence and backward-compatibility regression tests.
- [ ] Verify seat selection, occupied seats, save/reopen, missing-seat fallback, manual transform editing and studio/media regressions in a browser.

**Status:** Implementation complete; `npm run typecheck`, `npm run lint`, `npm test` (47/47), and `npm run build` passed. Browser interaction and visual seating remain unverified because this session has no available browser.

**Automated verification (2026-11-02):** `npm run typecheck`, `npm run lint`, `npm test` (44/44), and `npm run build` passed. Geometry regression tests validate renderer structure and stable customization contracts; they cannot establish visual quality or fit. The CUA browser inventory was empty, so studio appearance, intersections, console behavior and GPU responsiveness are not verified.

### Character identity deletion bug — implemented, browser verification pending

- [x] Add a separate Persian identity deletion action; model definitions and shared model files remain in the registry.
- [x] Require explicit confirmation before deletion.
- [x] Refuse deletion while any scene instance references the identity; explain that each instance must first be removed with «حذف از صحنه».
- [x] Persist the deletion before removing the identity from the visible library; report save failures and keep the identity visible.
- [x] Safely reject missing/repeated deletion attempts and preserve other identities and instances.
- [x] Add automated operation, dependency, model-protection, repeated-attempt and save/reopen coverage; existing rename/add tests remain passing.
- [ ] In the browser, delete an unused identity after confirmation and verify it disappears only after save succeeds.
- [ ] Verify identity deletion is blocked while used, then remove its instance separately and delete the identity.
- [ ] Refresh/reopen and verify deletion persists while unrelated identities, instances, model definitions and character editing remain intact.

**Status:** Fix implemented and automated tests passed; BUG-0009 remains `FIXED_UNVERIFIED` until user browser verification.

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

### Studio 01 Decoration, Camera and Viewport Interaction Extension (implemented; acceptance pending)

- [x] Add optional backward-compatible customization for the existing cyan sign and two independently configured wall frames.
- [x] Reuse project-local image assets; validate decoration image references against each project's asset manifest.
- [x] Add editor orbit/pan/zoom limits supporting side and rear views and a reset action without changing production-camera state.
- [x] Make prop viewport single-click inert; double-click selects and enters edit mode; retain explicit panel selection/edit actions and protected-object rules.
- [x] Add focused regression tests for saved decoration settings, frame independence, camera controls and interaction wiring.
- [x] `npm run typecheck`, `npm run lint`, `npm test` (66/66), `npm run build` pass.
- [ ] Manually verify decoration visuals/uploads/reopen, camera movement/reset, double-click and panel editing, Escape, drag lock restoration and laptop/media regression in a browser.
- **Status:** Implemented; browser acceptance remains pending because no browser surface is available in this session. Kamyar Phase 04-B3 is tracked separately above.

### Editor workspace UI/UX upgrade (user rejected; recovery implemented, unverified)

- [ ] The earlier single-column inspector layout was rejected by the user: full section editors and selected properties competed in a narrow scroll region, while the viewport was undersized. Its 74 passing tests did not establish usability.
- [ ] Recovery uses separate section/properties tabs in the left panel, keeps the preview and timeline visible, and provides a mobile drawer. Browser acceptance is still required.
- [x] Panel state transition tests cover navigation, selection, collapse and mobile dismissal without persisted state.
- [ ] Browser-check representative desktop, tablet, and mobile sizes, panel toggle/scroll, nav, viewport aspect, and existing object/character interactions.
- [ ] Consider drag resizing only after browser review demonstrates a need and a stable implementation path.
- **Status:** Previous layout rejected. Recovery code is implemented but browser-unverified; do not mark this UI accepted.

### 3D viewport enlargement and fullscreen mode (implemented; browser acceptance pending)

- [x] Reduce desktop workspace padding and inspector width modestly; increase the normal 16:9 viewport size without hiding editor panels or timeline.
- [x] Add a viewport-only Fullscreen API toggle with Persian accessible labels/tooltips, synchronized `fullscreenchange` state, Escape exit, and graceful unsupported/denied feedback.
- [x] Keep the existing R3F scene mounted; use fullscreen CSS sizing so the canvas responds to container resize while the production frame stays 16:9. Fullscreen state is not persisted and does not change editor or production camera state.
- [x] Add focused tests for enter/exit, unsupported/denied requests, browser state synchronization, scene mount stability, aspect ratio, and responsive layout rules.
- [ ] Browser-check normal viewport size and desktop/tablet/mobile fullscreen enter/exit, Escape, camera/selection retention, canvas resize, controls visibility, aspect framing, denied/unsupported fallback, panel/layout restoration, and absence of console errors.
- **Automated verification (2026-11-02):** `npm run typecheck`, `npm run lint`, `npm test` (91/91), `npm run build`, and `git diff --check` passed. Browser inventory exposed no browser or app surface; the manual checks below remain unverified.
- **Status:** Implemented; browser acceptance remains pending.

### Phase 04-B3 — Reusable GLB character adapter

- [x] Add an optional validated GLB reference to code-owned character model definitions while retaining a procedural fallback renderer and stable model IDs.
- [x] Load GLBs through Three.js, inspect bounds and actual named parts/rig data, and clone skeletons and materials for independent instances.
- [x] Validate declared material/mesh appearance bindings, expected height and seat-contact plausibility before displaying an authored model.
- [x] Show Persian loading/failure states and retain the procedural renderer if an asset is unavailable or malformed.
- [x] Keep project identity, instance, transform, placement and appearance serialization unchanged; existing project regression tests remain active.
- [x] `npm run typecheck`, `npm run lint`, `npm test` (80/80) and `npm run build` pass. Focused GLB tests cover metadata, validation, missing-file retry and independent skinned instances.
- [ ] Add and review a production Kamyar or Hamid GLB. None is supplied or registered.
- [ ] Manually verify a real authored GLB in the browser from front, side and three-quarter angles, including seat/desk clearance, controls, load failure and integrated-GPU behavior.
- **Status:** Adapter implemented; Phase 04-B3 character acceptance remains pending a reviewed asset and browser inspection.

### Phase 04-B3 extension — project-local GLB import and library integration

- [x] Add Persian import action and a focused preview dialog with local GLB parsing, orbit/zoom, front/side/back/reset, bounds, scale, target height, forward rotation, automatic floor alignment, optional seating offset, and discovered structure details.
- [x] Validate extension, 64 MiB limit, GLB v2 signature/chunks/geometry, embedded buffers/textures, inspected bounds and named colorable material bindings before rendering/saving.
- [x] Save each imported GLB and its reusable model definition into project-local asset storage; expose it through the existing model selector and renderer; preserve identity/instance/transform IDs.
- [x] Reopen and duplicate project metadata/bytes, recover missing assets through the adapter state, and block deletion while an identity uses the imported model.
- [x] Add isolated tests for valid/malformed imports, storage/reopen, independent repeated imports/instances, duplicate URL rewriting and dependency-safe removal.
- [x] Typecheck, lint, 84/84 tests, production build and `git diff --check` pass.
- [ ] Manually verify import, preview controls, real authored asset rendering, add/replace, save/reopen, duplication, responsive layout, console and integrated-GPU behavior in a browser.
- **Status:** Implemented; browser/model-quality acceptance pending. No production character GLB is included.
- **Manual checklist:** Choose a valid GLB; inspect parse/upload feedback and front/side/back/orbit/zoom/bounds/scale/orientation; cancel and confirm; add the imported model to the scene; create/change an identity; save/reopen and duplicate; verify missing/invalid assets, existing ChatGPT/Claude/Kamyar, desktop/tablet layout, console, and target-GPU responsiveness.

### Empty-space deselection interaction follow-up

- [x] Clear prop selection and edit mode on genuine empty R3F pointer misses and protected room geometry clicks.
- [x] Escape clears selection, edit mode and inspection state; prop single-click remains inert and double-click switches the edited prop.
- [x] Add regression checks for switching, empty clicks, Escape, protected geometry, gizmo propagation, drag threshold and panel isolation.
- [x] Typecheck, lint, 68/68 tests and production build pass.
- [ ] Manually verify mouse/touch behavior in a browser.
- **Status:** Implemented; browser acceptance remains pending because no browser surface was available in this session.

### Phase 04-C1 — Deterministic character preview foundation (implemented; browser acceptance pending)

- [x] Added a pure explicit-source-time evaluator for neutral, gentle head turn, head nod, arm gesture, and return-to-idle poses; evaluation is repeatable at arbitrary timestamps and bounded.
- [x] Added model capability gates backed by named procedural pivots. Kamyar, Hamid and ChatGPT support head/arm preview; Claude supports head preview only. GLB skeleton/clip metadata remains diagnostic and does not imply preview support.
- [x] Corrected human/robot arm pivot origins to shoulders without changing rest-pose mesh placement.
- [x] Added per-instance ephemeral playback, start/stop/reset, smooth return-to-idle, demand invalidation while active, and RAF cleanup. Saved project schema and world transforms are unchanged.
- [x] Added Persian preview controls with unsupported actions visibly disabled and explained.
- [x] Added regression tests for capabilities, supported/unsupported actions, deterministic timestamps/seeking, bounds, independent results, return-to-idle, transient state separation and cleanup wiring.
- [x] `npm run typecheck`, `npm run lint`, `npm test` (96/96), `npm run build`, and `git diff --check` pass.
- [ ] Manually verify each available action, natural motion limits, stop/reset, independent instances, saved transform preservation, demand-render idle behavior and Persian panel layout in a browser.
- **Status:** Implemented; Phase 04-C1 is not accepted until browser review. No automatic behavior, gaze, audio, lip sync, timeline, camera automation or export has been implemented.

### Phase 04-C2 — Expressive character preview (implemented; browser acceptance pending)

- [x] Added capability-gated emotional and gesture presets, including neutral, happy, sad, angry, surprised, excited, worried, confused, thinking, listening and laughing. A named-node adapter applies face poses to ChatGPT, Claude, Kamyar and Hamid's supported procedural components; imported GLBs remain unsupported.
- [x] Added bounded transient speed, intensity, transition duration, return duration and easing settings. Animation evaluation remains deterministic at explicit timestamps and preview data remains outside project persistence.
- [x] Added channel-level pose blending with deterministic priority resolution and regression tests for presets, capability checks, bounds, deterministic results and blending priorities.
- [x] Recovery regression coverage exercises actual named face-node transforms, mouth-shape visibility, blinking, reset, independent instances, gaze coexistence and demand-render invalidation; `npm run typecheck`, `npm run lint`, `npm test` (121/121), `npm run build`, and `git diff --check` pass (2026-11-04).
- [ ] Manually verify motion variety/timing, expression changes, stop/reset/interruption, independent instances, safe limits, panel usability and demand rendering in a browser.
- **Status:** Implemented; Phase 04-C2 remains pending user/browser acceptance. C3 manual gaze remains separately MVP-accepted; automatic speaker behavior, lip sync, timeline sequencing, camera automation and video export are not implemented by C2.
- **Preserved user manual report (2026-11-02):** 9 PASS / 3 FAIL. The nine passing checks were not itemized. Confirmed failures: (1) happy, sad, angry and surprised expressions are not clearly distinguishable; (2) supported eyes, mouths and eyebrows do not visibly change as expected; (3) energetic reactions are insufficiently faster and more expressive than calm reactions. These failures remain open and C2 is not accepted. C3 gaze work does not resolve or close them.
- **Recovery implementation (2026-11-04):** Traced the preview-to-render pipeline. Playback timestamps and demand invalidation were active; the missing link was a renderer adapter applying evaluated expression values to actual named face nodes, while mouth variants were split between static props and partial imperative changes. Added named mouth shapes and model-specific transforms, human limited-channel support, neutral expression preview, and deterministic playback blinking. Numeric/mock renderer integration tests pass. No actual browser viewport was available; visual result remains unverified and rejected pending retest.
- [ ] Manually verify front and three-quarter views at normal podcast distance, including expressions, facial visibility, reaction timing, gaze coexistence, stop/reset and transform preservation.
- **Additional open user report (2026-11-04):** Arm/hand gestures are limited; thinking lacks believable physical behavior; laughing/smiling mouth shapes, eyebrows and cross-face coordination are insufficient; excited reactions lack energy. These reports extend BUG-0024 and are tracked as BUG-0029/0030 where they describe new arm/hand and thinking behaviors. They are not passes and do not change the original 9 PASS / 3 FAIL report.
- [ ] Visually confirm happy, sad, angry, surprised, excited, worried, confused, thinking, listening, neutral and laughing are distinct on each model that claims support.
- [ ] Confirm visible eye aperture/direction, eyebrow position/orientation and mouth shape from front and three-quarter views at normal podcast distance; verify smooth transitions and restored neutral.
- [ ] Confirm smiling differs from laughing through mouth opening and coordinated eye narrowing; only claim cheek/jaw motion on models with actual controls.
- [ ] Confirm anger brows move inward/down, sadness inner brows lift, surprise brows rise, thinking can use a subtle asymmetric brow pose, and happiness coordinates relaxed brows with the smile.
- [ ] Confirm natural, connected arm/hand movement with supported shoulder/elbow/wrist/hand controls, and no penetration through face, body, desk or props. Do not mark unsupported models as capable.
- [ ] Confirm thinking includes hand-to-chin only on rigs with sufficient joint controls; otherwise report that limitation honestly. Verify head tilt, gaze, pauses, face coordination and smooth recovery where supported.
- [ ] Confirm excited reactions have faster onset and stronger but bounded coordinated motion than calm/thoughtful actions, with smooth deceleration and recovery.
- [ ] Confirm stop/reset, interruption, accepted C3 gaze coexistence, unchanged saved character transforms, independent simultaneous characters and acceptable target-device performance in a real browser.
- **Acceptance status:** All added visual and interaction checks remain unchecked until manual browser verification. C3's user-confirmed 8/8 MVP result remains preserved and separate; it does not accept C2 or these acting defects.

### Phase 04-C3 — Gaze and attention previews (implemented; browser acceptance pending)

- **Authorization/gate:** User explicitly authorized C3 for MVP/prototype development (2026-11-02). Under the AGENTS.md progression policy, C2's three reported visual failures are noncritical for this independent gaze milestone; no known critical functional, data-integrity, persistence, security or migration blocker was identified. C2 remains unaccepted.
- [x] Added a capability-gated, reusable gaze evaluator with explicit timestamp input, eased transitions, bounded head/eye/torso outputs, reachable-target reporting and safe neutral fallback.
- [x] Resolve stable character instance IDs to actual head anchors, prop IDs to world-space bounds, laptop gaze to its display surface, camera gaze to the active editor camera, plus custom world points and model-local directions.
- [x] Procedural head pivots are supported; ChatGPT's separate iris groups are additionally gaze-capable. Human and Claude models do not claim eye movement; no current renderer exposes a torso pivot; imported GLBs remain unsupported until a named rig adapter exists.
- [x] Added transient per-instance gaze state and compact Persian controls for target/direction, attention previews, transition duration and neutral return. Preview state is not project data and does not modify saved transforms.
- [x] Added regression coverage for capability gates, local/world transforms, parent transforms, timestamp determinism, target bounds, unreachable rear targets, missing targets, independent poses and transient persistence separation.
- [x] Final automated verification: `npm run typecheck`, `npm run lint`, `npm test` (108/108), `npm run build`, and `git diff --check` pass (2026-11-02).
- [x] User-confirmed **8/8 Phase 04-C3 manual browser tests PASS** (2026-11-02). The individual test names/results were not supplied; no per-case evidence is inferred.
- **Status:** Accepted for MVP/prototype development on 2026-11-02. Production-quality visual, performance and evidence requirements remain separate. C2's three confirmed visual failures above remain open.

### Phase 05 development handoff

- **Handoff:** User accepted Phase 04-C3 for MVP/prototype use and explicitly handed off Phase 05 — Scenes, Storyboard and Scene-Time Model — for development on 2026-11-02.
- **Status:** Authorized next milestone; not started. Phase 04-C3 production-quality acceptance remains open, and Phase 04-C2's three reported visual defects remain unresolved.

### Laptop close-up, fullscreen viewer and clean prop editing

- [x] Refined the laptop inspection pose to frame the real screen from a slight overhead/front angle, restoring the prior editor camera position, quaternion, up vector and target while leaving FOV unchanged.
- [x] Added a modal fullscreen viewer for the current project-local display image/video, with fit/brightness, video controls, state synchronization, Persian fallback messaging and close/Escape handling. It does not alter laptop media or camera state.
- [x] Restricted prop selection wireframes and gizmos to active edit mode; viewport single-click remains inert, double-click enters edit mode, and empty-space click clears the selection.
- [x] Added regression tests for camera framing/restoration, viewer state/media wiring and selection overlay gating.
- [x] `npm run typecheck`, `npm run lint`, `npm test` (102/102), `npm run build`, and `git diff --check` pass.
- [ ] Verify close-up readability, fullscreen image/video playback, Escape/close restoration, object selection/edit visuals and responsive behavior in a browser.
- **Status:** Implemented; visual/browser acceptance remains pending.

### Laptop presentation helpers and device-framed fullscreen

- [x] Added a manual viewport toggle for editor helpers. Prop and character selection/edit state remain intact while outlines and transform gizmos are hidden.
- [x] Laptop presentation uses the actual 3D laptop in the fullscreen viewport, with its display content still attached to the bezel and device. The previous inspection target is restored on exit, including Escape.
- [x] The secondary content-only viewer also temporarily suppresses editor helpers while open and restores their manual preference when closed.
- [x] Widened the inspection camera framing to retain more of the laptop body and bezel and aligned its up vector to the transformed display. The existing content-only fullscreen dialog remains available as a clearly labeled secondary viewing mode.
- [x] Added focused regression coverage for temporary helper visibility, presentation state restoration, screen orientation, and retained laptop rendering. `npm run typecheck`, `npm run lint`, `npm test` (109/109), `npm run build`, and `git diff --check` pass.
- [ ] Browser-check the close-up framing and device presentation at desktop and narrow sizes; confirm no character/prop occlusion, clean helper hiding/restoration, media readability, Escape behavior, and saved media/transform stability.
- **Status:** Implemented; visual/browser acceptance pending. No project schema or saved media data changed.

### Laptop educational viewer modes

- [x] Replaced the generic image modal presentation with explicit device-framed, screen-focus and separately labeled content-only modes. Device/screen modes use a laptop bezel and native display aspect ratio; uploaded media retains contain/cover and brightness behavior.
- [x] Added a Persian mode switcher and explicit fullscreen/exit controls. The selected mode remains active across fullscreen changes; Escape exits fullscreen while leaving the viewer open, and a second Escape or the close button dismisses it. Unsupported/denied fullscreen shows an in-dialog message.
- [x] Added focused reducer and source regression checks for mode selection, fullscreen mode retention, bezel/device framing, source sizing, helper hiding, display assignment compatibility and camera non-mutation.
- [ ] Browser-check device appearance, screen readability, media aspect/fit, fullscreen on varying dimensions, Escape state behavior, responsive controls and editor state restoration.
- **Status:** Implemented; browser and visual verification pending. Studio 01 geometry and adjustable lighting implementation are retained without project data changes.

### Laptop viewer device framing and safe image deletion

- [x] Fixed the device frame's collapsed auto-width by assigning a definite responsive width and deriving bezel/screen proportions from Studio 01's laptop visual spec. Added aligned bezel, screen aperture, hinge, keyboard, trackpad and lower body; content remains the assigned image/video with its existing fit and brightness.
- [x] Added imported-image library deletion with compact confirmation, loading/error feedback and project refresh. Explicitly separated laptop image unassignment from permanent asset deletion.
- [x] Project service checks serialized references under lock (laptop assignments, wall sign/frames and future project/scene references); blocks in-use deletion with an actionable conflict. Successful deletion backs up and updates the project manifest and removes only the requested image bytes.
- [x] Added tests for safe unreferenced deletion, retention of unrelated video assets, dependency blocking/persistence, future reference scans, laptop image-unassignment semantics, device proportions/alignment and camera-facing direction.
- [x] Automated verification: `npm run typecheck`, `npm run lint`, `npm test` (114/114), `npm run build`, and `git diff --check` pass.
- [ ] Browser-check the device view at desktop and narrow/short sizes, actual laptop recognition/orientation, image/video fit, fullscreen/Escape/close behavior, image deletion confirmation, dependency errors, assignment removal, library refresh and persistence.
- **Status:** Implemented; browser visual and interactive verification pending. Do not mark BUG-0027/0028 fixed until manual review. C2 facial/reaction defects remain open.
