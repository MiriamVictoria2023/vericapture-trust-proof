import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCases, fetchEvidence, fetchBlockchain } from '@/services/database';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ArrowLeft, Shield, FileText, Briefcase, Activity, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Database } from '@/integrations/supabase/types';

type CaseRow = Database['public']['Tables']['cases']['Row'];
type EvidenceRow = Database['public']['Tables']['evidence_records']['Row'];
type BlockRow = Database['public']['Tables']['blockchain_ledger']['Row'];

interface AnalyticsDashboardProps {
  onBack: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  cleared: 'hsl(142, 76%, 36%)',
  rejected: 'hsl(0, 72%, 51%)',
  quarantined: 'hsl(38, 92%, 50%)',
  scanning: 'hsl(210, 100%, 52%)',
};

const CASE_STATUS_COLORS: Record<string, string> = {
  active: 'hsl(210, 100%, 52%)',
  closed: 'hsl(215, 20%, 55%)',
  archived: 'hsl(215, 25%, 30%)',
};

const AnalyticsDashboard = ({ onBack }: AnalyticsDashboardProps) => {
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [allEvidence, setAllEvidence] = useState<EvidenceRow[]>([]);
  const [chain, setChain] = useState<BlockRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [c, e, b] = await Promise.all([
        fetchCases(user.id),
        fetchEvidence(user.id),
        fetchBlockchain(user.id),
      ]);
      setCases(c);
      setAllEvidence(e);
      setChain(b);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Shield className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  // Compute analytics data
  const statusCounts = allEvidence.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1;
    return acc;
  }, {});

  const statusPieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const caseStatusCounts = cases.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const caseStatusData = Object.entries(caseStatusCounts).map(([name, value]) => ({ name, value }));

  // Evidence per case bar chart
  const evidencePerCase = cases.map(c => ({
    name: c.case_code,
    evidence: c.evidence_count,
  })).slice(0, 10);

  // Timeline - evidence over time (last 7 days)
  const now = Date.now();
  const timelineData = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now - (6 - i) * 86400000);
    const dayStr = day.toLocaleDateString('en-US', { weekday: 'short' });
    const count = allEvidence.filter(e => {
      const d = new Date(e.created_at);
      return d.toDateString() === day.toDateString();
    }).length;
    return { day: dayStr, count };
  });

  const stats = [
    { icon: FileText, label: 'Total Evidence', value: allEvidence.length },
    { icon: Briefcase, label: 'Total Cases', value: cases.length },
    { icon: Activity, label: 'Cleared Rate', value: allEvidence.length ? `${Math.round((statusCounts['cleared'] || 0) / allEvidence.length * 100)}%` : '0%' },
    { icon: Link2, label: 'Blockchain Blocks', value: chain.length },
  ];

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <h1 className="text-xl font-bold text-foreground">Analytics Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="glass-panel rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evidence Timeline */}
        <div className="glass-panel rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Evidence Captures (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 25%, 18%)" />
              <XAxis dataKey="day" stroke="hsl(215, 20%, 55%)" fontSize={11} />
              <YAxis stroke="hsl(215, 20%, 55%)" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'hsl(222, 44%, 9%)', border: '1px solid hsl(215, 25%, 18%)', borderRadius: '8px', color: 'hsl(210, 40%, 93%)' }} />
              <Line type="monotone" dataKey="count" stroke="hsl(210, 100%, 52%)" strokeWidth={2} dot={{ r: 4, fill: 'hsl(210, 100%, 52%)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Scan Results Pie */}
        <div className="glass-panel rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Scan Results Distribution</h3>
          {statusPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {statusPieData.map(entry => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#888'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(222, 44%, 9%)', border: '1px solid hsl(215, 25%, 18%)', borderRadius: '8px', color: 'hsl(210, 40%, 93%)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">No evidence data yet</p>
          )}
        </div>

        {/* Evidence per Case */}
        <div className="glass-panel rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Evidence by Case</h3>
          {evidencePerCase.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={evidencePerCase}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 25%, 18%)" />
                <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={10} />
                <YAxis stroke="hsl(215, 20%, 55%)" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(222, 44%, 9%)', border: '1px solid hsl(215, 25%, 18%)', borderRadius: '8px', color: 'hsl(210, 40%, 93%)' }} />
                <Bar dataKey="evidence" fill="hsl(210, 100%, 52%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">No case data yet</p>
          )}
        </div>

        {/* Case Status */}
        <div className="glass-panel rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Case Status Overview</h3>
          {caseStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={caseStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {caseStatusData.map(entry => (
                    <Cell key={entry.name} fill={CASE_STATUS_COLORS[entry.name] || '#888'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(222, 44%, 9%)', border: '1px solid hsl(215, 25%, 18%)', borderRadius: '8px', color: 'hsl(210, 40%, 93%)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">No case data yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
