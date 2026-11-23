import { useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Dashboard } from '../features/dashboard/Dashboard';
import { Tasks } from '../features/tasks/Tasks';
import { Projects } from '../features/projects/Projects';
import { Notes } from '../features/notes/Notes';
import { Finance } from '../features/finance/Finance';
import { Settings } from '../features/settings/Settings';
import { Calendar } from '../features/calendar/Calendar';
import { Connections } from '../features/connections/Connections';
import { Vault } from '../features/vault/Vault';
import { Guide } from '../features/guide/Guide';
import { SignIn } from '../features/auth/SignIn';
import { useAppStore } from '../store/useAppStore';
import { hasLocalSession, signOutLocal } from '../lib/auth';

function HydratedApp() {
  const hydrate=useAppStore(s=>s.hydrate), hydrated=useAppStore(s=>s.hydrated), prefs=useAppStore(s=>s.preferences);
  const [authenticated,setAuthenticated]=useState(hasLocalSession());
  useEffect(()=>{void hydrate();},[hydrate]);
  useEffect(()=>{
    document.documentElement.dataset.theme=prefs.theme;
    document.documentElement.dataset.font=prefs.font;
    document.documentElement.dataset.reduceMotion=String(prefs.reducedMotion);
    document.documentElement.style.setProperty('--font-scale', String([.88,.94,1,1.08,1.16][prefs.fontScale] ?? 1));
  },[prefs]);
  if(!hydrated) return <div className="boot-screen"><div className="boot-mark">n</div><span>Preparing your workspace</span><div className="boot-line"/></div>;
  if(!authenticated) return <SignIn onAuthenticated={()=>setAuthenticated(true)}/>;
  return <MotionConfig reducedMotion={prefs.reducedMotion?'always':'user'}><BrowserRouter><Routes><Route element={<AppShell onSignOut={()=>{signOutLocal();setAuthenticated(false);}}/>}><Route index element={<Dashboard/>}/><Route path="tasks" element={<Tasks/>}/><Route path="projects" element={<Projects/>}/><Route path="calendar" element={<Calendar/>}/><Route path="connections" element={<Connections/>}/><Route path="notes" element={<Notes/>}/><Route path="finance" element={<Finance/>}/><Route path="vault" element={<Vault/>}/><Route path="guide" element={<Guide/>}/><Route path="settings" element={<Settings onDeleteAccount={()=>window.location.reload()}/>}/><Route path="*" element={<div className="empty-state"><h2>Page not found</h2><p>This page hasn't found its way home.</p></div>}/></Route></Routes></BrowserRouter></MotionConfig>;
}
export default function App(){return <HydratedApp/>;}
