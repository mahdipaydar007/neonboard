import { create } from 'zustand';
import type { AppData, AcademicData, CalendarEvent, Connection, Task, Project, Note, Transaction, Preferences, WorkspaceMeta, WorkspaceKind } from '../types';
import { defaultAcademicData, defaultAppData, loadWorkspace, removeWorkspaceData, saveWorkspace } from '../lib/db';

const WORKSPACES_KEY = 'neonboard.workspaces.v1';
const ACTIVE_WORKSPACE_KEY = 'neonboard.active-workspace.v1';
const LANGUAGE_KEY = 'neonboard.language.v1';
const initial: AppData = defaultAppData();
interface Store extends AppData {
  hydrated: boolean; workspaces: WorkspaceMeta[]; activeWorkspaceId: string;
  hydrate: () => Promise<void>; switchWorkspace: (id: string) => Promise<void>;
  createWorkspace: (name: string, kind: WorkspaceKind) => Promise<void>;
  renameWorkspace: (id: string, name: string) => void; deleteWorkspace: (id: string) => Promise<void>;
  addTask: (task: Omit<Task,'id'|'createdAt'>) => void; updateTask: (id: string, patch: Partial<Task>) => void; deleteTask: (id: string) => void;
  addProject: (project: Omit<Project,'id'>) => void; updateProject: (id: string, patch: Partial<Project>) => void; deleteProject: (id: string) => void;
  addNote: (note: Omit<Note,'id'|'updatedAt'>) => void; updateNote: (id: string, patch: Partial<Note>) => void; deleteNote: (id: string) => void;
  addEvent: (event: Omit<CalendarEvent,'id'>) => void; updateEvent: (id: string, patch: Partial<CalendarEvent>) => void; deleteEvent: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction,'id'>) => void; updateTransaction: (id: string, patch: Partial<Transaction>) => void; deleteTransaction: (id: string) => void;
  updatePreferences: (patch: Partial<Preferences>) => void; reorderNav: (order: string[]) => void; toggleNav: (id: string) => void;
  addConnection: (connection: Omit<Connection,'id'>) => void; deleteConnection: (id: string) => void; setNodePosition: (id: string, x: number, y: number) => void;
  toggleDashboardPanel: (id: string) => void; setDashboardPanels: (ids: string[]) => void; setDashboardPanelSize: (id: string, size: 'standard'|'wide') => void;
  updateAcademic: (patch: Partial<AcademicData>) => void;
  resetForLock: () => void;
  cancelPendingSave: () => void; flushPendingSave: () => Promise<void>; addCategory: (category: string) => void; exportJSON: () => void; exportCSV: () => void;
  importWorkspaceData: (data: Partial<AppData>) => Promise<void>; clearWorkspaceData: () => Promise<void>;
}
let persistTimer: ReturnType<typeof setTimeout> | undefined;
const toData = (s: Store): AppData => ({
  tasks:s.tasks, projects:s.projects, notes:s.notes, transactions:s.transactions, events:s.events ?? [],
  connections:s.connections, nodePositions:s.nodePositions, categories:s.categories,
  dashboardPanels:s.dashboardPanels, dashboardPanelSizes:s.dashboardPanelSizes, preferences:s.preferences,
  navOrder:s.navOrder, hiddenNav:s.hiddenNav, academic:s.academic
});
const persist = (state: Store) => {
  clearTimeout(persistTimer); const id=state.activeWorkspaceId; const data=toData(state);
  persistTimer=setTimeout(()=>{void saveWorkspace(data,id).catch(error=>console.error('Neonboard could not save this workspace:',error));},180);
};
function persistWorkspaceList(items: WorkspaceMeta[]) { localStorage.setItem(WORKSPACES_KEY,JSON.stringify(items)); }
function normalizeData(data: Partial<AppData>|null): AppData {
  const base=defaultAppData(); const merged={...base,...(data??{}),tasks:Array.isArray(data?.tasks)?data.tasks:[],projects:Array.isArray(data?.projects)?data.projects:[],notes:Array.isArray(data?.notes)?data.notes:[],transactions:Array.isArray(data?.transactions)?data.transactions:[],events:Array.isArray(data?.events)?data.events:[],connections:Array.isArray(data?.connections)?data.connections:[],preferences:{...base.preferences,...(data?.preferences??{}),themePresets:data?.preferences?.themePresets??base.preferences.themePresets},academic:{...defaultAcademicData(),...(data?.academic??{}),profile:{...defaultAcademicData().profile,...(data?.academic?.profile??{})},semesters:data?.academic?.semesters??[],courses:data?.academic?.courses??[],assessments:data?.academic?.assessments??[],attendance:data?.academic?.attendance??[],studySessions:data?.academic?.studySessions??[]}};
  merged.navOrder=[...(data?.navOrder??[]),...base.navOrder.filter(id=>!(data?.navOrder??[]).includes(id))];
  merged.categories=[...new Set([...base.categories,...(data?.categories??[])])];
  merged.dashboardPanelSizes={...base.dashboardPanelSizes,...(data?.dashboardPanelSizes??{})};
  return merged;
}
const download=(blob:Blob,name:string)=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};

