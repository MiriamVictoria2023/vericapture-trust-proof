import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'investigator' | 'supervisor' | 'admin';

export async function fetchUserRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.role as AppRole);
}

export async function fetchAllRoles() {
  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function assignRole(userId: string, role: AppRole, assignedBy: string) {
  const { error } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role, assigned_by: assignedBy });
  if (error) throw error;
}

export async function removeRole(userId: string, role: AppRole) {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', role);
  if (error) throw error;
}

export function hasAny(roles: AppRole[], ...check: AppRole[]) {
  return roles.some((r) => check.includes(r));
}
