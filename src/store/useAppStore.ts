import { create } from 'zustand';
import type { AppData, Task, Project, Note, Transaction, Preferences } from '../types';
import { defaultPreferences, loadWorkspace, saveWorkspace } from '../lib/db';

const initial: AppData = { tasks: [], projects: [], notes: [], transactions: [], preferences: defaultPreferences(), navOrder: ['dashboard','tasks','projects','notes','finance','settings'], hiddenNav: [] };
interface Store extends AppData {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addTask: (task: Omit<Task,'id'|'createdAt'>) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addProject: (project: Omit<Project,'id'>) => void;
  addNote: (note: Omit<Note,'id'|'updatedAt'>) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction,'id'>) => void;
  updatePreferences: (patch: Partial<Preferences>) => void;
  reorderNav: (order: string[]) => void;
  toggleNav: (id: string) => void;
  exportJSON: () => void;
  exportCSV: () => void;
}
let persistTimer: ReturnType<typeof setTimeout> | undefined;
const toData = (s: Store): AppData => ({ tasks:s.tasks, projects:s.projects, notes:s.notes, transactions:s.transactions, preferences:s.preferences, navOrder:s.navOrder, hiddenNav:s.hiddenNav });
const persist = (data: AppData) => { clearTimeout(persistTimer); persistTimer = setTimeout(() => void saveWorkspace(data), 250); };
export const useAppStore = create<Store>((set, get) => ({
  ...initial, hydrated: false,
  hydrate: async () => { const saved = await loadWorkspace(); if (saved) set({ ...initial, ...saved, hydrated: true }); else set({ hydrated: true }); },
  addTask: (task) => set((s) => { const next = { tasks: [{ ...task, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...s.tasks] }; persist(toData({ ...s, ...next } as Store)); return next; }),
  updateTask: (id, patch) => set((s) => { const next = { tasks: s.tasks.map((t) => t.id === id ? { ...t, ...patch } : t) }; persist(toData({ ...s, ...next } as Store)); return next; }),
  deleteTask: (id) => set((s) => { const next = { tasks: s.tasks.filter((t) => t.id !== id) }; persist(toData({ ...s, ...next } as Store)); return next; }),
  addProject: (project) => set((s) => { const next = { projects: [...s.projects, { ...project, id: crypto.randomUUID() }] }; persist(toData({ ...s, ...next } as Store)); return next; }),
  addNote: (note) => set((s) => { const next = { notes: [{ ...note, id: crypto.randomUUID(), updatedAt: new Date().toISOString() }, ...s.notes] }; persist(toData({ ...s, ...next } as Store)); return next; }),
  updateNote: (id, patch) => set((s) => { const next = { notes: s.notes.map((n) => n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n) }; persist(toData({ ...s, ...next } as Store)); return next; }),
  deleteNote: (id) => set((s) => { const next = { notes: s.notes.filter((n) => n.id !== id) }; persist(toData({ ...s, ...next } as Store)); return next; }),
  addTransaction: (transaction) => set((s) => { const next = { transactions: [{ ...transaction, id: crypto.randomUUID() }, ...s.transactions] }; persist(toData({ ...s, ...next } as Store)); return next; }),
  updatePreferences: (patch) => set((s) => { const next = { preferences: { ...s.preferences, ...patch } }; persist(toData({ ...s, ...next } as Store)); return next; }),
  reorderNav: (navOrder) => set((s) => { const next = { navOrder }; persist(toData({ ...s, ...next } as Store)); return next; }),
  toggleNav: (id) => set((s) => { const hiddenNav = s.hiddenNav.includes(id) ? s.hiddenNav.filter((x) => x !== id) : [...s.hiddenNav, id]; const next = { hiddenNav }; persist(toData({ ...s, ...next } as Store)); return next; }),
  exportJSON: () => { const data = toData(get()); const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); download(blob, 'neonboard-backup.json'); },
  exportCSV: () => { const rows = [['title','status','priority','due','project'], ...get().tasks.map((t) => [t.title,t.status,t.priority,t.due,get().projects.find((p) => p.id === t.projectId)?.name ?? ''])]; const csv = rows.map((r) => r.map((v) => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\n'); download(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'neonboard-tasks.csv'); }
}));
function download(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url); }
