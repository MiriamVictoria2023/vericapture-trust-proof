import { useState, useRef } from 'react';
import { Camera, Upload, Shield, CheckCircle, XCircle, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { computeSHA256 } from '@/utils/crypto';
import { scanFile } from '@/utils/scanner';
import { captureGeoLocation, getDeviceInfo } from '@/utils/geolocation';
import {
  insertEvidence,
  insertCustodyEntry,
  addBlockToLedger,
  incrementEvidenceCount,
  findEvidenceByName,
} from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { encryptFile } from '@/utils/encryption';
import { uploadEncryptedFile } from '@/services/storage';
import { logAudit } from '@/services/audit';
import { getDeviceFingerprint } from '@/utils/fingerprint';
import { useToast } from '@/hooks/use-toast';

interface CaptureInterfaceProps {
  activeCaseId: string;
  activeCaseCode: string;
  currentEvidenceCount: number;
  onCaptured: () => void;
}

const CaptureInterface = ({ activeCaseId, activeCaseCode, currentEvidenceCount, onCaptured }: CaptureInterfaceProps) => {
  const { user, sessionPassword, isInvestigator, isAdmin } = useAuth();
  const { toast } = useToast();
  const canUpload = isInvestigator || isAdmin;
  const [scanState, setScanState] = useState<'idle' | 'hashing' | 'scanning' | 'complete'>('idle');
  const [scanResult, setScanResult] = useState<'cleared' | 'rejected' | 'quarantined' | 'tampered' | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentCheck, setCurrentCheck] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!user) return;
    if (!sessionPassword) {
      toast({
        title: 'Re-login required',
        description: 'Encryption key derives from your password. Please log out and log back in.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setScanState('hashing');
      setProgress(5);
      setCurrentCheck('Computing SHA-256 integrity hash...');
      const hash = await computeSHA256(file);
      setProgress(20);

      // Tamper check: same filename in case but different hash → reject
      setCurrentCheck('Checking for prior captures (tamper detection)...');
      const existing = await findEvidenceByName(user.id, activeCaseId, file.name);
      if (existing && existing.sha256_hash !== hash) {
        await logAudit({
          user_id: user.id,
          actor_email: user.email ?? 'unknown',
          action: 'tamper_blocked_upload',
          resource_type: 'evidence',
          resource_id: existing.id,
          details: { original_hash: existing.sha256_hash, new_hash: hash, file_name: file.name },
          suspicious: true,
        });
        setScanState('complete');
        setScanResult('tampered');
        toast({
          title: '❌ Tampered file rejected',
          description: 'A file with the same name exists but the hash differs.',
          variant: 'destructive',
        });
        setTimeout(() => { setScanState('idle'); setScanResult(null); setProgress(0); }, 2500);
        return;
      }
      setProgress(30);

      setCurrentCheck('Capturing GPS coordinates...');
      const geo = await captureGeoLocation();
      setProgress(40);

      setCurrentCheck('Fingerprinting device...');
      const fp = await getDeviceFingerprint();
      setProgress(45);

      setScanState('scanning');
      setCurrentCheck('Running malware sandbox analysis...');
      const result = await scanFile(file);
      setProgress(60);

      setCurrentCheck('Encrypting with AES-256-GCM...');
      const encrypted = await encryptFile(file, sessionPassword);
      setProgress(75);

      setCurrentCheck('Uploading encrypted blob to secure storage...');
      const path = await uploadEncryptedFile(user.id, file.name, encrypted.blob);
      setProgress(85);

      setCurrentCheck('Registering on digital notary ledger...');
      const block = await addBlockToLedger(user.id, hash);
      setProgress(95);

      const evidence = await insertEvidence({
        user_id: user.id,
        case_id: activeCaseId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type || 'unknown',
        sha256_hash: hash,
        geo_lat: geo?.lat ?? null,
        geo_lng: geo?.lng ?? null,
        device_info: getDeviceInfo(),
        status: result.status,
        notary_hash: block.block_hash,
        block_index: block.block_index,
        encrypted_path: path,
        encryption_iv: encrypted.ivB64,
        encryption_salt: encrypted.saltB64,
        encryption_algo: encrypted.algorithm,
        device_id: fp.deviceId,
      });

      // Custody timeline events
      await insertCustodyEntry({
        user_id: user.id, evidence_id: evidence.id, action: 'hashed', actor: user.email || 'Unknown',
        ip_address: '0.0.0.0', details: `SHA-256: ${hash.substring(0, 32)}…`,
      });
      await insertCustodyEntry({
        user_id: user.id, evidence_id: evidence.id, action: 'encrypted', actor: user.email || 'Unknown',
        ip_address: '0.0.0.0', details: `AES-256-GCM · IV ${encrypted.ivB64.substring(0, 12)}…`,
      });
      await insertCustodyEntry({
        user_id: user.id, evidence_id: evidence.id, action: 'uploaded', actor: user.email || 'Unknown',
        ip_address: '0.0.0.0', details: `Encrypted blob stored · status: ${result.status}`,
      });

      await logAudit({
        user_id: user.id,
        actor_email: user.email ?? 'unknown',
        action: 'evidence_uploaded',
        resource_type: 'evidence',
        resource_id: evidence.id,
        details: { case_id: activeCaseId, file_name: file.name, status: result.status },
      });

      await incrementEvidenceCount(activeCaseId, currentEvidenceCount);

      setProgress(100);
      setScanState('complete');
      setScanResult(result.status);

      setTimeout(() => {
        onCaptured();
        setScanState('idle');
        setScanResult(null);
        setProgress(0);
      }, 1800);
    } catch (e) {
      console.error(e);
      toast({ title: 'Capture failed', description: (e as Error).message, variant: 'destructive' });
      setScanState('idle'); setProgress(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  if (!canUpload) {
    return (
      <div className="glass-panel rounded-xl p-6 text-center">
        <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-foreground font-medium">Read-only access</p>
        <p className="text-xs text-muted-foreground mt-1">
          Your role does not permit uploading evidence. Contact an administrator to request the Investigator role.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Camera className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Evidence Capture</h2>
        <span className="ml-auto flex items-center gap-1 text-xs text-success">
          <Lock className="w-3 h-3" /> AES-256-GCM
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-1">
        Active Case: <span className="font-mono text-primary">{activeCaseCode}</span>
      </p>

      {scanState === 'idle' ? (
        <div className="mt-4 space-y-3">
          <Input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept="image/*,video/*,application/pdf,.doc,.docx" />
          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-foreground font-medium">Drop evidence file or click to upload</p>
            <p className="text-xs text-muted-foreground mt-1">Encrypted client-side · Images, video, PDF, docs</p>
          </div>
          <Button onClick={() => fileInputRef.current?.click()} className="w-full glow-blue">
            <Camera className="w-4 h-4 mr-2" /> Capture Evidence
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="relative bg-muted/30 rounded-lg p-6 overflow-hidden">
            {scanState !== 'complete' && <div className="absolute inset-0 scan-line h-1 animate-scan" />}
            <div className="relative z-10 text-center">
              {scanState === 'complete' ? (
                scanResult === 'cleared'
                  ? <CheckCircle className="w-12 h-12 text-success mx-auto mb-2" />
                  : <XCircle className="w-12 h-12 text-destructive mx-auto mb-2" />
              ) : (
                <Loader2 className="w-12 h-12 text-primary mx-auto mb-2 animate-spin" />
              )}
              <p className="text-sm font-medium text-foreground">
                {scanState === 'complete'
                  ? (scanResult === 'cleared' ? 'Evidence Cleared, Encrypted & Registered'
                    : scanResult === 'tampered' ? '❌ Tampered file rejected'
                    : 'Threat Detected')
                  : currentCheck}
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground"><span>Security Pipeline</span><span>{progress}%</span></div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" /><span>Zero-trust pipeline · Hash → Encrypt → Notarize</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptureInterface;
