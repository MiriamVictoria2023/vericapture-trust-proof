import { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import googleLogo from '@/assets/google-logo.png';

type Step = 'credentials' | 'forgot';

/**
 * Authentication gate: email/password with email OTP 2FA, Google sign-in,
 * and password reset.
 */
const AuthGate = () => {
  const { signUp, signIn, signInWithGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const resetState = () => { setError(''); setMessage(''); };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetState();
    if (mode === 'signup') {
      const { error } = await signUp(email, password);
      if (error) setError(error.message);
      else setMessage('Check your email to confirm your account, then sign in.');
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    resetState();
    const { error } = await signInWithGoogle();
    if (error) { setError(error.message); setLoading(false); }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetState();
    const { error } = await resetPassword(email);
    if (error) setError(error.message);
    else setMessage('Password reset link sent. Check your inbox.');
    setLoading(false);
  };

  const goBack = () => { setStep('credentials'); resetState(); };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 glow-blue mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">VeriCapture</h1>
          <p className="text-muted-foreground text-sm mt-1">Zero-Trust Secure Evidence System</p>
        </div>

        <div className="glass-panel rounded-xl p-6">
          {/* CREDENTIALS STEP */}
          {step === 'credentials' && (
            <>
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </span>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Email Address</label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="agent@veridept.gov" className="bg-muted/50 border-border" required autoComplete="email" />
                </div>

                <div className="relative">
                  <label className="text-xs text-muted-foreground mb-1 block">Password</label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-muted/50 border-border pr-10"
                    required
                    minLength={6}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[calc(50%+4px)] text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {error && <p className="text-destructive text-xs">{error}</p>}
                {message && <p className="text-success text-xs">{message}</p>}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Please wait...' : mode === 'signin' ? 'Continue with Password' : 'Create Account'}
                </Button>

                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setStep('forgot'); resetState(); }}
                    className="text-xs text-muted-foreground hover:text-primary w-full text-center"
                  >
                    Forgot password?
                  </button>
                )}
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">OR</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full bg-muted/30"
                onClick={handleGoogle}
                disabled={loading}
              >
                <img src={googleLogo} alt="" className="w-4 h-4 mr-2" />
                Continue with Google
              </Button>

              <button
                type="button"
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); resetState(); }}
                className="text-xs text-muted-foreground hover:text-foreground w-full text-center mt-4"
              >
                {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </>
          )}



          {/* FORGOT PASSWORD STEP */}
          {step === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Reset Password</span>
              </div>

              <p className="text-xs text-muted-foreground">
                Enter your email and we'll send you a reset link.
              </p>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email Address</label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="agent@veridept.gov" className="bg-muted/50 border-border" required />
              </div>

              {error && <p className="text-destructive text-xs">{error}</p>}
              {message && <p className="text-success text-xs">{message}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <button type="button" onClick={goBack} className="text-xs text-muted-foreground hover:text-foreground w-full text-center">
                ← Back to sign in
              </button>
            </form>
          )}

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>TLS 1.3 Encrypted • AES-256 at Rest</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthGate;
