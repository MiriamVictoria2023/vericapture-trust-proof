import { Link2, CheckCircle, AlertTriangle } from 'lucide-react';
import { fetchBlockchain } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';
import { useEffect, useState } from 'react';

type BlockRow = Database['public']['Tables']['blockchain_ledger']['Row'];

interface DigitalNotaryProps {
  refreshKey?: number;
}

const DigitalNotary = ({ refreshKey }: DigitalNotaryProps) => {
  const { user } = useAuth();
  const [chain, setChain] = useState<BlockRow[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchBlockchain(user.id).then(setChain);
  }, [user, refreshKey]);

  const valid = chain.length <= 1 || chain.every((block, i) => {
    if (i === 0) return true;
    return block.previous_hash === chain[i - 1].block_hash;
  });

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Digital Notary Ledger</h2>
        </div>
        <div className="flex items-center gap-1.5">
          {valid ? (
            <>
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-xs text-success font-medium">Chain Valid</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-xs text-destructive font-medium">Chain Broken!</span>
            </>
          )}
        </div>
      </div>

      {chain.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground">
          No blocks registered yet. Capture evidence to create entries.
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto divide-y divide-border">
          {chain.map(block => (
            <div key={block.id} className="p-3 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-primary font-medium">Block #{block.block_index}</span>
                <span className="text-muted-foreground">{new Date(block.created_at).toLocaleTimeString()}</span>
              </div>
              <p className="font-mono text-muted-foreground truncate">Hash: {block.block_hash.substring(0, 32)}...</p>
              <p className="font-mono text-muted-foreground truncate">Prev: {block.previous_hash.substring(0, 32)}...</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DigitalNotary;
