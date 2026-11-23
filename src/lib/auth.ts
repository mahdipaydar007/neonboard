const PROFILE_KEY = 'neonboard.local-profile.v1';
const SESSION_KEY = 'neonboard.local-session.v1';
export interface LocalProfile { name: string; salt: string; passwordHash: string; createdAt: string; }
const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (value: string) => Uint8Array.from(atob(value), c => c.charCodeAt(0));
async function derive(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 310_000, hash: 'SHA-256' }, key, 256));
}
export function getLocalProfile(): LocalProfile | null {
  try { const raw = localStorage.getItem(PROFILE_KEY); return raw ? JSON.parse(raw) as LocalProfile : null; } catch { return null; }
}
export function hasLocalSession(): boolean { return sessionStorage.getItem(SESSION_KEY) === '1'; }
export async function createLocalProfile(name: string, password: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordHash = toBase64(await derive(password, salt));
  const profile: LocalProfile = { name: name.trim(), salt: toBase64(salt), passwordHash, createdAt: new Date().toISOString() };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  sessionStorage.setItem(SESSION_KEY, '1');
}
export async function signInLocal(password: string): Promise<boolean> {
  const profile = getLocalProfile(); if (!profile) return false;
  const actual = await derive(password, fromBase64(profile.salt));
  const expected = fromBase64(profile.passwordHash);
  const match = actual.length === expected.length && actual.every((byte, index) => byte === expected[index]);
  if (match) sessionStorage.setItem(SESSION_KEY, '1');
  return match;
}
export function signOutLocal(): void { sessionStorage.removeItem(SESSION_KEY); }
export function deleteLocalProfile(): void { localStorage.removeItem(PROFILE_KEY); sessionStorage.removeItem(SESSION_KEY); }
