import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'evidence-files';

export async function uploadEncryptedFile(userId: string, fileName: string, blob: Blob): Promise<string> {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${userId}/${Date.now()}-${safe}.enc`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'application/octet-stream',
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function downloadEncryptedFile(path: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) throw error;
  return data;
}
