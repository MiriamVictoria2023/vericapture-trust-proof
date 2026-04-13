import { useState } from 'react';
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
import type { EvidenceRecord, CaseRecord } from '@/types/evidence';
import { generateCaseId } from '@/utils/crypto';

const defaultCase: CaseRecord = {
  id: generateCaseId(),
  name: 'Initial Investigation',
  createdAt: new Date().toISOString(),
  status: 'active',
  evidenceCount: 0,
  assignedTo: 'Current User',
  accessExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
};

const Index = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [cases, setCases] = useState<CaseRecord[]>([defaultCase]);
  const [activeCaseId, setActiveCaseId] = useState(defaultCase.id);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceRecord | null>(null);

  const handleCapture = (record: EvidenceRecord) => {
    setEvidence(prev => [record, ...prev]);
    setCases(prev =>
      prev.map(c => c.id === activeCaseId ? { ...c, evidenceCount: c.evidenceCount + 1 } : c)
    );
  };

  const handleCreateCase = (c: CaseRecord) => {
    setCases(prev => [c, ...prev]);
    setActiveCaseId(c.id);
  };

  if (!authenticated) {
    return <AuthGate onAuthenticated={() => setAuthenticated(true)} />;
  }

  if (selectedEvidence) {
    return (
      <div className="min-h-screen p-4 md:p-6 max-w-5xl mx-auto">
        <EvidenceDetail record={selectedEvidence} onBack={() => setSelectedEvidence(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border glass-panel sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-bold text-foreground text-lg">VeriCapture</span>
            <span className="text-xs text-muted-foreground hidden sm:inline ml-2">Zero-Trust Evidence System</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setAuthenticated(false)}>
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Status Overview */}
        <StatusBar
          evidenceCount={evidence.length}
          caseCount={cases.length}
          deviceScore={83}
        />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Capture + Evidence List */}
          <div className="lg:col-span-2 space-y-6">
            <CaptureInterface activeCaseId={activeCaseId} onCapture={handleCapture} />
            <EvidenceList
              records={evidence.filter(e => e.caseId === activeCaseId)}
              onSelect={setSelectedEvidence}
            />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <CaseManager
              cases={cases}
              activeCaseId={activeCaseId}
              onSelectCase={setActiveCaseId}
              onCreateCase={handleCreateCase}
            />
            <DeviceAttestation />
            <DigitalNotary />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
