import { useEffect, useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import { localizeDocument } from '../../lib/localization';
import { createLocalProfile, getLocalProfile, hasLocalProfileRecord, signInLocal } from '../../lib/auth';

export function SignIn({ onAuthenticated }: { onAuthenticated: () => void }) {
  const profile = getLocalProfile();
  const creating = !hasLocalProfileRecord();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [language,setLanguage]=useState<'en'|'fa'>(()=>localStorage.getItem('neonboard.language.v1')==='fa'?'fa':'en');
  useEffect(()=>{document.documentElement.lang=language==='fa'?'fa-IR':'en';document.documentElement.dir=language==='fa'?'rtl':'ltr';const root=document.querySelector('.auth-screen')??document.body;localizeDocument(root,language);const observer=new MutationObserver(()=>localizeDocument(root,language));observer.observe(root,{subtree:true,childList:true,characterData:true});return()=>observer.disconnect();},[language]);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      if (creating) {
        if (name.trim().length < 2) throw new Error('Enter a name with at least two characters.');
        if (password.length < 12) throw new Error('Use at least 12 characters for your device password.');
        if (password !== confirm) throw new Error('The passwords do not match.');
        await createLocalProfile(name, password);
      } else {
        const ok = await signInLocal(password);
        if (!ok) throw new Error(profile ? 'That password did not match this local profile.' : 'The saved local profile is invalid. Do not create a new profile or clear browser data; restore a valid profile backup if available.');
      }
      onAuthenticated();
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.'); }
    finally { setBusy(false); }
  }
  return <main className="auth-screen"><motion.section className="auth-card" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:.24 }}>
    <div className="auth-brand"><span className="brand-symbol">n</span><span>neonboard</span><select aria-label="Interface language" value={language} onChange={e=>{const next=e.target.value as 'en'|'fa';setLanguage(next);localStorage.setItem('neonboard.language.v1',next);}}><option value="en">English</option><option value="fa">فارسی</option></select></div>
    <div className="auth-icon"><LockKeyhole size={24}/></div><p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
    <h1>{creating ? 'Create your local profile' : `Welcome back${profile?.name ? `, ${profile.name}` : ''}.`}</h1>
    <p className="auth-description">{creating ? 'Set up a local profile. Your workspace snapshots are encrypted at rest with a key derived from this password. This is not a cloud account.' : 'Sign in to unlock this browser’s encrypted workspace. You will be asked again after a full reload or 30 minutes of inactivity. The device password cannot be reset or recovered.'}</p>
    <form className="auth-form" onSubmit={submit}>
      {creating && <label>Display name<input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" required maxLength={80}/></label>}
      <label>Device password<input type="password" autoComplete={creating?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder={creating?'At least 12 characters':'Enter your device password'} required minLength={creating?12:1} maxLength={256}/></label>
      {creating && <label>Confirm password<input type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} required/></label>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy?'Please wait…':creating?'Create profile':'Sign in'} <KeyRound size={16}/></button>
    </form>
    <div className="auth-note"><ShieldCheck size={16}/><p><strong>Local-only profile</strong><br/>Workspace snapshots are encrypted at rest using a password-derived key. A lost device password means the data cannot be recovered. This is not server authentication or cloud synchronization.</p></div>
  </motion.section></main>;
}
