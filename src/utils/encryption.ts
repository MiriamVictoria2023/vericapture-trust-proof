/**
 * AES-256-GCM client-side encryption utilities.
 * Key is derived from the user's password via PBKDF2 (250k iterations).
 *
 * Storage format on disk: [12-byte IV][ciphertext+GCM tag]
 * IV and salt are also persisted in the DB for convenience.
 */

const PBKDF2_ITERATIONS = 250_000;
const SALT_LEN = 16;
const IV_LEN = 12;

function bufToB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function b64ToBuf(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedPayload {
  /** Combined IV + ciphertext as Blob (ready to upload) */
  blob: Blob;
  ivB64: string;
  saltB64: string;
  algorithm: string;
}

export async function encryptFile(file: File, password: string): Promise<EncryptedPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const key = await deriveKey(password, salt);
  const plaintext = await file.arrayBuffer();
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, plaintext);

  // Pack [IV][ciphertext]
  const packed = new Uint8Array(IV_LEN + ciphertext.byteLength);
  packed.set(iv, 0);
  packed.set(new Uint8Array(ciphertext), IV_LEN);

  return {
    blob: new Blob([packed], { type: 'application/octet-stream' }),
    ivB64: bufToB64(iv),
    saltB64: bufToB64(salt),
    algorithm: 'AES-GCM-256',
  };
}

export async function decryptFile(
  encryptedBlob: Blob,
  password: string,
  saltB64: string,
  originalType: string
): Promise<Blob> {
  const packed = new Uint8Array(await encryptedBlob.arrayBuffer());
  const iv = packed.slice(0, IV_LEN);
  const ciphertext = packed.slice(IV_LEN);
  const salt = b64ToBuf(saltB64);
  const key = await deriveKey(password, salt);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, ciphertext as BufferSource);
  return new Blob([plaintext], { type: originalType || 'application/octet-stream' });
}
