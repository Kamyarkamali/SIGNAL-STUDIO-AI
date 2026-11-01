# Signal Studio AI — Bug Tracker

**Path:** `context/BUG_TRACKER.md`  
**Status:** Phase 03-A accepted; Phase 03 remains open
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

1. Reproduce before labeling a new-project issue confirmed.
2. Fix root cause; add a targeted regression test.
3. Run relevant unit/integration checks and browser tests for interactive changes.
4. `FIXED_UNVERIFIED` is **not** `VERIFIED`.
5. Update `PROGRESS_CHECKLIST.md` only after the corresponding acceptance evidence exists.
6. Never erase bug history; mark closed with evidence.
