# Neonboard 2.3.1 — Technical Check Report

## Build and source checks

| Check | Result | Notes |
|---|---|---|
| TypeScript project check | PASS | `npm run typecheck` |
| Production build | PASS | `npm run build` |
| Combined check | PASS | `npm run check` |
| JSX static-string coverage scan | PASS | 307 JSX text/attribute candidates scanned; zero missing dictionary keys |
| Localization utility typecheck | PASS | Strict standalone TypeScript check |
| Translation smoke tests | PASS | English ↔ Persian, month labels, dynamic confirmation text and digit formatting |
| Jalali calendar runtime support | PASS | Browser/Node Intl reports `calendar: persian`; Persian month, weekday and date formatting verified |
| Production source maps | DISABLED | `build.sourcemap = false` |
| Production route code splitting | PASS | Pages are lazy-loaded; vendor chunks separated |
| Browser visual/E2E tests | NOT RUN | Chromium launch was blocked by the execution environment's browser policy |
| Dependency audit | NOT RUN | No online npm audit was performed |
| Third-party penetration test | NOT RUN | Not part of this source/build pass |

## Release changes

- Centralized 544 built-in Persian UI translations.
- Added document-level locale switching with mutation handling for dynamically rendered interface text and accessible attributes.
- Kept user-authored notes, project names, tasks, courses, events and transaction descriptions out of automatic translation.
- Persisted language preference separately as a non-sensitive UI preference so the sign-in screen and unlocked app use the same language.
- Applied `lang=fa-IR` and `dir=rtl` at the document level.
- Corrected RTL layout for desktop and mobile navigation, workspace controls, notes, forms, modals, charts, calendar, progress bars, toggles and connection-board node content.
- Corrected calendar month arrow direction and Jalali month/weekday/day display.
- Applied Persian calendar formatting to dashboard dates, task due dates and finance month/date labels.
- Bundled Noto Sans Arabic UI regular and bold fonts under the SIL Open Font License.
- Added lazy route loading and vendor chunk splitting.

## Build output observations

- Build succeeds with no application TypeScript errors.
- The previous single large JavaScript bundle was split into page chunks and framework/motion/data/icon vendor chunks.
- The main application entry chunk is approximately 108 KB minified; vendor chunks are separate.
- Rollup prints two upstream annotation-position warnings from Zod. They are non-fatal and the build completes.

## Known verification limits

- No real browser visual review or automated end-to-end browser test was completed in this environment because Chromium navigation was blocked by the execution environment.
- Native browser date-picker rendering depends on the user's browser/OS locale. The app sets `lang="fa-IR"` on date inputs and uses the Jalali calendar for its own calendar UI and formatted date labels. Verify the native picker on the target browser/OS.
- The translation layer translates built-in UI text; user-created content is intentionally preserved. New UI copy added in future releases must be added to the localization dictionary or to the university's native bilingual labels.
- npm audit and an independent security review remain outstanding.
