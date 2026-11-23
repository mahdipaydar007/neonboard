# Neonboard 2.3.1 — User Acceptance Test Guide

This guide is for checking the updated Persian localization, RTL layout, Jalali calendar, and existing workspace features before deploying the release.

## 0. Before upgrading

1. Open the currently deployed Neonboard version.
2. Sign in with your existing local profile.
3. Export a full workspace JSON backup from **Preferences → Your data**.
4. Store that backup somewhere private. JSON workspace backups are plaintext.
5. Keep your existing deployed version available until the new build passes your tests.

Do not clear browser data or delete your local profile during testing. The app is local-first and does not have a cloud recovery account.

## 1. Install and start the release

```bash
npm ci
npm run check
npm run dev
```

Open the local Vite URL printed in the terminal. `npm run check` must finish successfully before deployment.

## 2. Language switching and persistence

### Sign-in screen

- [ ] The language selector is visible.
- [ ] Selecting فارسی changes the sign-in page to Persian and sets the document direction to RTL.
- [ ] The language choice remains selected after a page reload.
- [ ] The selected language is retained after signing in.

### Preferences screen

- [ ] Open Preferences and switch English → فارسی.
- [ ] The page changes direction without requiring a manual refresh.
- [ ] Navigate to every section listed below. Check headings, subtitles, buttons, form labels, placeholders, select options, empty states, helper text, tooltips, accessible labels and confirmation prompts.
- [ ] Switch فارسی → English. The whole interface returns to LTR and English.
- [ ] Reload the page in each language. The selected language is retained.

### All routes to inspect

- [ ] Overview
- [ ] Tasks
- [ ] Projects
- [ ] Calendar
- [ ] Connections
- [ ] Notes
- [ ] Finance
- [ ] Password vault
- [ ] Guide
- [ ] University (inside a Student workspace)
- [ ] Preferences

The brand name, technical acronyms, URLs, currency codes and user-entered content may remain in their original form. They are not missing translations.

## 3. User-created content must not be translated

Create test records with these exact English names:

- Project: `Calendar`
- Task: `Overview`
- Note title: `Finance`
- Course: `Connections`
- Workspace: `Personal`

Switch to فارسی and verify these user-created names remain exactly as entered. Switch back to English and verify they are still unchanged. Also check note body text, descriptions, instructors, event titles, transaction descriptions and vault entry names.

## 4. Jalali calendar checks

Open **Calendar** while فارسی is selected.

- [ ] The month and year are displayed in the Persian calendar.
- [ ] Month names are Persian (فروردین through اسفند as applicable), not English Gregorian month names.
- [ ] Weekday names are Persian.
- [ ] The week starts on شنبه and ends on جمعه.
- [ ] Day numbers use Persian digits.
- [ ] Previous/next month arrows point in the correct visual direction.
- [ ] The Today button returns to the current Jalali month and selects today.
- [ ] Selecting a day updates the agenda correctly.
- [ ] Events and task deadlines still appear on the correct day.
- [ ] Create, edit and delete an event. Confirm the saved date remains correct after changing language.
- [ ] Check date inputs in task, event and university forms. Their browser locale should follow the Persian document language where supported.

The database continues storing dates in ISO Gregorian form. The interface formats those dates as Jalali; this avoids changing existing records or corrupting dates during language switching.

## 5. RTL layout checks — desktop

Test at a wide desktop viewport (approximately 1440 × 900).

- [ ] Sidebar is on the right; main content does not sit underneath it.
- [ ] Sidebar labels and workspace switcher are right-aligned.
- [ ] Header breadcrumbs, search field and primary action are aligned correctly.
- [ ] Icons appear on the intended side of their labels.
- [ ] Button labels are not clipped or separated from their icons.
- [ ] Dropdowns, selects, input placeholders and form labels align correctly.
- [ ] Modal title, close control, fields and action buttons are aligned correctly.
- [ ] Settings toggles move in the correct direction when enabled.
- [ ] Progress bars fill from the right edge.
- [ ] Notes list and editor columns appear in the correct order.
- [ ] Finance charts, legends, monthly bars and transaction rows remain readable.
- [ ] Connection-board nodes retain working input/output ports and connection lines.
- [ ] No horizontal overflow appears on ordinary pages.

## 6. RTL layout checks — mobile

Use a narrow viewport around 390 × 844, and also test a tablet width.

- [ ] The navigation drawer opens from the right.
- [ ] The backdrop closes the drawer when tapped.
- [ ] Main content uses the full available width when the drawer is closed.
- [ ] The topbar menu, search and create button do not overlap.
- [ ] Forms and modals fit the viewport without clipped controls.
- [ ] Calendar days remain readable and tappable.
- [ ] Notes, finance and university layouts stack cleanly.
- [ ] No page develops an unintended horizontal scrollbar.

## 7. Existing feature regression checks

### Tasks and projects

- [ ] Create, edit, complete and delete a task.
- [ ] Assign and remove a task's project.
- [ ] Filter tasks by status and search.
- [ ] Create, edit and delete a project.
- [ ] Check project progress updates after completing tasks.

### Calendar and connections

- [ ] Create, edit and delete an event.
- [ ] Verify a task due date appears in the calendar.
- [ ] Connect a project and task on the relationship board.
- [ ] Disconnect an edge without deleting either record.
- [ ] Verify project assignment connections can be removed correctly.

### Notes and finance

- [ ] Create and edit a note in Markdown mode.
- [ ] Switch between Write and Preview.
- [ ] Verify Persian text, English text, numbers, URLs and code snippets remain readable in notes.
- [ ] Create, edit and delete an income and expense transaction.
- [ ] Switch between IRR, IRT and another currency. Confirm this only changes display formatting.
- [ ] Check monthly finance labels use Jalali month names in Persian mode.

### Student workspace

- [ ] Create or open a Student workspace.
- [ ] Add a semester, course, instructor and class schedule.
- [ ] Add assessments with weights totalling 100%.
- [ ] Record a course grade, attendance and study session.
- [ ] Verify semester average, cumulative average and earned credits.
- [ ] Check weekly timetable weekdays and dates in Persian mode.
- [ ] Switch to English and verify the academic data remains unchanged.

### Vault, backup and preferences

- [ ] Unlock and lock the password vault.
- [ ] Confirm passwords are masked by default.
- [ ] Export an encrypted vault backup and verify it remains encrypted.
- [ ] Export a workspace JSON backup.
- [ ] Do not test destructive import/delete actions on your only copy of real data.
- [ ] Toggle reduced motion and check that non-essential motion is reduced.
- [ ] Change theme, accent, font size and workspace navigation order.

## 8. Report a visual defect

For every defect, record:

1. Page and exact control.
2. Selected language.
3. Screen size and browser.
4. Steps to reproduce.
5. Screenshot showing the issue.
6. Expected position/text and actual position/text.

Prioritize broken navigation, clipped text, overlapping controls, incorrect calendar dates, data changes, and controls that cannot be reached by keyboard or touch.

## 9. Deployment checklist

- [ ] `npm run check` passes.
- [ ] English and Persian routes have been checked.
- [ ] Desktop and mobile RTL layouts have been checked.
- [ ] A backup exists outside the browser.
- [ ] Production build is deployed to a staging URL first.
- [ ] Verify security headers on the deployed host.
- [ ] Confirm the production host serves `/fonts/NotoSansArabicUI-Regular.ttf` and `/fonts/NotoSansArabicUI-Bold.ttf` successfully.

Do not treat a successful build as proof of visual acceptance. Complete the manual checks above before replacing the live deployment.
