import { useEffect, useState } from 'react';
import { ArrowLeft, ShieldAlert, AlertTriangle, MapPin, Smartphone, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchAuditLogs } from '@/services/audit';
import { useAuth } from '@/contexts/AuthContext';

interface AuditLogsDashboardProps {
  onBack: () => void;
}

interface AuditRow {
  id: string;
  user_id: string;
  actor_email: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  device_id: string | null;
  user_agent: string | null;
  details: unknown;
  suspicious: boolean;
  created_at: string;
}

const AuditLogsDashboard = ({ onBack }: AuditLogsDashboardProps) => {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'suspicious'>('all');

  useEffect(() => {
    fetchAuditLogs(500).then((d) => { setLogs(d as AuditRow[]); setLoading(false); });
  }, []);

  if (!isAdmin) {
    return (
      <div className="min-h-screen p-6 max-w-3xl mx-auto">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
        <div className="glass-panel rounded-xl p-6 mt-4 text-center">
          <ShieldAlert className="w-10 h-10 text-destructive mx-auto mb-2" />
          <p className="text-foreground font-medium">Access denied</p>
          <p className="text-sm text-muted-foreground">Audit logs are restricted to administrators.</p>
        </div>
      </div>
    );
  }

  const filtered = filter === 'suspicious' ? logs.filter((l) => l.suspicious) : logs;
  const suspiciousCount = logs.filter((l) => l.suspicious).length;

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
        <div className="flex gap-2">
          <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
            All ({logs.length})
          </Button>
          <Button size="sm" variant={filter === 'suspicious' ? 'destructive' : 'outline'} onClick={() => setFilter('suspicious')}>
            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Suspicious ({suspiciousCount})
          </Button>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-5">
        <h1 className="text-xl font-bold text-foreground mb-1">Audit Logs Dashboard</h1>
        <p className="text-xs text-muted-foreground">Who accessed what, when, and from where.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground p-4">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-xl p-6 text-center text-sm text-muted-foreground">
          No entries.
        </div>
      ) : (
        <div className="glass-panel rounded-xl divide-y divide-border overflow-hidden">
          {filtered.map((l) => (
            <div key={l.id} className={`p-4 ${l.suspicious ? 'bg-destructive/5' : ''}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground capitalize">{l.action.replace(/_/g, ' ')}</span>
                    {l.suspicious && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Suspicious
                      </span>
                    )}
                    {l.resource_type && (
                      <span className="text-xs text-muted-foreground">on {l.resource_type}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{l.actor_email ?? 'Unknown actor'}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(l.created_at).toLocaleString()}</span>
                    {l.ip_address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{l.ip_address}</span>}
                    {l.device_id && <span className="flex items-center gap-1 font-mono"><Smartphone className="w-3 h-3" />{l.device_id.substring(0, 12)}…</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditLogsDashboard;
