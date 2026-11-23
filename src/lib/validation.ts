import { z } from 'zod';
import type { AppData } from '../types';

const id = z.string().min(1).max(160);
const task = z.object({ id, title: z.string().min(1).max(500), notes: z.string().max(2_000_000), priority: z.enum(['high','medium','low']), status: z.enum(['todo','doing','done']), due: z.string().max(40), projectId: z.string().max(160), createdAt: z.string().max(40) }).passthrough();
const project = z.object({ id, name: z.string().min(1).max(300), description: z.string().max(20000), color: z.string().max(40) }).passthrough();
const note = z.object({ id, title: z.string().max(500), body: z.string().max(2_000_000), updatedAt: z.string().max(40) }).passthrough();
const transaction = z.object({ id, title: z.string().min(1).max(500), amount: z.number().finite().nonnegative(), kind: z.enum(['income','expense']), category: z.string().max(100), date: z.string().max(40) }).passthrough();
const event = z.object({ id, title: z.string().min(1).max(500), description: z.string().max(20000), date: z.string().max(40), startTime: z.string().max(20), endTime: z.string().max(20), color: z.string().max(40) }).passthrough();
const academic = z.object({
  profile: z.object({ university: z.string().max(300), faculty: z.string().max(300), major: z.string().max(300), studentId: z.string().max(100), level: z.enum(['associate','bachelor','master','doctorate']), totalProgramCredits: z.number().int().min(1).max(500), passGrade: z.number().min(0).max(20), probationGpa: z.number().min(0).max(20), normalMinCredits: z.number().int().min(0).max(40), normalMaxCredits: z.number().int().min(0).max(40) }).passthrough(),
  semesters: z.array(z.object({ id, academicYear: z.string().max(40), term: z.enum(['first','second','summer']), title: z.string().max(200), startDate: z.string().max(40), endDate: z.string().max(40), isCurrent: z.boolean() }).passthrough()).max(100),
  courses: z.array(z.object({ id, semesterId: id, code: z.string().max(100), title: z.string().min(1).max(300), credits: z.number().int().min(0).max(40), instructor: z.string().max(300), location: z.string().max(300), days: z.array(z.number().int().min(0).max(6)).max(7), startTime: z.string().max(10), endTime: z.string().max(10), status: z.enum(['in-progress','passed','failed','dropped']), finalGrade: z.number().min(0).max(20).nullable() }).passthrough()).max(1000),
  assessments: z.array(z.object({ id, courseId: id, title: z.string().max(300), kind: z.enum(['assignment','quiz','midterm','final','project','other']), score: z.number().min(0).nullable(), maxScore: z.number().positive().max(10000), weight: z.number().min(0).max(100), dueDate: z.string().max(40), completed: z.boolean() }).passthrough()).max(10000),
  attendance: z.array(z.object({ id, courseId: id, date: z.string().max(40), status: z.enum(['present','absent','late','excused']) }).passthrough()).max(50000),
  studySessions: z.array(z.object({ id, courseId: id, date: z.string().max(40), minutes: z.number().int().min(0).max(1440), note: z.string().max(20000) }).passthrough()).max(50000)
}).passthrough();
const preferences = z.object({ theme: z.enum(['light','dark','system']).optional(), accent: z.string().max(40).optional(), font: z.enum(['dm-sans','manrope']).optional(), fontScale: z.number().int().min(0).max(4).optional(), reducedMotion: z.boolean().optional(), currency: z.string().max(8).optional(), language: z.enum(['en','fa']).optional(), themePresets: z.array(z.object({ id, name: z.string().max(100), theme: z.enum(['light','dark']), accent: z.string().max(40) }).passthrough()).max(100).optional() }).passthrough();
const workspaceSchema = z.object({
  tasks: z.array(task).max(50000), projects: z.array(project).max(10000), notes: z.array(note).max(50000), transactions: z.array(transaction).max(50000),
  events: z.array(event).max(50000).optional(), connections: z.array(z.object({id,fromId:id,toId:id,label:z.string().max(300)}).passthrough()).max(100000).optional(),
  nodePositions: z.record(z.string(),z.object({x:z.number().finite(),y:z.number().finite()})).optional(),
  categories: z.array(z.string().max(100)).max(1000).optional(), dashboardPanels: z.array(z.string().max(100)).max(100).optional(),
  dashboardPanelSizes: z.record(z.string(),z.enum(['standard','wide'])).optional(), preferences: preferences.optional(),
  navOrder: z.array(z.string().max(100)).max(100).optional(), hiddenNav: z.array(z.string().max(100)).max(100).optional(), academic: academic.optional()
}).passthrough();

export function parseWorkspaceBackup(input: unknown): Partial<AppData> {
  const envelope = z.object({ data: z.unknown() }).passthrough().safeParse(input);
  const candidate = envelope.success ? envelope.data.data : input;
  const result = workspaceSchema.safeParse(candidate);
  if (!result.success) throw new Error(`Backup validation failed: ${result.error.issues.slice(0,3).map((issue: { message: string })=>issue.message).join('; ')}`);
  const data=result.data;
  if(new Set(data.tasks.map(item=>item.id)).size!==data.tasks.length)throw new Error('Backup contains duplicate task IDs.');
  if(new Set(data.projects.map(item=>item.id)).size!==data.projects.length)throw new Error('Backup contains duplicate project IDs.');
  const projectIds=new Set(data.projects.map(item=>item.id));
  if(data.tasks.some(item=>item.projectId!==''&&!projectIds.has(item.projectId)))throw new Error('Backup contains a task linked to a missing project.');
  if(data.academic){
    const academic=data.academic;const semesterIds=new Set(academic.semesters.map(item=>item.id));const courseIds=new Set(academic.courses.map(item=>item.id));
    if(semesterIds.size!==academic.semesters.length||courseIds.size!==academic.courses.length)throw new Error('Academic backup contains duplicate semester or course IDs.');
    if(academic.semesters.filter(item=>item.isCurrent).length>1)throw new Error('Academic backup marks more than one semester as current.');
    if(academic.profile.normalMinCredits>academic.profile.normalMaxCredits)throw new Error('Academic credit range is invalid.');
    if(academic.courses.some(item=>!semesterIds.has(item.semesterId)))throw new Error('Academic backup contains a course linked to a missing semester.');
    if(academic.assessments.some(item=>!courseIds.has(item.courseId)||item.score!==null&&item.score>item.maxScore))throw new Error('Academic backup contains an invalid assessment or course reference.');
    if(academic.attendance.some(item=>!courseIds.has(item.courseId))||academic.studySessions.some(item=>!courseIds.has(item.courseId)))throw new Error('Academic backup contains attendance or study data linked to a missing course.');
    const weights=new Map<string,number>();for(const item of academic.assessments)weights.set(item.courseId,(weights.get(item.courseId)??0)+item.weight);if([...weights.values()].some(total=>total>100))throw new Error('Academic backup contains assessment weights above 100%.');
    const attendanceKeys=academic.attendance.map(item=>`${item.courseId}:${item.date}`);if(new Set(attendanceKeys).size!==attendanceKeys.length)throw new Error('Academic backup contains duplicate attendance dates for a course.');
  }
  return data as unknown as Partial<AppData>;
}
