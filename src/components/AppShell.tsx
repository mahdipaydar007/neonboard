import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Activity, ArrowUpRight, BriefcaseBusiness, CalendarDays, CheckSquare, ChevronDown, Command, LayoutDashboard, Menu, NotebookPen, Plus, Search, Settings2, Wallet, Workflow, KeyRound, BookOpen, X, LogOut } from 'lucide-react';
import { useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Modal } from './Modal';
import { getLocalProfile, signOutLocal } from '../lib/auth';
import type { Priority } from '../types';

const nav = [
  { id:'dashboard', label:'Overview', to:'/', icon:LayoutDashboard },
  { id:'tasks', label:'Tasks', to:'/tasks', icon:CheckSquare },
  { id:'projects', label:'Projects', to:'/projects', icon:BriefcaseBusiness },
  { id:'calendar', label:'Calendar', to:'/calendar', icon:CalendarDays },
  { id:'connections', label:'Connections', to:'/connections', icon:Workflow },
  { id:'notes', label:'Notes', to:'/notes', icon:NotebookPen },
  { id:'finance', label:'Finance', to:'/finance', icon:Wallet },
  { id:'vault', label:'Password vault', to:'/vault', icon:KeyRound },
  { id:'guide', label:'Guide', to:'/guide', icon:BookOpen }
];
const titles: Record<string,string> = {'/':'Overview','/tasks':'Tasks','/projects':'Projects','/calendar':'Calendar','/connections':'Connections','/notes':'Notes','/finance':'Finance','/vault':'Password vault','/guide':'Guide','/settings':'Preferences'};
export function AppShell({ onSignOut }: { onSignOut: () => void }) {
  const location = useLocation();
  const [query,setQuery] = useState(''); const [mobileOpen,setMobileOpen] = useState(false); const [workspaceOpen,setWorkspaceOpen] = useState(false);
  const [newWorkspaceOpen,setNewWorkspaceOpen] = useState(false); const [newTaskOpen,setNewTaskOpen] = useState(false);
  const [taskTitle,setTaskTitle] = useState(''); const [taskDue,setTaskDue] = useState(''); const [taskPriority,setTaskPriority] = useState<Priority>('medium'); const [taskProject,setTaskProject] = useState('');
  const [workspaceName,setWorkspaceName] = useState(''); const [workspaceKind,setWorkspaceKind] = useState<'personal'|'business'|'study'|'custom'>('personal');
  const prefs = useAppStore(s=>s.preferences); const openCount = useAppStore(s=>s.tasks.filter(t=>t.status!=='done').length);
  const hidden = useAppStore(s=>s.hiddenNav); const order = useAppStore(s=>s.navOrder); const workspaces = useAppStore(s=>s.workspaces);
  const activeWorkspaceId = useAppStore(s=>s.activeWorkspaceId); const switchWorkspace = useAppStore(s=>s.switchWorkspace); const createWorkspace = useAppStore(s=>s.createWorkspace);
  const addTask = useAppStore(s=>s.addTask); const projects = useAppStore(s=>s.projects); const profile = getLocalProfile();
  const links = useMemo(() => [...nav].sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id)).filter(n=>!hidden.includes(n.id)),[hidden,order]);
  const title = titles[location.pathname] ?? 'Workspace'; const activeWorkspace = workspaces.find(w=>w.id===activeWorkspaceId) ?? workspaces[0];
  function submitTask(event: FormEvent) { event.preventDefault(); if (!taskTitle.trim()) return; addTask({ title:taskTitle.trim(), notes:'', priority:taskPriority, status:'todo', due:taskDue, projectId:taskProject }); setTaskTitle(''); setTaskDue(''); setTaskPriority('medium'); setTaskProject(''); setNewTaskOpen(false); }
  async function submitWorkspace(event: FormEvent) { event.preventDefault(); if (!workspaceName.trim()) return; await createWorkspace(workspaceName, workspaceKind); setWorkspaceName(''); setNewWorkspaceOpen(false); setWorkspaceOpen(false); setMobileOpen(false); }
  return <div className={`app-frame ${mobileOpen?'mobile-open':''}`} data-theme={prefs.theme} style={{'--accent':prefs.accent, '--font-scale':String([.88,.94,1,1.08,1.16][prefs.fontScale] ?? 1)} as CSSProperties & { '--accent': string; '--font-scale': string }}>
    {mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={()=>setMobileOpen(false)}/>}
    <aside className="sidebar">
      <NavLink to="/" className="brand" onClick={()=>setMobileOpen(false)}><span className="brand-symbol">n</span><span>neonboard</span><span className="brand-beta">WORKSPACE</span></NavLink>
      <div className="workspace-menu-wrap"><button type="button" className={`workspace-switch ${workspaceOpen?'is-open':''}`} aria-expanded={workspaceOpen} onClick={()=>setWorkspaceOpen(v=>!v)}>
        <div className="workspace-avatar">{(activeWorkspace?.name ?? 'W').slice(0,1).toUpperCase()}</div><div><strong>{activeWorkspace?.name ?? 'My workspace'}</strong><small>{activeWorkspace?.kind ?? 'Personal'} space</small></div><ChevronDown size={16}/>
      </button>{workspaceOpen && <div className="workspace-popover" role="menu"><p className="popover-label">YOUR WORKSPACES</p>
        {workspaces.map(workspace=><button key={workspace.id} role="menuitem" className={`workspace-option ${workspace.id===activeWorkspaceId?'active':''}`} onClick={()=>{void switchWorkspace(workspace.id);setWorkspaceOpen(false);setMobileOpen(false);}}><span>{workspace.name}</span><small>{workspace.kind}</small></button>)}
        <button className="workspace-create" onClick={()=>{setWorkspaceName('');setNewWorkspaceOpen(true);}}><Plus size={15}/> Create workspace</button>
      </div>}</div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="primary-nav" aria-label="Main navigation">{links.map(item=>{const Icon=item.icon;return <NavLink key={item.id} to={item.to} end={item.to==='/'} onClick={()=>setMobileOpen(false)} className={({isActive})=>`nav-link ${isActive?'active':''}`}><Icon size={18}/><span>{item.label}</span>{item.id==='tasks'&&<span className="nav-count">{openCount}</span>}</NavLink>})}</nav>
      <div className="nav-label nav-label-spaced">PERSONALIZE</div><NavLink to="/settings" onClick={()=>setMobileOpen(false)} className={({isActive})=>`nav-link ${isActive?'active':''}`}><Settings2 size={18}/><span>Preferences</span></NavLink>
      <div className="sidebar-bottom"><div className="storage-card"><div className="storage-icon"><Activity size={17}/></div><div><strong>Saved on this device</strong><p>Your workspace stays in this browser.</p></div><ArrowUpRight size={14}/></div><div className="profile-row"><div className="profile-avatar">{(profile?.name??'U').slice(0,1).toUpperCase()}</div><div><strong>{profile?.name??'Local profile'}</strong><small>Device profile</small></div><button className="icon-button" aria-label="Sign out" title="Sign out" onClick={()=>{signOutLocal();onSignOut();}}><LogOut size={16}/></button></div></div>
    </aside>
    <main className="main-area"><header className="topbar"><button className="mobile-menu icon-button" onClick={()=>setMobileOpen(!mobileOpen)} aria-label={mobileOpen?'Close navigation':'Open navigation'} aria-expanded={mobileOpen}>{mobileOpen?<X size={20}/>:<Menu size={20}/>}</button><div className="breadcrumbs"><span>{activeWorkspace?.name ?? 'Workspace'}</span><span className="crumb-sep">/</span><strong>{title}</strong></div><div className="topbar-actions"><label className="global-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search anything..." aria-label="Search workspace"/><kbd><Command size={11}/> K</kbd></label><button className="button button-primary button-small" onClick={()=>setNewTaskOpen(true)}><Plus size={16}/><span>New task</span></button></div></header><div className="page-content"><Outlet context={{search:query}}/></div><footer className="app-footer"><span><i className="status-dot"/> Saved locally</span><span>NEONBOARD <b>·</b> {activeWorkspace?.kind.toUpperCase() ?? 'WORKSPACE'} SPACE</span></footer></main>
    <Modal open={newTaskOpen} title="Create a task" onClose={()=>setNewTaskOpen(false)}><form className="dialog-form" onSubmit={submitTask}><label>Task name<input autoFocus value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} placeholder="What needs to get done?" required/></label><div className="form-grid"><label>Due date<input type="date" value={taskDue} onChange={e=>setTaskDue(e.target.value)}/></label><label>Priority<select value={taskPriority} onChange={e=>setTaskPriority(e.target.value as Priority)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label></div><label>Project<select value={taskProject} onChange={e=>setTaskProject(e.target.value)}><option value="">No project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><div className="dialog-actions"><button type="button" className="button button-secondary" onClick={()=>setNewTaskOpen(false)}>Cancel</button><button type="submit" className="button button-primary" disabled={!taskTitle.trim()}>Create task</button></div></form></Modal>
    <Modal open={newWorkspaceOpen} title="Create workspace" onClose={()=>setNewWorkspaceOpen(false)}><form className="dialog-form" onSubmit={submitWorkspace}><label>Workspace name<input autoFocus value={workspaceName} onChange={e=>setWorkspaceName(e.target.value)} placeholder="e.g. Freelance studio" required/></label><label>Workspace type<select value={workspaceKind} onChange={e=>setWorkspaceKind(e.target.value as typeof workspaceKind)}><option value="personal">Personal</option><option value="business">Business</option><option value="study">Study</option><option value="custom">Custom</option></select></label><div className="dialog-actions"><button type="button" className="button button-secondary" onClick={()=>setNewWorkspaceOpen(false)}>Cancel</button><button type="submit" className="button button-primary" disabled={!workspaceName.trim()}>Create workspace</button></div></form></Modal>
  </div>;
}
