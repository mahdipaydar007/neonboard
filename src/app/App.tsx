import { lazy, Suspense, useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
const AppShell = lazy(() => import('../components/AppShell').then(module => ({ default: module.AppShell })));
const Dashboard = lazy(() => import('../features/dashboard/Dashboard').then(module => ({ default: module.Dashboard })));
const Tasks = lazy(() => import('../features/tasks/Tasks').then(module => ({ default: module.Tasks })));
const Projects = lazy(() => import('../features/projects/Projects').then(module => ({ default: module.Projects })));
const Notes = lazy(() => import('../features/notes/Notes').then(module => ({ default: module.Notes })));
const Finance = lazy(() => import('../features/finance/Finance').then(module => ({ default: module.Finance })));
const Settings = lazy(() => import('../features/settings/Settings').then(module => ({ default: module.Settings })));
const Calendar = lazy(() => import('../features/calendar/Calendar').then(module => ({ default: module.Calendar })));
const Connections = lazy(() => import('../features/connections/Connections').then(module => ({ default: module.Connections })));
const Vault = lazy(() => import('../features/vault/Vault').then(module => ({ default: module.Vault })));
const Guide = lazy(() => import('../features/guide/Guide').then(module => ({ default: module.Guide })));
const University = lazy(() => import('../features/university/University').then(module => ({ default: module.University })));
import { SignIn } from '../features/auth/SignIn';
import { useAppStore } from '../store/useAppStore';
import { signOutLocal } from '../lib/auth';
import { localizeDocument, translateUiValue } from '../lib/localization';

function HydratedApp() {
  const hydrate=useAppStore(s=>s.hydrate), hydrated=useAppStore(s=>s.hydrated), prefs=useAppStore(s=>s.preferences);
  const [authenticated,setAuthenticated]=useState(false);
  useEffect(()=>{if(!authenticated)return;void hydrate().catch(error=>{console.error('Could not unlock local workspace:',error);signOutLocal();useAppStore.getState().resetForLock();setAuthenticated(false);});},[authenticated,hydrate]);
  useEffect(()=>{
    if(!authenticated)return;
    const flush=()=>{if(document.visibilityState==='hidden')void useAppStore.getState().flushPendingSave().catch(error=>console.error('Could not flush workspace changes:',error));};
    window.addEventListener('pagehide',flush);document.addEventListener('visibilitychange',flush);
    let timer:number;
    const lock=()=>{window.clearTimeout(timer);timer=window.setTimeout(()=>{signOutLocal();useAppStore.getState().resetForLock();setAuthenticated(false);},30*60*1000);};
    const events=['pointerdown','keydown','touchstart'];events.forEach(name=>window.addEventListener(name,lock,{passive:true}));lock();
    return()=>{window.clearTimeout(timer);events.forEach(name=>window.removeEventListener(name,lock));window.removeEventListener('pagehide',flush);document.removeEventListener('visibilitychange',flush);};
  },[authenticated]);
  useEffect(()=>{
    const language=prefs.language;
    document.documentElement.lang=language==='fa'?'fa-IR':'en';
    document.documentElement.dir=language==='fa'?'rtl':'ltr';
    document.documentElement.dataset.language=language;
    localizeDocument(document.body,language);
    const nativeConfirm=window.confirm.bind(window);
    const nativeAlert=window.alert.bind(window);
    const nativePrompt=window.prompt.bind(window);
    window.confirm=(message?:string)=>nativeConfirm(translateUiValue(message??'',language));
    window.alert=(message?:unknown)=>nativeAlert(translateUiValue(String(message??''),language));
    window.prompt=(message?:string,defaultValue?:string)=>nativePrompt(translateUiValue(message??'',language),defaultValue);
    const observer=new MutationObserver(records=>{
      for(const record of records){
        if(record.type==='characterData'&&record.target.parentElement) localizeDocument(record.target.parentElement,language);
        for(const node of Array.from(record.addedNodes)){if(node instanceof Element)localizeDocument(node,language);else if(node instanceof Text&&node.parentElement)localizeDocument(node.parentElement,language);}
      }
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    return()=>{observer.disconnect();window.confirm=nativeConfirm;window.alert=nativeAlert;window.prompt=nativePrompt;};
  },[prefs.language]);
  useEffect(()=>{
    document.documentElement.lang=prefs.language==='fa'?'fa-IR':'en';
    document.documentElement.dir=prefs.language==='fa'?'rtl':'ltr';
    document.documentElement.dataset.language=prefs.language;
    document.documentElement.dataset.theme=prefs.theme;
    document.documentElement.dataset.font=prefs.font;
    document.documentElement.dataset.reduceMotion=String(prefs.reducedMotion);
    document.documentElement.style.setProperty('--font-scale', String([.88,.94,1,1.08,1.16][prefs.fontScale] ?? 1));
  },[prefs]);
  if(!authenticated) return <SignIn onAuthenticated={()=>setAuthenticated(true)}/>;
  if(!hydrated) return <div className="boot-screen"><div className="boot-mark">n</div><span>Preparing your workspace</span><div className="boot-line"/></div>;
  return <MotionConfig reducedMotion={prefs.reducedMotion?'always':'user'}><BrowserRouter><Suspense fallback={<div className="boot-screen" role="status"><div className="boot-mark">n</div><span>Preparing your workspace</span><div className="boot-line"/></div>}><Routes><Route element={<AppShell onSignOut={()=>{signOutLocal();useAppStore.getState().resetForLock();setAuthenticated(false);}}/>}><Route index element={<Dashboard/>}/><Route path="tasks" element={<Tasks/>}/><Route path="projects" element={<Projects/>}/><Route path="calendar" element={<Calendar/>}/><Route path="connections" element={<Connections/>}/><Route path="notes" element={<Notes/>}/><Route path="finance" element={<Finance/>}/><Route path="vault" element={<Vault/>}/><Route path="guide" element={<Guide/>}/><Route path="university" element={<University/>}/><Route path="settings" element={<Settings onDeleteAccount={()=>window.location.reload()}/>}/><Route path="*" element={<div className="empty-state"><h2>Page not found</h2><p>This page hasn't found its way home.</p></div>}/></Route></Routes></Suspense></BrowserRouter></MotionConfig>;
}
export default function App(){return <HydratedApp/>;}
