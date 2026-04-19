import { CheckCircle2, Upload, Hash, Eye, ShieldCheck, ShieldAlert, ShieldX, FileCheck2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type CustodyRow = Database['public']['Tables']['custody_log']['Row'];

interface CustodyTimelineProps {
  evidenceCode: string;
  log: CustodyRow[];
}

const iconForAction: Record<string, { icon: typeof CheckCircle2; className: string }> = {
  uploaded: { icon: Upload, className: 'text-primary' },
  hashed: { icon: Hash, className: 'text-primary' },
  viewed: { icon: Eye, className: 'text-muted-foreground' },
  verified_intact: { icon: ShieldCheck, className: 'text-success' },
  verified_tampered: { icon: ShieldX, className: 'text-destructive' },
  encrypted: { icon: ShieldAlert, className: 'text-primary' },
  decrypted: { icon: FileCheck2, className: 'text-primary' },
};

const labelForAction: Record<string, string> = {
  uploaded: 'Uploaded',
  hashed: 'Hashed (SHA-256)',
  viewed: 'Accessed',
  verified_intact: 'Integrity Verified ✔',
  verified_tampered: 'Tampering Detected ✗',
  encrypted: 'Encrypted (AES-256-GCM)',
  decrypted: 'Decrypted',
};

const CustodyTimeline = ({ evidenceCode, log }: CustodyTimelineProps) => {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">
        Evidence ID: <span className="font-mono text-primary">#{evidenceCode}</span>
      </p>

      {log.length === 0 ? (
        <p className="text-sm text-muted-foreground">No timeline events yet.</p>
      ) : (
        <ol className="relative border-l-2 border-border ml-3 space-y-4">
          {log.map((entry) => {
            const cfg = iconForAction[entry.action] ?? { icon: CheckCircle2, className: 'text-primary' };
            const Icon = cfg.icon;
            const label = labelForAction[entry.action] ?? entry.action;
            return (
              <li key={entry.id} className="ml-6">
                <span className="absolute -left-[13px] flex items-center justify-center w-6 h-6 bg-card rounded-full ring-4 ring-background">
                  <Icon className={`w-3.5 h-3.5 ${cfg.className}`} />
                </span>
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">
                    [✔] {label}
                  </p>
                  <time className="text-xs text-muted-foreground font-mono">
                    {new Date(entry.created_at).toLocaleString()}
                  </time>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {entry.actor} · IP {entry.ip_address}
                </p>
                {entry.details && (
                  <p className="text-xs text-muted-foreground mt-0.5 break-all">{entry.details}</p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};

export default CustodyTimeline;
