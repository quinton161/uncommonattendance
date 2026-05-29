import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useAuth } from '../../contexts/AuthContext';
import { fetchHubs, type Hub } from '../../services/hubService';
import { isAdminEmail } from '../../constants/admin';
import { Eye, EyeOff, Zap, ArrowRight, Chrome, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import type { HubSelection } from '../../types';

type View = 'login' | 'register' | 'forgot';

export const LoginPage: React.FC = () => {
  const { login, register, loginWithGoogle, resetPassword } = useAuth();
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [userType, setUserType] = useState<'attendee' | 'instructor'>('attendee');
  const [selectedHub, setSelectedHub] = useState<HubSelection | null>(null);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHubs().then(setHubs);
  }, []);

  useEffect(() => {
    const tl = gsap.timeline();
    if (leftRef.current) {
      tl.fromTo(leftRef.current, { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
    }
    if (rightRef.current) {
      tl.fromTo(rightRef.current, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, '-=0.6');
    }
  }, []);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' });
    }
  }, [view]);

  const getErrorMsg = (err: unknown): string => {
    if (err && typeof err === 'object' && 'code' in err) {
      const code = (err as { code: string }).code;
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') return 'Invalid email or password.';
      if (code === 'auth/user-not-found') return 'No account with that email.';
      if (code === 'auth/email-already-in-use') return 'Email already registered. Sign in instead.';
      if (code === 'auth/too-many-requests') return 'Too many attempts. Try again later.';
      if (code === 'auth/network-request-failed') return 'Network error. Check your connection.';
    }
    return (err as Error)?.message ?? 'Something went wrong.';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email.trim(), password, selectedHub ?? undefined);
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) { toast.error('Fill in all fields.'); return; }
    if (!isAdminEmail(email) && userType === 'attendee' && !selectedHub) { toast.error('Select your hub.'); return; }
    setLoading(true);
    try {
      await register(email.trim(), password, displayName.trim(), userType, selectedHub ?? undefined);
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Enter your email.'); return; }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      toast.success('Password reset email sent!');
      setView('login');
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!isAdminEmail(normalizedEmail) && !selectedHub) {
      toast.error('Select your hub before signing in with Google.');
      return;
    }

    setLoading(true);
    try {
      await loginWithGoogle(selectedHub ?? undefined);
    } catch (err) {
      toast.error(getErrorMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const needsHub = userType === 'attendee' || userType === 'instructor';

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: 'linear-gradient(135deg, #001466 0%, #0052CC 60%, #1a7fff 100%)' }}>
      <div ref={leftRef} className="hidden lg:flex flex-col items-center justify-center flex-1 p-12 relative">
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-32 right-10 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
        <div className="relative z-10 max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-8 border border-white/20">
            <Zap size={36} className="text-white" fill="white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Uncommon<br />Attendance
          </h1>
          <p className="text-white/70 text-lg leading-relaxed mb-10">
            Track, analyze, and celebrate attendance across every Uncommon hub.
          </p>
          {['Real-time check-in with QR codes', 'Attendance analytics & insights', 'Goal tracking for students'].map(f => (
            <div key={f} className="flex items-center gap-3 mb-4 text-left">
              <CheckCircle size={18} className="text-white/80 flex-shrink-0" />
              <span className="text-white/80 text-sm">{f}</span>
            </div>
          ))}
        </div>
      </div>

      <div ref={rightRef} className="flex-1 lg:max-w-[480px] flex items-center justify-center p-6 bg-white/95 backdrop-blur-xl lg:rounded-l-[2.5rem]">
        <div ref={cardRef} className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-[#0052CC] flex items-center justify-center">
              <Zap size={18} className="text-white" fill="white" />
            </div>
            <span className="font-bold text-gray-900">Uncommon Attendance</span>
          </div>

          {view === 'login' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
              <p className="text-gray-400 text-sm mb-8">Sign in to your account</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 focus:border-[#0052CC] text-sm transition-all bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 focus:border-[#0052CC] text-sm transition-all bg-gray-50/50 pr-12"
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {!isAdminEmail(email) && (
                  <HubSelector hubs={hubs} value={selectedHub} onChange={setSelectedHub} />
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0052CC] to-[#003D99] !text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 mt-2 [&_*]:!text-white"
                >
                  {loading ? 'Signing in...' : <>Sign In <ArrowRight size={16} /></>}
                </button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                  <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">or</span></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Chrome size={16} /> Continue with Google
                </button>
              </form>

              <div className="flex justify-between gap-3 mt-6 text-xs">
                <button
                  type="button"
                  onClick={() => setView('forgot')}
                  className="rounded-lg bg-[#0052CC] px-3 py-1.5 !text-white font-semibold hover:bg-[#003D99] [&_*]:!text-white"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() => setView('register')}
                  className="rounded-lg bg-[#0052CC] px-3 py-1.5 !text-white font-semibold hover:bg-[#003D99] [&_*]:!text-white"
                >
                  Create account
                </button>
              </div>
            </>
          )}

          {view === 'register' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Create account</h2>
              <p className="text-gray-400 text-sm mb-8">Join your Uncommon hub</p>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Your full name"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 focus:border-[#0052CC] text-sm transition-all bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 focus:border-[#0052CC] text-sm transition-all bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      required
                      minLength={6}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 focus:border-[#0052CC] text-sm transition-all bg-gray-50/50 pr-12"
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Role</label>
                  <select
                    value={userType}
                    onChange={e => setUserType(e.target.value as 'attendee' | 'instructor')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 text-sm bg-gray-50/50"
                  >
                    <option value="attendee">Student (Attendee)</option>
                    <option value="instructor">Instructor</option>
                  </select>
                </div>
                {needsHub && (
                  <HubSelector hubs={hubs} value={selectedHub} onChange={setSelectedHub} label="Your Hub" required />
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0052CC] to-[#003D99] !text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 mt-2 [&_*]:!text-white"
                >
                  {loading ? 'Creating...' : <>Create Account <ArrowRight size={16} /></>}
                </button>
              </form>

              <button
                type="button"
                onClick={() => setView('login')}
                className="mt-6 w-full rounded-lg bg-[#0052CC] px-3 py-2 text-xs font-semibold !text-white hover:bg-[#003D99] [&_*]:!text-white"
              >
                Already have an account? Sign in
              </button>
            </>
          )}

          {view === 'forgot' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Reset password</h2>
              <p className="text-gray-400 text-sm mb-8">We'll send a reset link to your email</p>

              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 focus:border-[#0052CC] text-sm transition-all bg-gray-50/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0052CC] to-[#003D99] !text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 [&_*]:!text-white"
                >
                  {loading ? 'Sending...' : <>Send Reset Link <ArrowRight size={16} /></>}
                </button>
              </form>

              <button
                type="button"
                onClick={() => setView('login')}
                className="mt-6 w-full rounded-lg bg-[#0052CC] px-3 py-2 text-xs font-semibold !text-white hover:bg-[#003D99] [&_*]:!text-white"
              >
                Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const HubSelector: React.FC<{
  hubs: Hub[];
  value: HubSelection | null;
  onChange: (h: HubSelection | null) => void;
  label?: string;
  required?: boolean;
}> = ({ hubs, value, onChange, label = 'Hub', required }) => (
  <div>
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">{label}</label>
    <select
      value={value?.id ?? ''}
      onChange={e => {
        const hub = hubs.find(h => h.id === e.target.value);
        onChange(hub ? { id: hub.id, name: hub.name } : null);
      }}
      required={required}
      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 text-sm bg-gray-50/50"
    >
      <option value="">Select a hub</option>
      {hubs.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
    </select>
  </div>
);
