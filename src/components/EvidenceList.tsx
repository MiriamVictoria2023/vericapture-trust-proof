import { FileText, CheckCircle, XCircle, AlertTriangle, MapPin, Clock } from 'lucide-react';
import type { EvidenceRecord } from '@/types/evidence';

interface EvidenceListProps {
  records: EvidenceRecord[];
  onSelect: (record: EvidenceRecord) => void;
}

const statusConfig = {
  cleared: { icon: CheckCircle, label: 'Cleared', className: 'text-success' },
  rejected: { icon: XCircle, label: 'Rejected', className: 'text-destructive' },
  quarantined: { icon: AlertTriangle, label: 'Quarantined', className: 'text-warning' },
  scanning: { icon: Clock, label: 'Scanning', className: 'text-primary' },
};

/**
 * Displays a list of captured evidence with status indicators.
 */
const EvidenceList = ({ records, onSelect }: EvidenceListProps) => {
  if (records.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-6 text-center">
        <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No evidence captured yet</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Recent Captures</h2>
        <p className="text-xs text-muted-foreground">{records.length} record(s)</p>
      </div>
      <div className="divide-y divide-border">
        {records.map((record) => {
          const status = statusConfig[record.status];
          const StatusIcon = status.icon;
          return (
            <button
              key={record.id}
              onClick={() => onSelect(record)}
              className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{record.fileName}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-muted-foreground font-mono">{record.caseId}</span>
                  {record.geoLocation && (
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {record.geoLocation.lat.toFixed(2)}, {record.geoLocation.lng.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <StatusIcon className={`w-4 h-4 ${status.className}`} />
                <span className={`text-xs font-medium ${status.className}`}>{status.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EvidenceList;
