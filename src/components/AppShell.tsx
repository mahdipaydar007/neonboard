import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Activity, ArrowUpRight, BriefcaseBusiness, CheckSquare, ChevronDown, Command, LayoutDashboard, Menu, NotebookPen, Plus, Search, Settings2, Wallet } from 'lucide-react';
import { useMemo, useState, type CSSProperties } from 'react';
import { useAppStore } from '../store/useAppStore';
const nav = [
  { id:'dashboard', label:'Overview', to:'/', icon:LayoutDashboard },
  { id:'tasks', label:'Tasks', to:'/tasks', icon:CheckSquare },
  { id:'projects', label:'Projects', to:'/projects', icon:BriefcaseBusiness },
  { id:'notes', label:'Notes', to:'/notes', icon:NotebookPen },
  { id:'finance', label:'Finance', to:'/finance', icon:Wallet }
];
const titles: Record<string,string> = {'/':'Overview','/tasks':'Tasks','/projects':'Projects','/notes':'Notes','/finance':'Finance','/settings':'Preferences'};
export function AppShell() {
  const location = useLocation(); const [query,setQuery] = useState(''); const [mobileOpen,setMobileOpen] = useState(false);
  const prefs = useAppStore(s=>s.preferences); const openCount = useAppStore(s=>s.tasks.filter(t=>t.status!=='done').length); const hidden = useAppStore(s=>s.hiddenNav); const order = useAppStore(s=>s.navOrder);
  const links = useMemo(() => [...nav].sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id)).filter(n=>!hidden.includes(n.id)),[hidden,order]);
  const title = titles[location.pathname] ?? 'Workspace';
  return <div className={`app-frame ${mobileOpen?'mobile-open':''}`} data-theme={prefs.theme} style={{'--accent':prefs.accent} as CSSProperties & { '--accent': string }}>
    <aside className="sidebar">
      <NavLink to="/" className="brand" onClick={()=>setMobileOpen(false)}><span className="brand-symbol">n</span><span>neonboard</span><span className="brand-beta">WORKSPACE</span></NavLink>
      <div className="workspace-switch"><div className="workspace-avatar">M</div><div><strong>My workspace</strong><small>Personal space</small></div><ChevronDown size={15}/></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="primary-nav" aria-label="Main navigation">{links.map(item=>{const Icon=item.icon;return <NavLink key={item.id} to={item.to} end={item.to==='/'} onClick={()=>setMobileOpen(false)} className={({isActive})=>`nav-link ${isActive?'active':''}`}><Icon size={17}/><span>{item.label}</span>{item.id==='tasks'&&<span className="nav-count">{openCount}</span>}</NavLink>})}</nav>
      <div className="nav-label nav-label-spaced">PERSONALIZE</div>
      <NavLink to="/settings" className={({isActive})=>`nav-link ${isActive?'active':''}`}><Settings2 size={17}/><span>Preferences</span></NavLink>
      <div className="sidebar-bottom"><div className="storage-card"><div className="storage-icon"><Activity size={16}/></div><div><strong>Your space, your pace</strong><p>Everything stays on this device.</p></div><ArrowUpRight size={14}/></div><div className="profile-row"><div className="profile-avatar">M</div><div><strong>My profile</strong><small>Personal workspace</small></div><button className="icon-button" aria-label="Profile options"><Menu size={16}/></button></div></div>
    </aside>
    <main className="main-area"><header className="topbar"><button className="mobile-menu icon-button" onClick={()=>setMobileOpen(!mobileOpen)} aria-label="Toggle menu"><Menu size={19}/></button><div className="breadcrumbs"><span>Workspace</span><span className="crumb-sep">/</span><strong>{title}</strong></div><div className="topbar-actions"><label className="global-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search anything..." aria-label="Search workspace"/><kbd><Command size={10}/> K</kbd></label><button className="button button-primary button-small" onClick={()=>window.dispatchEvent(new CustomEvent('neonboard:new-task'))}><Plus size={16}/>New task</button></div></header><div className="page-content"><Outlet context={{search:query}}/></div><footer className="app-footer"><span><i className="status-dot"/> Saved locally</span><span>NEONBOARD <b>·</b> PERSONAL WORKSPACE</span></footer></main>
  </div>;
}
