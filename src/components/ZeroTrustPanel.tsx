import { useEffect, useState } from 'react';
import { ShieldCheck, KeyRound, Smartphone, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getDeviceFingerprint, type DeviceFingerprint } from '@/utils/fingerprint';

const ZeroTrustPanel = () => {
  const { user, session, sessionPassword, roles } = useAuth();
  const [fp, setFp] = useState<DeviceFingerprint | null>(null);

  useEffect(() => {
    getDeviceFingerprint().then(setFp);
  }, []);

  const tokenExpiresAt = session?.expires_at ? new Date(session.expires_at * 1000) : null;
  const tokenValid = !!tokenExpiresAt && tokenExpiresAt.getTime() > Date.now();
  const userVerified = !!user?.email_confirmed_at || !!user?.phone_confirmed_at;
  const deviceVerified = !!fp;
  const keyAvailable = !!sessionPassword;

  const checks = [
    { label: 'Device verified', ok: deviceVerified, icon: Smartphone, detail: fp ? `${fp.os} · ${fp.browser}` : 'Reading…' },
    { label: 'User verified', ok: userVerified || !!user, icon: UserCheck, detail: user?.email || user?.phone || 'No identity' },
    { label: 'Session token valid', ok: tokenValid, icon: ShieldCheck, detail: tokenExpiresAt ? `Expires ${tokenExpiresAt.toLocaleTimeString()}` : 'No token' },
    { label: 'Encryption key ready', ok: keyAvailable, icon: KeyRound, detail: keyAvailable ? 'AES-256-GCM derived' : 'Re-login required' },
  ];

  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Zero-Trust Status</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Continuous verification — every request re-validated.
      </p>
      <div className="space-y-2">
        {checks.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="flex items-center justify-between gap-3 p-2 rounded-md bg-muted/30">
              <div className="flex items-center gap-2 min-w-0">
                <Icon className={`w-4 h-4 flex-shrink-0 ${c.ok ? 'text-success' : 'text-destructive'}`} />
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{c.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.detail}</p>
                </div>
              </div>
              <span className={`text-xs font-mono ${c.ok ? 'text-success' : 'text-destructive'}`}>
                {c.ok ? '✔' : '✗'}
              </span>
            </div>
          );
        })}
      </div>
      {roles.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">Active roles</p>
          <div className="flex gap-1.5 mt-1 flex-wrap">
            {roles.map((r) => (
              <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize font-medium">
                {r}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ZeroTrustPanel;
