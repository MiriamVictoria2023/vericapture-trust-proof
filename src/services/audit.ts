import { supabase } from '@/integrations/supabase/client';
import { getClientIP, getDeviceFingerprint } from '@/utils/fingerprint';

export interface AuditEntry {
  user_id: string;
  actor_email: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  suspicious?: boolean;
}

export async function logAudit(entry: AuditEntry) {
  const [ip, fp] = await Promise.all([getClientIP(), getDeviceFingerprint()]);

  // Simple suspicious detection: many actions in short window
  let suspicious = entry.suspicious ?? false;
  if (!suspicious) {
    const since = new Date(Date.now() - 60_000).toISOString();
    const { count } = await supabase
      .from('audit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', entry.user_id)
      .gte('created_at', since);
    if ((count ?? 0) >= 20) suspicious = true;
  }

  const { error } = await supabase.from('audit_logs').insert({
    user_id: entry.user_id,
    actor_email: entry.actor_email,
    action: entry.action,
    resource_type: entry.resource_type ?? null,
    resource_id: entry.resource_id ?? null,
    ip_address: ip,
    device_id: fp.deviceId,
    user_agent: fp.userAgent,
    details: entry.details ?? {},
    suspicious,
  });
  if (error) console.error('Audit log error', error);
}

export async function fetchAuditLogs(limit = 200) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function upsertDeviceFingerprint(userId: string) {
  const fp = await getDeviceFingerprint();
  const { error } = await supabase
    .from('device_fingerprints')
    .upsert(
      {
        user_id: userId,
        device_id: fp.deviceId,
        os: fp.os,
        browser: fp.browser,
        user_agent: fp.userAgent,
        screen_resolution: fp.screenResolution,
        timezone: fp.timezone,
        language: fp.language,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,device_id' }
    );
  if (error) console.error('Device fingerprint error', error);
  return fp;
}
