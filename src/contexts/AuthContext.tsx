import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { fetchUserRoles, type AppRole } from '@/services/roles';
import { upsertDeviceFingerprint } from '@/services/audit';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  /** In-memory only, used to derive AES keys for encryption. Cleared on logout. */
  sessionPassword: string | null;
  isInvestigator: boolean;
  isSupervisor: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithEmailOtp: (email: string) => Promise<{ error: Error | null }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [sessionPassword, setSessionPassword] = useState<string | null>(null);

  const loadRoles = useCallback(async (uid: string | undefined) => {
    if (!uid) { setRoles([]); return; }
    try {
      const r = await fetchUserRoles(uid);
      setRoles(r);
    } catch (e) {
      console.error('Failed to load roles', e);
      setRoles([]);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        // defer non-critical work
        setTimeout(() => {
          loadRoles(session.user.id);
          upsertDeviceFingerprint(session.user.id);
        }, 0);
      } else {
        setRoles([]);
        setSessionPassword(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        loadRoles(session.user.id);
        upsertDeviceFingerprint(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadRoles]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (!error) setSessionPassword(password);
    return { error: error ? new Error(error.message) : null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) setSessionPassword(password);
    return { error: error ? new Error(error.message) : null };
  };

  const signInWithPhone = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    return { error: error ? new Error(error.message) : null };
  };

  const verifyPhoneOtp = async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    setSessionPassword(null);
    setRoles([]);
    await supabase.auth.signOut();
  };

  const refreshRoles = useCallback(async () => {
    if (user) await loadRoles(user.id);
  }, [user, loadRoles]);

  return (
    <AuthContext.Provider value={{
      user, session, loading, roles, sessionPassword,
      isInvestigator: roles.includes('investigator'),
      isSupervisor: roles.includes('supervisor'),
      isAdmin: roles.includes('admin'),
      signUp, signIn, signInWithPhone, verifyPhoneOtp, signOut, refreshRoles,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
