import { supabase } from '@/integrations/supabase/client';
import { generateCaseId, computeSHA256, computeBlockHash } from '@/utils/crypto';

// ─── Cases ───────────────────────────────────────────────────

export async function fetchCases(userId: string) {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createCase(userId: string, name: string) {
  const { data, error } = await supabase
    .from('cases')
    .insert({
      user_id: userId,
      case_code: generateCaseId(),
      name,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function incrementEvidenceCount(caseId: string, currentCount: number) {
  await supabase
    .from('cases')
    .update({ evidence_count: currentCount + 1 })
    .eq('id', caseId);
}

// ─── Evidence ────────────────────────────────────────────────

export async function fetchEvidence(userId: string, caseId?: string) {
  let query = supabase
    .from('evidence_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (caseId) query = query.eq('case_id', caseId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function insertEvidence(record: {
  user_id: string;
  case_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  sha256_hash: string;
  geo_lat: number | null;
  geo_lng: number | null;
  device_info: string;
  status: string;
  notary_hash: string;
  block_index: number;
}) {
  const { data, error } = await supabase
    .from('evidence_records')
    .insert(record)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Custody Log ─────────────────────────────────────────────

export async function fetchCustodyLog(evidenceId: string) {
  const { data, error } = await supabase
    .from('custody_log')
    .select('*')
    .eq('evidence_id', evidenceId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function insertCustodyEntry(entry: {
  user_id: string;
  evidence_id: string;
  action: string;
  actor: string;
  ip_address: string;
  details: string;
}) {
  const { data, error } = await supabase
    .from('custody_log')
    .insert(entry)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Blockchain Ledger ───────────────────────────────────────

export async function fetchBlockchain(userId: string) {
  const { data, error } = await supabase
    .from('blockchain_ledger')
    .select('*')
    .eq('user_id', userId)
    .order('block_index', { ascending: true });
  if (error) throw error;
  return data;
}

export async function addBlockToLedger(userId: string, evidenceHash: string) {
  // Get last block
  const { data: lastBlocks } = await supabase
    .from('blockchain_ledger')
    .select('*')
    .eq('user_id', userId)
    .order('block_index', { ascending: false })
    .limit(1);

  const lastBlock = lastBlocks?.[0];
  const index = lastBlock ? lastBlock.block_index + 1 : 0;
  const previousHash = lastBlock?.block_hash ?? '0000000000000000000000000000000000000000000000000000000000000000';
  const timestamp = new Date().toISOString();
  const nonce = Math.floor(Math.random() * 100000);
  const blockHash = await computeBlockHash(index, timestamp, evidenceHash, previousHash, nonce);

  const { data, error } = await supabase
    .from('blockchain_ledger')
    .insert({
      user_id: userId,
      block_index: index,
      evidence_hash: evidenceHash,
      previous_hash: previousHash,
      nonce,
      block_hash: blockHash,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
