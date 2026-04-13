import type { BlockchainEntry } from '@/types/evidence';
import { computeBlockHash } from './crypto';

/**
 * Mock blockchain ledger for Digital Notary feature.
 * Maintains an immutable chain of evidence hashes.
 */

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

let chain: BlockchainEntry[] = [];

export function getChain(): BlockchainEntry[] {
  return [...chain];
}

export async function addBlock(evidenceHash: string): Promise<BlockchainEntry> {
  const index = chain.length;
  const previousHash = index === 0 ? GENESIS_HASH : chain[index - 1].hash;
  const timestamp = new Date().toISOString();
  const nonce = Math.floor(Math.random() * 100000);
  const hash = await computeBlockHash(index, timestamp, evidenceHash, previousHash, nonce);

  const block: BlockchainEntry = {
    index,
    timestamp,
    evidenceHash,
    previousHash,
    nonce,
    hash,
  };

  chain.push(block);
  return block;
}

export function verifyChain(): boolean {
  for (let i = 1; i < chain.length; i++) {
    if (chain[i].previousHash !== chain[i - 1].hash) return false;
  }
  return true;
}
