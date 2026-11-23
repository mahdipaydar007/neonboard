const encoder = new TextEncoder();
const decoder = new TextDecoder();
let workspaceKey: CryptoKey | null = null;
function toBase64(bytes: Uint8Array): string { let binary=''; for(let offset=0;offset<bytes.length;offset+=0x8000)binary+=String.fromCharCode(...bytes.subarray(offset,offset+0x8000)); return btoa(binary); }

export function setWorkspaceEncryptionKey(key: CryptoKey): void { workspaceKey = key; }
export function clearWorkspaceEncryptionKey(): void { workspaceKey = null; }
export function getWorkspaceEncryptionKey(): CryptoKey | null { return workspaceKey; }

export async function deriveWorkspaceEncryptionKey(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  // Domain separation ensures the stored password verifier is never the workspace AES key.
  const context = encoder.encode('neonboard-workspace-encryption-v1');
  const keySalt = new Uint8Array(salt.length + context.length);keySalt.set(salt);keySalt.set(context,salt.length);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt:keySalt, iterations, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt','decrypt']);
}

export async function encryptWorkspaceData(data: unknown, workspaceId: string): Promise<{ iv: string; ciphertext: string }> {
  if (!workspaceKey) throw new Error('Workspace is locked. Sign in before saving data.');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(workspaceId) }, workspaceKey, encoder.encode(JSON.stringify(data)));
  return { iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(encrypted)) };
}

export async function decryptWorkspaceData<T>(record: { iv: string; ciphertext: string }, workspaceId: string): Promise<T> {
  if (!workspaceKey) throw new Error('Workspace is locked. Sign in to decrypt local data.');
  if (record.ciphertext.length > 30_000_000) throw new Error('Encrypted workspace record is too large.');
  const iv = Uint8Array.from(atob(record.iv), char => char.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(record.ciphertext), char => char.charCodeAt(0));
  if (iv.length !== 12 || ciphertext.length < 16) throw new Error('Invalid encrypted workspace record.');
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(workspaceId) }, workspaceKey, ciphertext);
  return JSON.parse(decoder.decode(plain)) as T;
}
