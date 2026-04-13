/**
 * Compute SHA-256 hash of a file using Web Crypto API.
 * Returns hex-encoded hash string.
 */
export async function computeSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Mock AES-256 encryption indicator.
 * In production, this would use Web Crypto AES-GCM.
 */
export function encryptionStatus(): { algorithm: string; keySize: number; mode: string } {
  return { algorithm: 'AES', keySize: 256, mode: 'GCM' };
}

/**
 * Simple mock blockchain hash function for digital notary.
 */
export async function computeBlockHash(
  index: number,
  timestamp: string,
  evidenceHash: string,
  previousHash: string,
  nonce: number
): Promise<string> {
  const data = `${index}${timestamp}${evidenceHash}${previousHash}${nonce}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a random case ID in format VC-XXXXXX
 */
export function generateCaseId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'VC-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
