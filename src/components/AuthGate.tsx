import { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AuthGateProps {
  onAuthenticated: () => void;
}

/**
 * Multi-Factor Authentication gate component.
 * Simulates email/password + TOTP verification.
 */
const AuthGate = ({ onAuthenticated }: AuthGateProps) => {
  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 800));
    if (email && password.length >= 6) {
      setStep('mfa');
    } else {
      setError('Invalid credentials. Password must be at least 6 characters.');
    }
    setLoading(false);
  };

  const handleMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 600));
    if (mfaCode.length === 6) {
      onAuthenticated();
    } else {
      setError('Invalid MFA code. Enter a 6-digit code.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 glow-blue mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">VeriCapture</h1>
          <p className="text-muted-foreground text-sm mt-1">Zero-Trust Secure Evidence System</p>
        </div>

        <div className="glass-panel rounded-xl p-6">
          {step === 'credentials' ? (
            <form onSubmit={handleCredentials} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Step 1: Identity Verification</span>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email Address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="agent@veridept.gov"
                  className="bg-muted/50 border-border"
                  required
                />
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[calc(50%+4px)] text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && <p className="text-destructive text-xs">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Authenticating...' : 'Continue to MFA'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleMFA} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Fingerprint className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Step 2: Multi-Factor Verification</span>
              </div>

              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code from your authenticator app.
              </p>

              <Input
                type="text"
                maxLength={6}
                value={mfaCode}
                onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="bg-muted/50 border-border text-center text-2xl tracking-[0.5em] font-mono"
              />

              {error && <p className="text-destructive text-xs">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Access System'}
              </Button>

              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="text-xs text-muted-foreground hover:text-foreground w-full text-center"
              >
                ← Back to credentials
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
