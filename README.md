# Neonboard

Neonboard is a local-first personal management workspace built with React, TypeScript, Vite and Sass.

## Requirements

- Node.js 20 or newer
- npm

## Setup

```bash
npm install
npm run dev
```

Run a production build with:

```bash
npm run build
```

## Modules in this build

- Overview dashboard with configurable panels
- Tasks with edit, delete, due dates, status, priority and project assignment
- Projects with edit, delete and progress summaries
- Calendar with editable events, task due dates and daily agenda
- Direct-manipulation connections board: drag from an item's output dot to another item's input dot
- Markdown notes with write and preview modes
- Finance with editable transactions, custom categories and expense analysis
- Encrypted local password vault (AES-GCM encryption, PBKDF2-derived key) with its own encrypted JSON import/export
- Multiple local workspaces
- Local profile sign-in screen
- Preferences for theme, saved light/dark theme presets, accent, typeface, five text-size presets, navigation, currency and dashboard panels
- In-dashboard edit mode for panel ordering, visibility and width
- Workspace JSON import/export and task CSV export
- Danger-zone controls for clearing workspace data, deleting a workspace or deleting the local profile

## Storage and authentication limitations

Workspace data is stored in IndexedDB in the current browser. Workspaces do not synchronize between devices. The sign-in screen manages a local device profile only; it is not server authentication and does not create a cloud account.

Workspace JSON import replaces the active workspace after confirmation. Vault backups are separate encrypted files and require the original vault passphrase to restore. Finance currency selection changes display formatting only; it does not convert historical amounts or fetch exchange rates.

The password vault uses a separate passphrase. The passphrase is not stored, and there is no password recovery. The vault implementation has not undergone an independent security audit. Do not use this prototype as the only storage location for critical credentials.

Export regular JSON backups and store them somewhere separate from this device. Deleting an account or workspace is destructive and cannot be undone from the application.

## Useful commands

```bash
npm run typecheck
npm run build
npm run preview
```
