import { useState, useEffect, useCallback } from 'react';
import { Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthGate from '@/components/AuthGate';
import CaptureInterface from '@/components/CaptureInterface';
import EvidenceList from '@/components/EvidenceList';
import EvidenceDetail from '@/components/EvidenceDetail';
import DeviceAttestation from '@/components/DeviceAttestation';
import DigitalNotary from '@/components/DigitalNotary';
import CaseManager from '@/components/CaseManager';
import StatusBar from '@/components/StatusBar';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCases, createCase, fetchEvidence } from '@/services/database';
import type { Database } from '@/integrations/supabase/types';

type CaseRow = Database['public']['Tables']['cases']['Row'];
type EvidenceRow = Database['public']['Tables']['evidence_records']['Row'];

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceRow | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) return;
    const c = await fetchCases(user.id);
    setCases(c);
    if (c.length > 0 && !activeCaseId) setActiveCaseId(c[0].id);
  }, [user, activeCaseId]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!user || !activeCaseId) return;
    fetchEvidence(user.id, activeCaseId).then(setEvidence);
  }, [user, activeCaseId, refreshKey]);

  const handleCreateCase = async (name: string) => {
    if (!user) return;
    const c = await createCase(user.id, name);
    setCases(prev => [c, ...prev]);
    setActiveCaseId(c.id);
  };

  const handleCaptured = () => {
    setRefreshKey(k => k + 1);
    refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Shield className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  if (!user) return <AuthGate />;

  if (selectedEvidence) {
    return (
      <div className="min-h-screen p-4 md:p-6 max-w-5xl mx-auto">
        <EvidenceDetail record={selectedEvidence} onBack={() => setSelectedEvidence(null)} />
      </div>
    );
  }

  const activeCase = cases.find(c => c.id === activeCaseId);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border glass-panel sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-bold text-foreground text-lg">VeriCapture</span>
            <span className="text-xs text-muted-foreground hidden sm:inline ml-2">Zero-Trust Evidence System</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <StatusBar evidenceCount={evidence.length} caseCount={cases.length} deviceScore={83} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {activeCase ? (
              <CaptureInterface
                activeCaseId={activeCase.id}
                activeCaseCode={activeCase.case_code}
                currentEvidenceCount={activeCase.evidence_count}
                onCaptured={handleCaptured}
              />
            ) : (
              <div className="glass-panel rounded-xl p-6 text-center text-muted-foreground text-sm">
                Create a case to start capturing evidence.
              </div>
            )}
            <EvidenceList records={evidence} onSelect={setSelectedEvidence} />
          </div>

          <div className="space-y-6">
            <CaseManager
              cases={cases}
              activeCaseId={activeCaseId || ''}
              onSelectCase={setActiveCaseId}
              onCreateCase={handleCreateCase}
            />
            <DeviceAttestation />
            <DigitalNotary refreshKey={refreshKey} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
