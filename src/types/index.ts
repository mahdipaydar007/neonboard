export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'doing' | 'done';
export type WorkspaceKind = 'personal' | 'business' | 'study' | 'custom';
export interface Task { id: string; title: string; notes: string; priority: Priority; status: TaskStatus; due: string; projectId: string; createdAt: string; }
export interface Project { id: string; name: string; description: string; color: string; }
export interface Note { id: string; title: string; body: string; updatedAt: string; }
export interface Transaction { id: string; title: string; amount: number; kind: 'income' | 'expense'; category: string; date: string; }
export interface CalendarEvent { id: string; title: string; description: string; date: string; startTime: string; endTime: string; color: string; }
export interface ThemePreset { id: string; name: string; theme: 'light' | 'dark'; accent: string; }
export interface Connection { id: string; fromId: string; toId: string; label: string; }
export interface WorkspaceMeta { id: string; name: string; kind: WorkspaceKind; createdAt: string; }
export interface Preferences { theme: 'light' | 'dark' | 'system'; accent: string; font: 'dm-sans' | 'manrope'; fontScale: number; reducedMotion: boolean; currency: string; themePresets: ThemePreset[]; }
export interface AppData {
  tasks: Task[]; projects: Project[]; notes: Note[]; transactions: Transaction[]; events: CalendarEvent[];
  connections: Connection[]; nodePositions: Record<string, { x: number; y: number }>;
  categories: string[]; dashboardPanels: string[]; dashboardPanelSizes: Record<string, 'standard' | 'wide'>;
  preferences: Preferences; navOrder: string[]; hiddenNav: string[];
}