export const useAppStore=create<Store>((set,get)=>({
  ...initial,hydrated:false,workspaces:[],activeWorkspaceId:'personal',
  hydrate:async()=>{
    let workspaces:WorkspaceMeta[]=[];try{const parsed:unknown=JSON.parse(localStorage.getItem(WORKSPACES_KEY)??'[]');if(Array.isArray(parsed))workspaces=parsed.filter((item):item is WorkspaceMeta=>!!item&&typeof item==='object'&&typeof item.id==='string'&&typeof item.name==='string'&&['personal','business','study','custom'].includes(item.kind)&&typeof item.createdAt==='string');}catch{workspaces=[];}
    if(!workspaces.length){workspaces=[{id:'personal',name:'Personal',kind:'personal',createdAt:new Date().toISOString()}];persistWorkspaceList(workspaces);}
    const savedActive=localStorage.getItem(ACTIVE_WORKSPACE_KEY);const activeWorkspaceId=workspaces.some(w=>w.id===savedActive)?savedActive!:workspaces[0].id;
    const loaded=normalizeData(await loadWorkspace(activeWorkspaceId));const savedLanguage=localStorage.getItem(LANGUAGE_KEY);if(savedLanguage==='en'||savedLanguage==='fa')loaded.preferences.language=savedLanguage;set({...loaded,workspaces,activeWorkspaceId,hydrated:true});localStorage.setItem(ACTIVE_WORKSPACE_KEY,activeWorkspaceId);
  },
  switchWorkspace:async id=>{const current=get();if(id===current.activeWorkspaceId||!current.workspaces.some(w=>w.id===id))return;clearTimeout(persistTimer);await saveWorkspace(toData(current),current.activeWorkspaceId);const data=normalizeData(await loadWorkspace(id));set({...data,activeWorkspaceId:id});localStorage.setItem(ACTIVE_WORKSPACE_KEY,id);},
  createWorkspace:async(name,kind)=>{const current=get();clearTimeout(persistTimer);await saveWorkspace(toData(current),current.activeWorkspaceId);const id=crypto.randomUUID();const meta={id,name:name.trim(),kind,createdAt:new Date().toISOString()} satisfies WorkspaceMeta;const workspaces=[...current.workspaces,meta];persistWorkspaceList(workspaces);const data=defaultAppData();await saveWorkspace(data,id);set({...data,workspaces,activeWorkspaceId:id});localStorage.setItem(ACTIVE_WORKSPACE_KEY,id);},
  renameWorkspace:(id,name)=>{const workspaces=get().workspaces.map(w=>w.id===id?{...w,name:name.trim()||w.name}:w);persistWorkspaceList(workspaces);set({workspaces});},
  deleteWorkspace:async id=>{const current=get();if(current.workspaces.length<=1)throw new Error('You must keep at least one workspace.');clearTimeout(persistTimer);await saveWorkspace(toData(current),current.activeWorkspaceId);await removeWorkspaceData(id);const workspaces=current.workspaces.filter(w=>w.id!==id);persistWorkspaceList(workspaces);if(id===current.activeWorkspaceId){const next=workspaces[0];const data=normalizeData(await loadWorkspace(next.id));set({...data,workspaces,activeWorkspaceId:next.id});localStorage.setItem(ACTIVE_WORKSPACE_KEY,next.id);}else set({workspaces});},
  addTask:task=>set(s=>{const next={tasks:[{...task,id:crypto.randomUUID(),createdAt:new Date().toISOString()},...s.tasks]};persist({...s,...next});return next;}),
  updateTask:(id,patch)=>set(s=>{const next={tasks:s.tasks.map(t=>t.id===id?{...t,...patch}:t)};persist({...s,...next});return next;}),
  deleteTask:id=>set(s=>{const next={tasks:s.tasks.filter(t=>t.id!==id),connections:s.connections.filter(c=>c.fromId!==id&&c.toId!==id)};persist({...s,...next});return next;}),
  addProject:project=>set(s=>{const next={projects:[...s.projects,{...project,id:crypto.randomUUID()}]};persist({...s,...next});return next;}),
  updateProject:(id,patch)=>set(s=>{const next={projects:s.projects.map(p=>p.id===id?{...p,...patch}:p)};persist({...s,...next});return next;}),
  deleteProject:id=>set(s=>{const next={projects:s.projects.filter(p=>p.id!==id),tasks:s.tasks.map(t=>t.projectId===id?{...t,projectId:''}:t),connections:s.connections.filter(c=>c.fromId!==id&&c.toId!==id)};persist({...s,...next});return next;}),
  addNote:note=>set(s=>{const next={notes:[{...note,id:crypto.randomUUID(),updatedAt:new Date().toISOString()},...s.notes]};persist({...s,...next});return next;}),
  updateNote:(id,patch)=>set(s=>{const next={notes:s.notes.map(n=>n.id===id?{...n,...patch,updatedAt:new Date().toISOString()}:n)};persist({...s,...next});return next;}),
  deleteNote:id=>set(s=>{const next={notes:s.notes.filter(n=>n.id!==id)};persist({...s,...next});return next;}),
  addEvent:event=>set(s=>{const next={events:[...(s.events??[]),{...event,id:crypto.randomUUID()}]};persist({...s,...next});return next;}),
  updateEvent:(id,patch)=>set(s=>{const next={events:(s.events??[]).map(e=>e.id===id?{...e,...patch}:e)};persist({...s,...next});return next;}),
  deleteEvent:id=>set(s=>{const next={events:(s.events??[]).filter(e=>e.id!==id)};persist({...s,...next});return next;}),
  addTransaction:transaction=>set(s=>{const next={transactions:[{...transaction,id:crypto.randomUUID()},...s.transactions]};persist({...s,...next});return next;}),
  updateTransaction:(id,patch)=>set(s=>{const next={transactions:s.transactions.map(t=>t.id===id?{...t,...patch}:t)};persist({...s,...next});return next;}),
  deleteTransaction:id=>set(s=>{const next={transactions:s.transactions.filter(t=>t.id!==id)};persist({...s,...next});return next;}),
  updatePreferences:patch=>set(s=>{const next={preferences:{...s.preferences,...patch}};if(patch.language==='en'||patch.language==='fa')localStorage.setItem(LANGUAGE_KEY,patch.language);persist({...s,...next});return next;}),
  reorderNav:navOrder=>set(s=>{const next={navOrder};persist({...s,...next});return next;}),
  toggleNav:id=>set(s=>{const hiddenNav=s.hiddenNav.includes(id)?s.hiddenNav.filter(x=>x!==id):[...s.hiddenNav,id];const next={hiddenNav};persist({...s,...next});return next;}),
  addConnection:connection=>set(s=>{if(connection.fromId===connection.toId||s.connections.some(c=>c.fromId===connection.fromId&&c.toId===connection.toId))return{};const next={connections:[...s.connections,{...connection,id:crypto.randomUUID()}]};persist({...s,...next});return next;}),
  deleteConnection:id=>set(s=>{const next={connections:s.connections.filter(c=>c.id!==id)};persist({...s,...next});return next;}),
  setNodePosition:(id,x,y)=>set(s=>{const next={nodePositions:{...s.nodePositions,[id]:{x,y}}};persist({...s,...next});return next;}),
  toggleDashboardPanel:id=>set(s=>{const dashboardPanels=s.dashboardPanels.includes(id)?s.dashboardPanels.filter(p=>p!==id):[...s.dashboardPanels,id];const next={dashboardPanels};persist({...s,...next});return next;}),
  setDashboardPanels:dashboardPanels=>set(s=>{const next={dashboardPanels};persist({...s,...next});return next;}),
  setDashboardPanelSize:(id,size)=>set(s=>{const next={dashboardPanelSizes:{...s.dashboardPanelSizes,[id]:size}};persist({...s,...next});return next;}),
  updateAcademic:patch=>set(s=>{const academic={...s.academic,...patch};persist({...s,academic});return {academic};}),
  resetForLock:()=>{clearTimeout(persistTimer);set({...defaultAppData(),hydrated:false,workspaces:[],activeWorkspaceId:'personal'});},
  cancelPendingSave:()=>{clearTimeout(persistTimer);},
  flushPendingSave:async()=>{clearTimeout(persistTimer);const current=get();await saveWorkspace(toData(current),current.activeWorkspaceId);},
  addCategory:category=>set(s=>{const trimmed=category.trim();if(!trimmed||s.categories.some(c=>c.toLowerCase()===trimmed.toLowerCase()))return{};const next={categories:[...s.categories,trimmed]};persist({...s,...next});return next;}),
  exportJSON:()=>{const s=get();download(new Blob([JSON.stringify({format:'neonboard-workspace',version:2,exportedAt:new Date().toISOString(),workspace:s.workspaces.find(w=>w.id===s.activeWorkspaceId),data:toData(s)},null,2)],{type:'application/json'}),'neonboard-workspace-backup.json');},
  exportCSV:()=>{const s=get();const rows=[['title','status','priority','due','project'],...s.tasks.map(t=>[t.title,t.status,t.priority,t.due,s.projects.find(p=>p.id===t.projectId)?.name??''])];const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');download(new Blob([csv],{type:'text/csv;charset=utf-8'}),'neonboard-tasks.csv');},
  importWorkspaceData:async data=>{const current=get();const normalized=normalizeData(data);clearTimeout(persistTimer);await saveWorkspace(normalized,current.activeWorkspaceId);set(normalized);},
  clearWorkspaceData:async()=>{const current=get();const data:AppData={...toData(current),tasks:[],projects:[],notes:[],transactions:[],events:[],connections:[],nodePositions:{},categories:defaultAppData().categories,academic:defaultAcademicData()};clearTimeout(persistTimer);await saveWorkspace(data,current.activeWorkspaceId);set(data);}
}));
