import { useEffect } from 'react';
import { MotionConfig } from 'motion/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Dashboard } from '../features/dashboard/Dashboard';
import { Tasks } from '../features/tasks/Tasks';
import { Projects } from '../features/projects/Projects';
import { Notes } from '../features/notes/Notes';
import { Finance } from '../features/finance/Finance';
import { Settings } from '../features/settings/Settings';
import { useAppStore } from '../store/useAppStore';
function HydratedApp(){const hydrate=useAppStore(s=>s.hydrate),hydrated=useAppStore(s=>s.hydrated),prefs=useAppStore(s=>s.preferences);useEffect(()=>{void hydrate();},[hydrate]);useEffect(()=>{document.documentElement.dataset.theme=prefs.theme;document.documentElement.dataset.font=prefs.font;document.documentElement.dataset.reduceMotion=String(prefs.reducedMotion);},[prefs]);if(!hydrated)return <div className="boot-screen"><div className="boot-mark">n</div><span>Preparing your workspace</span><div className="boot-line"/></div>;return <MotionConfig reducedMotion={prefs.reducedMotion?'always':'user'}><BrowserRouter><Routes><Route element={<AppShell/>}><Route index element={<Dashboard/>}/><Route path="tasks" element={<Tasks/>}/><Route path="projects" element={<Projects/>}/><Route path="notes" element={<Notes/>}/><Route path="finance" element={<Finance/>}/><Route path="settings" element={<Settings/>}/><Route path="*" element={<div className="empty-state"><h2>Page not found</h2><p>This page hasn't found its way home.</p></div>}/></Route></Routes></BrowserRouter></MotionConfig>}
export default function App(){return <HydratedApp/>;}
