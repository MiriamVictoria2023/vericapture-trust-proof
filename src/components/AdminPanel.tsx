import { useEffect, useState } from 'react';
import { ArrowLeft, UserCog, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAllRoles, assignRole, removeRole, type AppRole } from '@/services/roles';
import { logAudit } from '@/services/audit';
import { useToast } from '@/hooks/use-toast';

interface AdminPanelProps { onBack: () => void; }

const ROLES: AppRole[] = ['investigator', 'supervisor', 'admin'];

const AdminPanel = ({ onBack }: AdminPanelProps) => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<{ id: string; user_id: string; role: string; created_at: string }[]>([]);
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('supervisor');

  const load = async () => {
    try { setRows(await fetchAllRoles()); } catch (e) { console.error(e); }
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen p-6 max-w-3xl mx-auto">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
        <div className="glass-panel rounded-xl p-6 mt-4 text-center">
          <ShieldAlert className="w-10 h-10 text-destructive mx-auto mb-2" />
          <p className="text-foreground font-medium">Admin only</p>
          <p className="text-sm text-muted-foreground">Role management is restricted to administrators.</p>
        </div>
      </div>
    );
  }

  const handleAssign = async () => {
    if (!user || !newUserId) return;
    try {
      await assignRole(newUserId, newRole, user.id);
      await logAudit({
        user_id: user.id,
        actor_email: user.email ?? 'admin',
        action: 'role_assigned',
        resource_type: 'user',
        resource_id: newUserId,
        details: { role: newRole },
      });
      toast({ title: 'Role assigned', description: `${newRole} → ${newUserId.substring(0, 8)}…` });
      setNewUserId('');
      load();
    } catch (e) {
      toast({ title: 'Failed', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const handleRemove = async (uid: string, role: AppRole) => {
    if (!user) return;
    try {
      await removeRole(uid, role);
      await logAudit({
        user_id: user.id,
        actor_email: user.email ?? 'admin',
        action: 'role_removed',
        resource_type: 'user',
        resource_id: uid,
        details: { role },
      });
      load();
    } catch (e) {
      toast({ title: 'Failed', description: (e as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>

      <div className="glass-panel rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <UserCog className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Role Management</h1>
        </div>
        <p className="text-xs text-muted-foreground">Assign Investigator, Supervisor, or Admin permissions.</p>
      </div>

      <div className="glass-panel rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Assign new role</h3>
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="User UUID (from auth.users)"
            value={newUserId}
            onChange={(e) => setNewUserId(e.target.value)}
            className="flex-1 min-w-[200px] font-mono text-xs"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as AppRole)}
            className="px-3 rounded-md border border-input bg-background text-sm"
          >
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <Button onClick={handleAssign} disabled={!newUserId}>
            <Plus className="w-4 h-4 mr-1" /> Assign
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Tip: every new signup automatically gets the <span className="font-medium">investigator</span> role.
        </p>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Current Assignments ({rows.length})</h3>
        </div>
        <div className="divide-y divide-border">
          {rows.map((r) => (
            <div key={r.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs font-mono text-foreground break-all">{r.user_id}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize font-medium">{r.role}</span>
                  <span className="ml-2">{new Date(r.created_at).toLocaleString()}</span>
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleRemove(r.user_id, r.role as AppRole)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
          {rows.length === 0 && <p className="p-4 text-sm text-muted-foreground">No role assignments yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
