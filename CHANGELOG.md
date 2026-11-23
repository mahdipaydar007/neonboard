# Changelog

## 2.3.0 — Student workspace and local security release

- Added a dedicated University Student workspace preset and navigation.
- Added academic profile, semesters, course management, Saturday-first timetable, overlap warnings, assessments, weighted grades, attendance and study-session tracking.
- Added semester/cumulative averages, credit progress, attendance metrics, semester trend analytics and configurable academic warnings.
- Added Persian language selection, RTL shell layout, Jalali dates and Saturday-first calendar rendering.
- Added Iranian rial/toman display choices without automatic currency conversion.
- Added global search across tasks, projects, notes, calendar events, finance transactions and student courses, including Ctrl/Cmd+K.
- Added local workspace snapshot encryption using AES-GCM and a PBKDF2-SHA256-derived key with purpose separation from the stored password verifier.
- Added automatic local app lock, encrypted snapshot migration, stronger password-vault locking and masked password editing.
- Added schema and relationship validation for workspace imports, plus file-size limits.
- Added Vercel/Netlify baseline security headers and disabled production source maps.
- Added README, check report and user acceptance test guide.

## 2.3.1 — Complete Persian localization and RTL repair

- Expanded Persian translation coverage across every existing application route, dialogs, placeholders, option labels, confirmation prompts, errors and dynamically rendered controls.
- Added bidirectional English/Persian translation handling while preserving user-authored content.
- Persisted language selection across sign-in and app reloads.
- Added a bundled Noto Sans Arabic UI font (SIL Open Font License).
- Reworked RTL positioning for desktop/mobile navigation, page shells, buttons, forms, modals, notes, finance, settings, charts, progress indicators and connection-board content.
- Corrected calendar month navigation arrows and applied Persian/Jalali formatting to dashboard, task and finance date displays.
- Added route-level lazy loading and vendor chunk splitting to reduce initial JavaScript payload.
- Added a detailed Persian/RTL acceptance test guide and updated technical check report.
