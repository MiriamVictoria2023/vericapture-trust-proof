import { ArrowLeft, Hash, MapPin, Clock, Smartphone, Link2, Eye } from 'lucide-react';
import type { EvidenceRecord } from '@/types/evidence';
import { Button } from '@/components/ui/button';

interface EvidenceDetailProps {
  record: EvidenceRecord;
  onBack: () => void;
}

/**
 * Detailed view of a single evidence record with chain of custody log.
 */
const EvidenceDetail = ({ record, onBack }: EvidenceDetailProps) => {
  return (
    <div className="space-y-4 animate-fade-in-up">
      <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      {/* Evidence Info */}
      <div className="glass-panel rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">{record.fileName}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow icon={Hash} label="SHA-256 Hash" value={record.sha256Hash.substring(0, 32) + '...'} mono />
          <InfoRow icon={Link2} label="Case ID" value={record.caseId} mono />
          <InfoRow icon={Clock} label="Captured" value={new Date(record.capturedAt).toLocaleString()} />
          <InfoRow icon={Smartphone} label="Device" value={record.deviceInfo.substring(0, 40) + '...'} />
          {record.geoLocation && (
            <InfoRow icon={MapPin} label="Coordinates" value={`${record.geoLocation.lat.toFixed(6)}, ${record.geoLocation.lng.toFixed(6)}`} mono />
          )}
          <InfoRow icon={Link2} label="Notary Block" value={`#${record.blockIndex} — ${record.notaryHash.substring(0, 16)}...`} mono />
        </div>
      </div>

      {/* Chain of Custody Log */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Chain of Custody Log</h3>
        </div>
        <div className="divide-y divide-border">
          {record.custodyLog.map(entry => (
            <div key={entry.id} className="p-4 text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-foreground capitalize">{entry.action}</span>
                <span className="text-xs text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {entry.actor} • IP: {entry.ipAddress}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{entry.details}</p>
            </div>
          ))}
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
