import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
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
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
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

  /**
   * Step 1: validate the password by signing in, then immediately sign out
   * and request an email OTP. The OTP step finalizes the session.
   * The password is cached in memory so the AES encryption key derivation
   * still works once 2FA completes.
   */
  const signInStep1 = async (email: string, password: string) => {
    const { error: pwError } = await supabase.auth.signInWithPassword({ email, password });
    if (pwError) return { error: new Error(pwError.message) };

    // Cache password in memory for AES key derivation after OTP completes
    setSessionPassword(password);

    // Tear down session so OTP becomes the actual session-establishing event
    await supabase.auth.signOut();

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (otpError) {
      setSessionPassword(null);
      return { error: new Error(otpError.message) };
    }
    return { error: null };
  };

  const verifyLoginOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    return { error: error ? new Error(error.message) : null };
  };

  const signInWithGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result.error) return { error: result.error instanceof Error ? result.error : new Error(String(result.error)) };
    return { error: null };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) setSessionPassword(newPassword);
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
      signUp, signInStep1, verifyLoginOtp, signInWithGoogle,
      resetPassword, updatePassword, signOut, refreshRoles,
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
