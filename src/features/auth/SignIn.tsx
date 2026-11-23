import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import { createLocalProfile, getLocalProfile, signInLocal } from '../../lib/auth';

export function SignIn({ onAuthenticated }: { onAuthenticated: () => void }) {
  const profile = getLocalProfile();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const creating = !profile;
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      if (creating) {
        if (name.trim().length < 2) throw new Error('Enter a name with at least two characters.');
        if (password.length < 8) throw new Error('Use at least 8 characters for your device password.');
        if (password !== confirm) throw new Error('The passwords do not match.');
        await createLocalProfile(name, password);
      } else {
        const ok = await signInLocal(password);
        if (!ok) throw new Error('That password did not match this local profile.');
      }
      onAuthenticated();
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.'); }
    finally { setBusy(false); }
  }
  return <main className="auth-screen"><motion.section className="auth-card" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:.24 }}>
    <div className="auth-brand"><span className="brand-symbol">n</span><span>neonboard</span></div>
    <div className="auth-icon"><LockKeyhole size={24}/></div><p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
    <h1>{creating ? 'Create your local profile' : `Welcome back${profile?.name ? `, ${profile.name}` : ''}.`}</h1>
    <p className="auth-description">{creating ? 'Set up a profile to keep this device’s workspace private from casual access.' : 'Sign in to open your workspace on this device.'}</p>
    <form className="auth-form" onSubmit={submit}>
      {creating && <label>Display name<input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" required/></label>}
      <label>Device password<input type="password" autoComplete={creating?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8}/></label>
      {creating && <label>Confirm password<input type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} required/></label>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy?'Please wait…':creating?'Create profile':'Sign in'} <KeyRound size={16}/></button>
    </form>
    <div className="auth-note"><ShieldCheck size={16}/><p><strong>Local-only profile</strong><br/>Your profile and workspace data stay in this browser. This is not a cloud account and does not sync between devices.</p></div>
  </motion.section></main>;
}
