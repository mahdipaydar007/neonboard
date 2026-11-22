import Dexie, { type Table } from 'dexie';
import type { AppData } from '../types';

class NeonboardDatabase extends Dexie {
  snapshots!: Table<{ id: string; data: AppData; savedAt: string }, string>;
  constructor() {
    super('NeonboardDB');
    this.version(1).stores({ snapshots: '&id, savedAt' });
  }
}
export const db = new NeonboardDatabase();
const SNAPSHOT_ID = 'workspace';

export async function loadWorkspace(): Promise<AppData | null> {
  const saved = await db.snapshots.get(SNAPSHOT_ID);
  if (saved) return saved.data;
  // One-time compatibility import from the original Neonboard localStorage format.
  try {
    const legacy = localStorage.getItem('neonboard.v1') ?? localStorage.getItem('nightdesk.v1');
    if (!legacy) return null;
    const old = JSON.parse(legacy) as { tasks?: Array<Record<string, unknown>>; projects?: Array<Record<string, unknown>> };
    const migrated: AppData = {
      tasks: (old.tasks ?? []).map((t) => ({
        id: String(t.id ?? crypto.randomUUID()), title: String(t.title ?? 'Untitled'), notes: String(t.notes ?? ''),
        priority: t.priority === 'high' || t.priority === 'low' ? t.priority : 'medium',
        status: t.status === 'done' || t.status === 'doing' ? t.status : 'todo',
        due: String(t.due ?? ''), projectId: String(t.projectId ?? ''), createdAt: String(t.createdAt ?? new Date().toISOString())
      })),
      projects: (old.projects ?? []).map((p) => ({ id: String(p.id ?? crypto.randomUUID()), name: String(p.name ?? 'Untitled'), description: String(p.desc ?? ''), color: String(p.color ?? '#6687d9') })),
      notes: [], transactions: [], preferences: defaultPreferences(), navOrder: ['dashboard','tasks','projects','notes','finance','settings'], hiddenNav: []
    };
    await saveWorkspace(migrated);
    return migrated;
  } catch { return null; }
}
export async function saveWorkspace(data: AppData): Promise<void> {
  await db.snapshots.put({ id: SNAPSHOT_ID, data, savedAt: new Date().toISOString() });
}
export function defaultPreferences(): AppData['preferences'] {
  return { theme: 'light', accent: '#6477c8', font: 'dm-sans', reducedMotion: false };
}
