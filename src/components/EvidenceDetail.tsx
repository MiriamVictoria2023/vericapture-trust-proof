import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Hash, MapPin, Clock, Smartphone, Link2, Eye, Download, ShieldCheck, ShieldX, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchCustodyLog, insertCustodyEntry, updateEvidenceTamperStatus } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { generateCustodyPDF } from '@/utils/pdfExport';
import { computeSHA256 } from '@/utils/crypto';
import { downloadEncryptedFile } from '@/services/storage';
import { decryptFile } from '@/utils/encryption';
import { logAudit } from '@/services/audit';
import { useToast } from '@/hooks/use-toast';
import CustodyTimeline from './CustodyTimeline';
import type { Database } from '@/integrations/supabase/types';

type EvidenceRow = Database['public']['Tables']['evidence_records']['Row'];
type CustodyRow = Database['public']['Tables']['custody_log']['Row'];

interface EvidenceDetailProps {
  record: EvidenceRow;
  caseCode: string;
  onBack: () => void;
}

const EvidenceDetail = ({ record, caseCode, onBack }: EvidenceDetailProps) => {
  const { user, sessionPassword } = useAuth();
  const { toast } = useToast();
  const [custodyLog, setCustodyLog] = useState<CustodyRow[]>([]);
  const [verifying, setVerifying] = useState(false);
  const verifyInputRef = useRef<HTMLInputElement>(null);

  const reload = async () => {
    const log = await fetchCustodyLog(record.id);
    setCustodyLog(log);
  };

  useEffect(() => {
    const init = async () => {
      await reload();
      if (user) {
        await insertCustodyEntry({
          user_id: user.id, evidence_id: record.id, action: 'viewed',
          actor: user.email || 'Unknown', ip_address: '0.0.0.0',
          details: `Evidence opened by ${user.email}`,
        });
        await logAudit({
          user_id: user.id, actor_email: user.email ?? 'unknown',
          action: 'evidence_viewed', resource_type: 'evidence', resource_id: record.id,
        });
        await reload();
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record.id, user]);

  const handleExportPDF = () => {
    generateCustodyPDF(record, custodyLog, caseCode);
  };

  const handleVerifyClick = () => verifyInputRef.current?.click();

  const handleVerifyFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    setVerifying(true);
    try {
      const hash = await computeSHA256(file);
      const intact = hash === record.sha256_hash;
      await insertCustodyEntry({
        user_id: user.id, evidence_id: record.id,
        action: intact ? 'verified_intact' : 'verified_tampered',
        actor: user.email || 'Unknown', ip_address: '0.0.0.0',
        details: intact
          ? `Re-hash matches stored SHA-256 (${hash.substring(0, 16)}…)`
          : `❌ Hash mismatch — expected ${record.sha256_hash.substring(0, 12)}…, got ${hash.substring(0, 12)}…`,
      });
      await updateEvidenceTamperStatus(record.id, intact ? 'intact' : 'tampered');
      await logAudit({
        user_id: user.id, actor_email: user.email ?? 'unknown',
        action: intact ? 'tamper_check_passed' : 'tamper_check_failed',
        resource_type: 'evidence', resource_id: record.id,
        details: { expected: record.sha256_hash, actual: hash, file_name: file.name },
        suspicious: !intact,
      });
      toast({
        title: intact ? '✅ Evidence intact' : '❌ Tampering detected',
        description: intact ? 'Hash matches the original.' : 'The file has been modified since capture.',
        variant: intact ? 'default' : 'destructive',
      });
      await reload();
    } catch (err) {
      toast({ title: 'Verification failed', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setVerifying(false);
    }
  };

  const handleDecryptDownload = async () => {
    if (!user || !record.encrypted_path || !record.encryption_salt) {
      toast({ title: 'No encrypted file', description: 'This record has no encrypted blob stored.', variant: 'destructive' });
      return;
    }
    if (!sessionPassword) {
      toast({ title: 'Re-login required', description: 'Encryption key requires your password.', variant: 'destructive' });
      return;
    }
    try {
      const blob = await downloadEncryptedFile(record.encrypted_path);
      const plain = await decryptFile(blob, sessionPassword, record.encryption_salt, record.file_type);
      const url = URL.createObjectURL(plain);
      const a = document.createElement('a');
      a.href = url; a.download = record.file_name; a.click();
      URL.revokeObjectURL(url);
      await insertCustodyEntry({
        user_id: user.id, evidence_id: record.id, action: 'decrypted',
        actor: user.email || 'Unknown', ip_address: '0.0.0.0',
        details: `Decrypted & downloaded by ${user.email}`,
      });
      await logAudit({
        user_id: user.id, actor_email: user.email ?? 'unknown',
        action: 'evidence_decrypted', resource_type: 'evidence', resource_id: record.id,
      });
      await reload();
    } catch (err) {
      toast({
        title: 'Decryption failed',
        description: 'Wrong password or corrupted blob. Audit logged.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="flex gap-2 flex-wrap">
          <input ref={verifyInputRef} type="file" onChange={handleVerifyFile} className="hidden" />
          <Button onClick={handleVerifyClick} variant="outline" size="sm" disabled={verifying}>
            <ShieldCheck className="w-4 h-4 mr-1.5" /> {verifying ? 'Verifying…' : 'Verify Tamper'}
          </Button>
          {record.encrypted_path && (
            <Button onClick={handleDecryptDownload} variant="outline" size="sm">
              <Unlock className="w-4 h-4 mr-1.5" /> Decrypt & Download
            </Button>
          )}
          <Button onClick={handleExportPDF} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1.5" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-lg font-semibold text-foreground">{record.file_name}</h2>
          {record.tamper_status && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${
              record.tamper_status === 'intact'
                ? 'bg-success/15 text-success'
                : 'bg-destructive/15 text-destructive'
            }`}>
              {record.tamper_status === 'intact' ? <ShieldCheck className="w-3 h-3" /> : <ShieldX className="w-3 h-3" />}
              {record.tamper_status === 'intact' ? 'Verified Intact' : 'Tampered'}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow icon={Hash} label="SHA-256 Hash" value={record.sha256_hash.substring(0, 32) + '...'} mono />
          <InfoRow icon={Clock} label="Captured" value={new Date(record.created_at).toLocaleString()} />
          <InfoRow icon={Smartphone} label="Device" value={(record.device_info || '').substring(0, 40) + '...'} />
          {record.geo_lat && record.geo_lng && (
            <InfoRow icon={MapPin} label="Coordinates" value={`${record.geo_lat.toFixed(6)}, ${record.geo_lng.toFixed(6)}`} mono />
          )}
          <InfoRow icon={Link2} label="Notary Block" value={`#${record.block_index} — ${(record.notary_hash || '').substring(0, 16)}...`} mono />
          {record.encryption_algo && (
            <InfoRow icon={Lock} label="Encryption" value={`${record.encryption_algo} · IV ${(record.encryption_iv ?? '').substring(0, 12)}…`} mono />
          )}
          {record.device_id && (
            <InfoRow icon={Smartphone} label="Device Fingerprint" value={record.device_id.substring(0, 24) + '…'} mono />
          )}
        </div>
      </div>

      <div className="glass-panel rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Chain-of-Custody Timeline</h3>
        </div>
        <CustodyTimeline evidenceCode={record.id.substring(0, 8).toUpperCase()} log={custodyLog} />
      </div>
    </div>
  );
};

function InfoRow({ icon: Icon, label, value, mono }: { icon: React.ElementType; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm text-foreground ${mono ? 'font-mono' : ''} break-all`}>{value}</p>
      </div>
    </div>
  );
}

export default EvidenceDetail;
