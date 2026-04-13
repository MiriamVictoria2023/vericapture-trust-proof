import { Link2, CheckCircle, AlertTriangle } from 'lucide-react';
import { getChain, verifyChain } from '@/utils/blockchain';
import type { BlockchainEntry } from '@/types/evidence';
import { useEffect, useState } from 'react';

/**
 * Digital Notary panel showing the mock blockchain ledger.
 */
const DigitalNotary = () => {
  const [chain, setChain] = useState<BlockchainEntry[]>([]);
  const [valid, setValid] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setChain(getChain());
      setValid(verifyChain());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
            <div key={block.index} className="p-3 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-primary font-medium">Block #{block.index}</span>
                <span className="text-muted-foreground">{new Date(block.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="font-mono text-muted-foreground truncate">Hash: {block.hash.substring(0, 32)}...</p>
              <p className="font-mono text-muted-foreground truncate">Prev: {block.previousHash.substring(0, 32)}...</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DigitalNotary;
