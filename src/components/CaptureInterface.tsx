import { useState, useRef } from 'react';
import { Camera, Upload, Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { computeSHA256 } from '@/utils/crypto';
import { scanFile } from '@/utils/scanner';
import { captureGeoLocation, getDeviceInfo } from '@/utils/geolocation';
import { addBlock } from '@/utils/blockchain';
import type { EvidenceRecord, CustodyEntry } from '@/types/evidence';

interface CaptureInterfaceProps {
  activeCaseId: string;
  onCapture: (evidence: EvidenceRecord) => void;
}

/**
 * Evidence capture interface with security scanning animation.
 * Handles file upload, SHA-256 hashing, geo-tagging, and malware scanning.
 */
const CaptureInterface = ({ activeCaseId, onCapture }: CaptureInterfaceProps) => {
  const [scanState, setScanState] = useState<'idle' | 'hashing' | 'scanning' | 'complete'>('idle');
  const [scanResult, setScanResult] = useState<'cleared' | 'rejected' | 'quarantined' | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentCheck, setCurrentCheck] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setScanState('hashing');
    setProgress(10);
    setCurrentCheck('Computing SHA-256 integrity hash...');

    const hash = await computeSHA256(file);
    setProgress(30);

    setCurrentCheck('Capturing GPS coordinates...');
    const geo = await captureGeoLocation();
    setProgress(40);

    setScanState('scanning');
    setCurrentCheck('Running malware sandbox analysis...');
    setProgress(50);

    const result = await scanFile(file);
    setProgress(90);

    setCurrentCheck('Registering on digital notary ledger...');
    const block = await addBlock(hash);
    setProgress(100);

    const evidence: EvidenceRecord = {
      id: crypto.randomUUID(),
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'unknown',
      sha256Hash: hash,
      caseId: activeCaseId,
      capturedAt: new Date().toISOString(),
      geoLocation: geo,
      deviceInfo: getDeviceInfo(),
      status: result.status,
      notaryHash: block.hash,
      blockIndex: block.index,
      custodyLog: [
        {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          action: 'uploaded',
          actor: 'Current User',
          ipAddress: '192.168.1.x',
          details: `File uploaded and ${result.status}. SHA-256: ${hash.substring(0, 16)}...`,
        } as CustodyEntry,
      ],
    };

    setScanState('complete');
    setScanResult(result.status);

    setTimeout(() => {
      onCapture(evidence);
      setScanState('idle');
      setScanResult(null);
      setProgress(0);
    }, 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="glass-panel rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Camera className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Evidence Capture</h2>
      </div>

      <p className="text-xs text-muted-foreground mb-1">Active Case: <span className="font-mono text-primary">{activeCaseId}</span></p>

      {scanState === 'idle' ? (
        <div className="mt-4 space-y-3">
          <Input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept="image/*,video/*,application/pdf,.doc,.docx" />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-foreground font-medium">Drop evidence file or click to upload</p>
            <p className="text-xs text-muted-foreground mt-1">Images, video, PDF, documents • Max 100MB</p>
          </div>
          <Button onClick={() => fileInputRef.current?.click()} className="w-full glow-blue">
            <Camera className="w-4 h-4 mr-2" /> Capture Evidence
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {/* Scanning animation */}
          <div className="relative bg-muted/30 rounded-lg p-6 overflow-hidden">
            {scanState !== 'complete' && (
              <div className="absolute inset-0 scan-line h-1 animate-scan" />
            )}
            <div className="relative z-10 text-center">
              {scanState === 'complete' ? (
                scanResult === 'cleared' ? (
                  <CheckCircle className="w-12 h-12 text-success mx-auto mb-2" />
                ) : (
                  <XCircle className="w-12 h-12 text-destructive mx-auto mb-2" />
                )
              ) : (
                <Loader2 className="w-12 h-12 text-primary mx-auto mb-2 animate-spin" />
              )}
              <p className="text-sm font-medium text-foreground">
                {scanState === 'complete'
                  ? scanResult === 'cleared'
                    ? 'Evidence Cleared & Registered'
                    : 'Threat Detected'
                  : currentCheck}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Security Pipeline</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>Zero-trust pipeline active • All checks mandatory</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptureInterface;
