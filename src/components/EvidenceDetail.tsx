import { useEffect, useState } from 'react';
import { ArrowLeft, Hash, MapPin, Clock, Smartphone, Link2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchCustodyLog, insertCustodyEntry } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type EvidenceRow = Database['public']['Tables']['evidence_records']['Row'];
type CustodyRow = Database['public']['Tables']['custody_log']['Row'];

interface EvidenceDetailProps {
  record: EvidenceRow;
  onBack: () => void;
}

const EvidenceDetail = ({ record, onBack }: EvidenceDetailProps) => {
  const { user } = useAuth();
  const [custodyLog, setCustodyLog] = useState<CustodyRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const log = await fetchCustodyLog(record.id);
      setCustodyLog(log);

      // Record a "viewed" entry
      if (user) {
        await insertCustodyEntry({
          user_id: user.id,
          evidence_id: record.id,
          action: 'viewed',
          actor: user.email || 'Unknown',
          ip_address: '192.168.1.x',
          details: `Evidence viewed by ${user.email}`,
        });
        // Refresh log
        const updated = await fetchCustodyLog(record.id);
        setCustodyLog(updated);
      }
    };
    load();
  }, [record.id, user]);

  return (
    <div className="space-y-4 animate-fade-in-up">
      <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      <div className="glass-panel rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">{record.file_name}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow icon={Hash} label="SHA-256 Hash" value={record.sha256_hash.substring(0, 32) + '...'} mono />
          <InfoRow icon={Clock} label="Captured" value={new Date(record.created_at).toLocaleString()} />
          <InfoRow icon={Smartphone} label="Device" value={(record.device_info || '').substring(0, 40) + '...'} />
          {record.geo_lat && record.geo_lng && (
            <InfoRow icon={MapPin} label="Coordinates" value={`${record.geo_lat.toFixed(6)}, ${record.geo_lng.toFixed(6)}`} mono />
          )}
          <InfoRow icon={Link2} label="Notary Block" value={`#${record.block_index} — ${(record.notary_hash || '').substring(0, 16)}...`} mono />
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Chain of Custody Log</h3>
        </div>
        <div className="divide-y divide-border">
          {custodyLog.map(entry => (
            <div key={entry.id} className="p-4 text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-foreground capitalize">{entry.action}</span>
                <span className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">{entry.actor} • IP: {entry.ip_address}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{entry.details}</p>
            </div>
          ))}
          {custodyLog.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No custody entries yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

function InfoRow({ icon: Icon, label, value, mono }: { icon: React.ElementType; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm text-foreground ${mono ? 'font-mono' : ''} break-all`}>{value}</p>
      </div>
    </div>
  );
}

export default EvidenceDetail;
