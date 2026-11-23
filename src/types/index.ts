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
export interface Preferences { theme: 'light' | 'dark' | 'system'; accent: string; font: 'dm-sans' | 'manrope'; fontScale: number; reducedMotion: boolean; currency: string; language: 'en' | 'fa'; themePresets: ThemePreset[]; }
export type AcademicLevel = 'associate' | 'bachelor' | 'master' | 'doctorate';
export type SemesterTerm = 'first' | 'second' | 'summer';
export interface AcademicProfile { university: string; faculty: string; major: string; studentId: string; level: AcademicLevel; totalProgramCredits: number; passGrade: number; probationGpa: number; normalMinCredits: number; normalMaxCredits: number; }
export interface Semester { id: string; academicYear: string; term: SemesterTerm; title: string; startDate: string; endDate: string; isCurrent: boolean; }
export interface Course { id: string; semesterId: string; code: string; title: string; credits: number; instructor: string; location: string; days: number[]; startTime: string; endTime: string; status: 'in-progress' | 'passed' | 'failed' | 'dropped'; finalGrade: number | null; }
export interface Assessment { id: string; courseId: string; title: string; kind: 'assignment' | 'quiz' | 'midterm' | 'final' | 'project' | 'other'; score: number | null; maxScore: number; weight: number; dueDate: string; completed: boolean; }
export interface AttendanceRecord { id: string; courseId: string; date: string; status: 'present' | 'absent' | 'late' | 'excused'; }
export interface StudySession { id: string; courseId: string; date: string; minutes: number; note: string; }
export interface AcademicData { profile: AcademicProfile; semesters: Semester[]; courses: Course[]; assessments: Assessment[]; attendance: AttendanceRecord[]; studySessions: StudySession[]; }
export interface AppData {
  tasks: Task[]; projects: Project[]; notes: Note[]; transactions: Transaction[]; events: CalendarEvent[];
  connections: Connection[]; nodePositions: Record<string, { x: number; y: number }>;
  categories: string[]; dashboardPanels: string[]; dashboardPanelSizes: Record<string, 'standard' | 'wide'>;
  preferences: Preferences; navOrder: string[]; hiddenNav: string[]; academic: AcademicData;
}
