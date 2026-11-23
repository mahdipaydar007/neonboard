import { clearWorkspaceEncryptionKey, deriveWorkspaceEncryptionKey, setWorkspaceEncryptionKey } from './storageCrypto';
const PROFILE_KEY = 'neonboard.local-profile.v1';
export interface LocalProfile { name: string; salt: string; passwordHash: string; createdAt: string; iterations?: number; }
const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (value: string) => Uint8Array.from(atob(value), c => c.charCodeAt(0));
const CURRENT_ITERATIONS = 600_000;
async function derive(password: string, salt: Uint8Array, iterations = CURRENT_ITERATIONS): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256));
}
export function hasLocalProfileRecord(): boolean { return localStorage.getItem(PROFILE_KEY) !== null; }
export function getLocalProfile(): LocalProfile | null {
  try { const raw = localStorage.getItem(PROFILE_KEY); if (!raw) return null; const value: unknown = JSON.parse(raw); if (!value || typeof value !== 'object') return null; const profile = value as Partial<LocalProfile>; if (typeof profile.name !== 'string' || profile.name.length>80 || typeof profile.salt !== 'string' || profile.salt.length>128 || typeof profile.passwordHash !== 'string' || profile.passwordHash.length>128 || typeof profile.createdAt !== 'string') return null; if (profile.iterations !== undefined && (!Number.isInteger(profile.iterations) || profile.iterations < 100_000 || profile.iterations > 2_000_000)) return null; return profile as LocalProfile; } catch { return null; }
}
// A derived CryptoKey exists only in memory, so every full page reload requires a fresh sign-in.
export function hasLocalSession(): boolean { return false; }
export async function createLocalProfile(name: string, password: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordHash = toBase64(await derive(password, salt, CURRENT_ITERATIONS));
  const workspaceKey = await deriveWorkspaceEncryptionKey(password, salt, CURRENT_ITERATIONS);
  setWorkspaceEncryptionKey(workspaceKey);
  const profile: LocalProfile = { name: name.trim(), salt: toBase64(salt), passwordHash, iterations: CURRENT_ITERATIONS, createdAt: new Date().toISOString() };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
export async function signInLocal(password: string): Promise<boolean> {
  const profile = getLocalProfile();
  if (!profile) return false;
  let salt:Uint8Array; let expected:Uint8Array;try{salt=fromBase64(profile.salt);expected=fromBase64(profile.passwordHash);}catch{return false;}
  if(salt.length!==16||expected.length!==32)return false;
  let iterations = profile.iterations ?? 310_000;
  const actual = await derive(password, salt, iterations);
  const match = actual.length === expected.length && actual.every((byte, index) => byte === expected[index]);
  if (!match) return false;
  if (iterations < CURRENT_ITERATIONS) {
    salt = crypto.getRandomValues(new Uint8Array(16));
    iterations = CURRENT_ITERATIONS;
    const passwordHash = toBase64(await derive(password, salt, iterations));
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...profile, salt: toBase64(salt), passwordHash, iterations }));
  }
  setWorkspaceEncryptionKey(await deriveWorkspaceEncryptionKey(password, salt, iterations));
  return true;
}
export function signOutLocal(): void { clearWorkspaceEncryptionKey(); }
export function deleteLocalProfile(): void { localStorage.removeItem(PROFILE_KEY); clearWorkspaceEncryptionKey(); }
