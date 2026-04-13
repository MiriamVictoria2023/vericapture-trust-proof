import { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Authentication gate with email/password and phone OTP support.
 */
const AuthGate = () => {
  const { signIn, signUp, signInWithPhone, verifyPhoneOtp } = useAuth();
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  // Email fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Phone fields
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  // Shared
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    if (mode === 'signup') {
      const { error } = await signUp(email, password);
      if (error) setError(error.message);
      else setMessage('Check your email to confirm your account.');
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    }
    setLoading(false);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    const { error } = await signInWithPhone(phone);
    if (error) {
      setError(error.message);
    } else {
      setOtpSent(true);
      setMessage('Verification code sent to your phone.');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    const { error } = await verifyPhoneOtp(phone, otp);
    if (error) setError(error.message);
    setLoading(false);
  };

  const switchMethod = (method: 'email' | 'phone') => {
    setAuthMethod(method);
    setError('');
    setMessage('');
    setOtpSent(false);
    setOtp('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 glow-blue mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">VeriCapture</h1>
          <p className="text-muted-foreground text-sm mt-1">Zero-Trust Secure Evidence System</p>
        </div>

        <div className="glass-panel rounded-xl p-6">
          {/* Method tabs */}
          <div className="flex gap-1 mb-5 p-1 bg-muted/50 rounded-lg">
            <button
              onClick={() => switchMethod('email')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors ${
                authMethod === 'email' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Mail className="w-3.5 h-3.5" /> Email
            </button>
            <button
              onClick={() => switchMethod('phone')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors ${
                authMethod === 'phone' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Phone className="w-3.5 h-3.5" /> Phone
            </button>
          </div>

          {/* Email form */}
          {authMethod === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {mode === 'signin' ? 'Sign In with Email' : 'Create Account'}
                </span>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email Address</label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="agent@veridept.gov" className="bg-muted/50 border-border" required />
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
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[calc(50%+4px)] text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && <p className="text-destructive text-xs">{error}</p>}
              {message && <p className="text-success text-xs">{message}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>

              <button
                type="button"
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage(''); }}
                className="text-xs text-muted-foreground hover:text-foreground w-full text-center"
              >
                {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </form>
          )}

          {/* Phone form */}
          {authMethod === 'phone' && !otpSent && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Sign In with Phone</span>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Phone Number</label>
                <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="bg-muted/50 border-border" required />
                <p className="text-xs text-muted-foreground mt-1">Include country code (e.g. +1 for US)</p>
              </div>

              {error && <p className="text-destructive text-xs">{error}</p>}
              {message && <p className="text-success text-xs">{message}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Verification Code'}
              </Button>
            </form>
          )}

          {authMethod === 'phone' && otpSent && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Verify Phone</span>
              </div>

              <p className="text-xs text-muted-foreground">Enter the 6-digit code sent to <span className="text-foreground font-mono">{phone}</span></p>

              <Input
                type="text"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="bg-muted/50 border-border text-center text-2xl tracking-[0.5em] font-mono"
                required
              />

              {error && <p className="text-destructive text-xs">{error}</p>}
              {message && <p className="text-success text-xs">{message}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Access System'}
              </Button>

              <button type="button" onClick={() => { setOtpSent(false); setOtp(''); setError(''); setMessage(''); }} className="text-xs text-muted-foreground hover:text-foreground w-full text-center">
                ← Change phone number
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
