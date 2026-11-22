export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'doing' | 'done';
export interface Task { id: string; title: string; notes: string; priority: Priority; status: TaskStatus; due: string; projectId: string; createdAt: string; }
export interface Project { id: string; name: string; description: string; color: string; }
export interface Note { id: string; title: string; body: string; updatedAt: string; }
export interface Transaction { id: string; title: string; amount: number; kind: 'income' | 'expense'; category: string; date: string; }
export interface Preferences { theme: 'light' | 'dark' | 'system'; accent: string; font: 'dm-sans' | 'manrope'; reducedMotion: boolean; }
export interface AppData { tasks: Task[]; projects: Project[]; notes: Note[]; transactions: Transaction[]; preferences: Preferences; navOrder: string[]; hiddenNav: string[]; }
