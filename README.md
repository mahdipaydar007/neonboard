# Neonboard 2.3.1

Neonboard is a local-first productivity workspace built with React 19, TypeScript, Vite, Zustand, Dexie/IndexedDB, Sass and Motion. This release adds a dedicated university-student workspace while keeping the existing personal, business and custom workspaces.

## Requirements

- Node.js 20 or newer (Node 22 recommended)
- npm 10 or newer

## Install and run

```bash
npm ci
npm run dev
```

Run the full TypeScript and production build check:

```bash
npm run check
```

Run the production preview after a successful build:

```bash
npm run preview
```

## Main modules

- Overview dashboard
- Tasks, projects, calendar, notes, finance and connections
- Multiple local workspaces
- Dedicated university-student workspace
- Semester, course, instructor, class-location and timetable management
- Assessments, weighted grade tracking, attendance and study-session logs
- Semester and cumulative GPA, earned credits and academic progress analytics
- Configurable academic profile and degree-level grading thresholds
- Complete English/Persian interface localization; Persian mode applies RTL layout, a bundled Noto Sans Arabic UI font, Jalali date formatting and a Saturday-first week across the calendar and supported date labels
- Global search across tasks, projects, notes, calendar events, transactions and study courses
- Theme, accent, typography, text scale and reduced-motion preferences
- Encrypted local password vault with encrypted import/export
- Workspace JSON and task CSV export

## Local storage and security model

Neonboard does not use a backend, remote database, server-side account system or cloud synchronization. All workspace data stays in the current browser profile.

- Workspace snapshots are encrypted at rest in IndexedDB with AES-GCM. The encryption key is derived from the local profile password using PBKDF2-SHA256 (600,000 iterations) with domain separation from the stored password verifier.
- A fresh sign-in is required after a full page reload because the derived encryption key is held in memory only.
- Legacy plaintext workspace snapshots are migrated to encrypted snapshots after a successful sign-in. The old snapshot is overwritten only after the encrypted write succeeds.
- The password vault uses separate AES-GCM encryption and a separate passphrase. It automatically locks after five minutes without activity.
- The local workspace automatically locks after 30 minutes without activity.
- The local profile is not server authentication. Anyone who can execute scripts in the active origin while the workspace is unlocked may access decrypted data. Keep the browser and operating system updated and do not install untrusted extensions.
- A lost local profile password cannot be recovered. Because it protects the workspace encryption key, losing it means the encrypted workspace cannot be decrypted. Keep a secure backup before changing devices or resetting browser data.
- Full JSON and CSV workspace exports are plaintext files. Export only when needed and store them securely. The password-vault export remains encrypted.
- The local profile password is not the same as the password-vault passphrase.

The selected interface language is also stored as a separate non-sensitive browser preference so the sign-in screen and unlocked app use the same language. User-created content is not translated. The bundled Noto Sans Arabic UI font is distributed under the SIL Open Font License; its license is included in `public/fonts/NOTO-FONT-LICENSE.txt`.

The app's local encryption protects stored data at rest. It is not a substitute for a hardened operating system account, browser security, endpoint encryption or independent security review. This release has not undergone a third-party penetration test.

## Iranian academic rules and configuration

The student workspace includes editable defaults informed by Iranian associate/bachelor academic regulations and common graduate grading thresholds:

- Associate/bachelor reference defaults: grades out of 20, 10 course pass mark, 12 semester probation threshold, normal 12–20 credit load and 6-credit summer limit.
- A semester average of 17 or higher may allow up to 24 credits in the next semester with academic approval under the referenced undergraduate framework.
- Common graduate reference thresholds differ: master's course pass 12 and average threshold 14; doctorate course pass 14 and average threshold 16.

These are reference defaults, not a legal guarantee. Regulations, implementation, exceptions, credit limits, repeat-course treatment and calendar dates can differ by university, program, cohort and current bylaw. Configure the profile to match the student's official education office rules. Neonboard does not connect to university portals or import official grades automatically.

References for implementation context:

- [Ministry of Science educational regulations PDF](https://fer-pihe.ac.ir/wp-content/uploads/2021/09/%D8%A2%DB%8C%DB%8C%D9%86-%D9%86%D8%A7%D9%85%D9%87-%D8%A2%D9%85%D9%88%D8%B2%D8%B4%DB%8C.pdf)
- [Unified associate/bachelor regulations, 2025-hosted copy](https://jdeihe.ac.ir/wp-content/uploads/2025/01/%DA%A9%D8%A7%D8%B1%D8%AF%D8%A7%D9%86%DB%8C-%D9%88-%DA%A9%D8%A7%D8%B1%D8%B4%D9%86%D8%A7%D8%B3%DB%8C.pdf)
- [Nuffic: Iran grades and study results](https://www.nuffic.nl/en/education-systems/iran/grades-and-study-results)

## Deployment security headers

`vercel.json` includes SPA routing and baseline security headers for Vercel deployments. `public/_headers` provides the equivalent header set for hosts that support a `_headers` file (such as Netlify). If you deploy elsewhere, configure equivalent headers at the hosting/CDN layer and verify the resulting Content-Security-Policy in the browser network panel.

## Persian and RTL quality checks

Use `USER_TEST_GUIDE.md` to check every page in both languages, desktop/mobile RTL positioning, user-content preservation, the Jalali calendar, and existing workspace features. The technical status and known test limits are in `CHECK_REPORT.md`.

## Data migration

This version changes local workspace snapshots from plaintext IndexedDB records to encrypted records. Existing users should sign in with their existing local profile. The first successful load migrates the current workspace. Before upgrading, export a JSON backup from the previous version and keep it somewhere secure. That export is plaintext.
