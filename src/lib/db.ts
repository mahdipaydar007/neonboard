import Dexie, { type Table } from 'dexie';
import type { AppData } from '../types';

export interface EncryptedVaultRecord { id: 'local-vault'; salt: string; iv: string; ciphertext: string; updatedAt: string; }
class NeonboardDatabase extends Dexie {
  snapshots!: Table<{ id: string; data: AppData; savedAt: string }, string>;
  vaults!: Table<EncryptedVaultRecord, string>;
  constructor() {
    super('NeonboardDB');
    this.version(1).stores({ snapshots: '&id, savedAt' });
    this.version(2).stores({ snapshots: '&id, savedAt', vaults: '&id, updatedAt' });
  }
}
export const db = new NeonboardDatabase();
const legacySnapshotId = (workspaceId: string) => workspaceId === 'personal' ? 'workspace' : `workspace:${workspaceId}`;

export async function loadWorkspace(workspaceId = 'personal'): Promise<AppData | null> {
  const saved = await db.snapshots.get(legacySnapshotId(workspaceId));
  if (saved) return saved.data;
  if (workspaceId !== 'personal') return null;
  try {
    const legacy = localStorage.getItem('neonboard.v1') ?? localStorage.getItem('nightdesk.v1');
    if (!legacy) return null;
    const old = JSON.parse(legacy) as { tasks?: Array<Record<string, unknown>>; projects?: Array<Record<string, unknown>> };
    const migrated: AppData = {
      ...defaultAppData(),
      tasks: (old.tasks ?? []).map((t) => ({
        id: String(t.id ?? crypto.randomUUID()), title: String(t.title ?? 'Untitled'), notes: String(t.notes ?? ''),
        priority: t.priority === 'high' || t.priority === 'low' ? t.priority : 'medium',
        status: t.status === 'done' || t.status === 'doing' ? t.status : 'todo',
        due: String(t.due ?? ''), projectId: String(t.projectId ?? ''), createdAt: String(t.createdAt ?? new Date().toISOString())
      })),
      projects: (old.projects ?? []).map((p) => ({ id: String(p.id ?? crypto.randomUUID()), name: String(p.name ?? 'Untitled'), description: String(p.desc ?? ''), color: String(p.color ?? '#6687d9') }))
    };
    await saveWorkspace(migrated, workspaceId);
    return migrated;
  } catch { return null; }
}
export async function saveWorkspace(data: AppData, workspaceId = 'personal'): Promise<void> {
  await db.snapshots.put({ id: legacySnapshotId(workspaceId), data, savedAt: new Date().toISOString() });
}
export async function removeWorkspaceData(workspaceId: string): Promise<void> {
  await db.snapshots.delete(legacySnapshotId(workspaceId));
}
export async function clearAllLocalData(): Promise<void> {
  await db.snapshots.clear();
  await db.vaults.clear();
}
export async function loadVault(): Promise<EncryptedVaultRecord | undefined> { return db.vaults.get('local-vault'); }
export async function saveVault(record: EncryptedVaultRecord): Promise<void> { await db.vaults.put(record); }
export async function clearVault(): Promise<void> { await db.vaults.delete('local-vault'); }

export function defaultPreferences(): AppData['preferences'] {
  return { theme: 'system', accent: '#6477c8', font: 'dm-sans', fontScale: 2, reducedMotion: false, currency: 'EUR', themePresets: [] };
}
export function defaultAppData(): AppData {
  return {
    tasks: [], projects: [], notes: [], transactions: [], events: [], connections: [], nodePositions: {},
    categories: ['General', 'Groceries', 'Housing', 'Transport', 'Health', 'Entertainment', 'Education', 'Salary', 'Freelance', 'Other'],
    dashboardPanels: ['tasks', 'projects', 'finance'], dashboardPanelSizes: { tasks:'standard', projects:'standard', finance:'wide' }, preferences: defaultPreferences(),
    navOrder: ['dashboard','tasks','projects','calendar','connections','notes','finance','vault','guide','settings'], hiddenNav: []
  };
}
