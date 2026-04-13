import { Briefcase, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CaseRecord } from '@/types/evidence';
import { generateCaseId } from '@/utils/crypto';
import { useState } from 'react';

interface CaseManagerProps {
  cases: CaseRecord[];
  activeCaseId: string;
  onSelectCase: (id: string) => void;
  onCreateCase: (c: CaseRecord) => void;
}

const CaseManager = ({ cases, activeCaseId, onSelectCase, onCreateCase }: CaseManagerProps) => {
  const [creating, setCreating] = useState(false);
  const [caseName, setCaseName] = useState('');

  const handleCreate = () => {
    if (!caseName.trim()) return;
    const newCase: CaseRecord = {
      id: generateCaseId(),
      name: caseName.trim(),
      createdAt: new Date().toISOString(),
      status: 'active',
      evidenceCount: 0,
      assignedTo: 'Current User',
      accessExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    onCreateCase(newCase);
    setCaseName('');
    setCreating(false);
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Active Cases</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setCreating(!creating)}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {creating && (
        <div className="p-3 border-b border-border flex gap-2">
          <Input
            placeholder="Case name..."
            value={caseName}
            onChange={e => setCaseName(e.target.value)}
            className="bg-muted/50 text-sm"
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          <Button size="sm" onClick={handleCreate}>Create</Button>
        </div>
      )}

      <div className="divide-y divide-border">
        {cases.map(c => (
          <button
            key={c.id}
            onClick={() => onSelectCase(c.id)}
            className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
              c.id === activeCaseId ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-muted/30'
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{c.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{c.id}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{c.evidenceCount} items</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Clock className="w-3 h-3" />
                <span>{new Date(c.accessExpiry).toLocaleDateString()}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CaseManager;
