import { Shield, Activity, FileText, Briefcase, Lock } from 'lucide-react';

interface StatusBarProps {
  evidenceCount: number;
  caseCount: number;
  deviceScore: number;
}

const StatusBar = ({ evidenceCount, caseCount, deviceScore }: StatusBarProps) => {
  const stats = [
    { icon: FileText, label: 'Evidence', value: evidenceCount.toString() },
    { icon: Briefcase, label: 'Cases', value: caseCount.toString() },
    { icon: Activity, label: 'Device Score', value: `${deviceScore}%`, color: deviceScore >= 80 ? 'text-success' : 'text-warning' },
    { icon: Lock, label: 'Encryption', value: 'AES-256' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map(s => (
        <div key={s.label} className="glass-panel rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <s.icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-lg font-bold ${s.color || 'text-foreground'}`}>{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatusBar;
