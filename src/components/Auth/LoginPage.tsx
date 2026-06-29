import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useSignIn, useSignUp } from '@clerk/clerk-react';
import styled, { keyframes, css } from 'styled-components';
import { Zap as FiZap, User as FiUser, Mail as FiMail, Lock as FiLock, Eye as FiEye, EyeOff as FiEyeOff, MapPin as FiMapPin, CheckCircle as FiCheckCircle } from 'lucide-react';
import { fetchHubs, hubLabel, type Hub, DEFAULT_HUBS } from '../../services/hubService';
import { isUncommonOrgStaffEmail } from '../../constants/staff';

type View = 'login' | 'register';

/* ── Animations ── */
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-12px); }
`;
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── Layout ── */
const Wrapper = styled.div`
  display: flex;
  min-height: 100vh;
  overflow: hidden;
  font-family: 'Chillax', 'Inter', sans-serif;
  background: #ffffff;
`;

const LeftPanel = styled.div`
  flex: 0 0 42%;
  background: linear-gradient(150deg, #1a3c8f 0%, #2563eb 58%, #3b82f6 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 3rem 5rem;
  position: relative;
  text-align: center;
  color: #fff;
  overflow: hidden;
  @media (max-width: 900px) { display: none; }
`;

const Blob = styled.div<{ top?: string; left?: string; right?: string; bottom?: string; size?: string }>`
  position: absolute;
  width: ${p => p.size ?? '260px'};
  height: ${p => p.size ?? '260px'};
  background: rgba(255,255,255,0.06);
  border-radius: 50%;
  top: ${p => p.top ?? 'auto'};
  left: ${p => p.left ?? 'auto'};
  right: ${p => p.right ?? 'auto'};
  bottom: ${p => p.bottom ?? 'auto'};
  filter: blur(40px);
  pointer-events: none;
`;

const CloudDivider = styled.div`
  position: absolute;
  right: -2px; top: 0;
  height: 100%; width: 90px;
  z-index: 5; pointer-events: none;
  svg { height: 100%; width: 100%; }
`;

const BrandContent = styled.div`
  position: relative;
  z-index: 10;
  animation: ${fadeUp} 0.8s ease-out;
`;

const LogoCircle = styled.div`
  width: 96px; height: 96px;
  border-radius: 50%;
  background: rgba(255,255,255,0.18);
  backdrop-filter: blur(8px);
  border: 2px solid rgba(255,255,255,0.35);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 1.6rem;
  animation: ${float} 5s ease-in-out infinite;
`;

const WelcomeTitle = styled.h1`
  font-size: 2.2rem; font-weight: 700;
  margin: 0 0 0.3rem; letter-spacing: -0.02em;
`;
const AppCaption = styled.p`
  font-size: 0.8rem; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  opacity: 0.7; margin: 0 0 1.25rem;
`;
const WelcomeSub = styled.p`
  font-size: 0.95rem; line-height: 1.7;
  opacity: 0.78; max-width: 280px; margin: 0 auto;
`;

const BottomLinks = styled.div`
  position: absolute; bottom: 2rem; z-index: 10;
  display: flex; gap: 1.5rem; align-items: center;

  button {
    all: unset !important;
    cursor: pointer !important;
    font-family: 'Chillax', 'Inter', sans-serif !important;
    font-size: 0.73rem !important;
    font-weight: 700 !important;
    letter-spacing: 0.12em !important;
    text-transform: uppercase !important;
    color: rgba(255,255,255,0.58) !important;
    transition: color 0.2s !important;
    background: none !important;
    border: none !important;
    padding: 0 !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    &:hover { color: #fff !important; }
  }
  span { color: rgba(255,255,255,0.28); }
`;

/* ── Right panel ── */
const RightPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #ffffff;
  overflow-y: auto;
`;

const MobileTop = styled.div`
  display: none;
  @media (max-width: 900px) {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
    min-height: 180px;
    padding-bottom: 1.75rem;
    background: linear-gradient(150deg, #1a3c8f 0%, #2563eb 60%, #3b82f6 100%);
    border-bottom-left-radius: 44px;
    border-bottom-right-radius: 44px;
    color: #fff;
    text-align: center;
    margin-bottom: 1.5rem;
  }
`;

const FormArea = styled.div`
  width: 100%; max-width: 460px;
  animation: ${fadeUp} 0.5s ease-out;
`;

const FormTitle = styled.h2`
  font-size: 1.7rem; font-weight: 700;
  color: #111827; margin: 0 0 1.5rem;
  font-family: 'Chillax', 'Inter', sans-serif;
`;

/* ── Tabs ── */
const TabBar = styled.div`
  display: flex;
  background: #f1f5f9;
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 1.6rem;
`;

const Tab = styled.button<{ $active: boolean }>`
  all: unset;
  flex: 1; display: block; text-align: center;
  padding: 0.5rem 1rem; border-radius: 7px;
  font-size: 0.9rem; font-weight: 600;
  cursor: pointer;
  font-family: 'Chillax', 'Inter', sans-serif;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  ${p => p.$active
    ? css`background: #2563eb !important; color: #fff !important; box-shadow: 0 2px 8px rgba(37,99,235,0.3);`
    : css`background: transparent !important; color: #64748b !important;`
  }
`;

/* ── Form elements ── */
const Field = styled.div`
  display: flex; flex-direction: column; gap: 6px; margin-bottom: 1rem;
`;

const Label = styled.label`
  font-size: 0.875rem; font-weight: 600;
  color: #111827; font-family: 'Chillax', 'Inter', sans-serif;
`;

const InputWrap = styled.div`
  position: relative; display: flex; align-items: center;
`;

const InputIcon = styled.span`
  position: absolute; left: 14px;
  display: flex; align-items: center;
  color: #9ca3af; font-size: 16px;
  pointer-events: none; z-index: 1;
`;

const StyledInput = styled.input`
  all: unset;
  box-sizing: border-box; width: 100%;
  padding: 13px 16px 13px 42px;
  background: #f1f5f9;
  border: 1.5px solid transparent;
  border-radius: 12px;
  font-size: 0.95rem;
  font-family: 'Chillax', 'Inter', sans-serif;
  color: #111827;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  &::placeholder { color: #9ca3af; }
  &:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
    background: #ffffff;
    outline: none;
  }
`;

const PasswordToggle = styled.button`
  all: unset;
  position: absolute; right: 14px;
  display: flex; align-items: center;
  color: #9ca3af !important; cursor: pointer; font-size: 16px;
  transition: color 0.2s;
  &:hover { color: #6b7280 !important; }
`;

const StyledSelect = styled.select`
  all: unset;
  box-sizing: border-box; width: 100%;
  padding: 13px 40px 13px 42px;
  background: #f1f5f9;
  border: 1.5px solid transparent;
  border-radius: 12px;
  font-size: 0.95rem;
  font-family: 'Chillax', 'Inter', sans-serif;
  color: #111827;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  appearance: none; -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  background-color: #f1f5f9;
  &:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
    background-color: #ffffff;
    outline: none;
  }
`;

const RoleRow = styled.div`
  display: flex; background: #f1f5f9;
  border-radius: 12px; padding: 4px; gap: 4px; margin-bottom: 1rem;
`;

const RoleBtn = styled.button<{ $active: boolean }>`
  all: unset;
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px 0; border-radius: 9px;
  font-size: 0.875rem; font-weight: 600; cursor: pointer;
  font-family: 'Chillax', 'Inter', sans-serif;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  ${p => p.$active
    ? css`background: #2563eb !important; color: #fff !important; box-shadow: 0 2px 10px rgba(37,99,235,0.3);`
    : css`background: transparent !important; color: #64748b !important;`
  }
`;

const SubmitBtn = styled.button<{ disabled?: boolean }>`
  all: unset;
  display: flex; align-items: center; justify-content: center;
  width: 100%; box-sizing: border-box;
  margin-top: 1.25rem; padding: 15px;
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%) !important;
  color: #fff !important;
  font-size: 1rem; font-weight: 700;
  font-family: 'Chillax', 'Inter', sans-serif;
  letter-spacing: 0.02em;
  border-radius: 12px;
  cursor: ${p => p.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${p => p.disabled ? 0.6 : 1};
  box-shadow: 0 4px 18px rgba(37,99,235,0.28);
  transition: opacity 0.2s, transform 0.15s, box-shadow 0.15s;
  &:hover:not([disabled]) { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(37,99,235,0.4); }
  &:active:not([disabled]) { transform: scale(0.98); }
`;

const ErrorBox = styled.div`
  background: rgba(239,68,68,0.06); color: #dc2626;
  border: 1px solid rgba(239,68,68,0.15);
  border-radius: 10px; padding: 12px 14px;
  font-size: 0.875rem; font-family: 'Chillax', 'Inter', sans-serif;
  margin-bottom: 1rem;
`;

const FooterNote = styled.p`
  text-align: center; margin-top: 1.25rem;
  font-size: 0.875rem; color: #6b7280;
  font-family: 'Chillax', 'Inter', sans-serif;
`;

const PlainLink = styled.button`
  all: unset !important;
  color: #2563eb !important;
  font-weight: 700 !important; cursor: pointer !important;
  margin-left: 4px !important;
  font-family: 'Chillax', 'Inter', sans-serif !important;
  font-size: 0.875rem !important;
  background: none !important;
  border: none !important;
  padding: 0 !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  &:hover { text-decoration: underline !important; }
`;

const ForgotLink = styled.button`
  all: unset !important;
  color: #2563eb !important;
  font-size: 0.8rem !important; font-weight: 600 !important;
  cursor: pointer !important;
  font-family: 'Chillax', 'Inter', sans-serif !important;
  background: none !important;
  border: none !important;
  padding: 0 !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  &:hover { text-decoration: underline !important; }
`;

const HelperNote = styled.p`
  font-size: 0.8rem; color: #10b981;
  font-family: 'Chillax', 'Inter', sans-serif;
  margin: -6px 0 10px;
  display: flex; align-items: center; gap: 5px;
`;

/* ══════════════════════════════════════════════════════════════
   SIGN-IN FORM
══════════════════════════════════════════════════════════════ */
interface SignInFormProps { onSwitchToRegister: () => void; }

const SignInForm: React.FC<SignInFormProps> = ({ onSwitchToRegister }) => {
  const { signIn, isLoaded, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  // Email verification code step (when Clerk requires email_code factor on login)
  const [verifyStep, setVerifyStep] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');

  const clear = () => { if (error) setError(''); };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || loading) return;
    setLoading(true); setError('');
    try {
      const result = await signIn!.create({ identifier: email, password });
      if (result.status === 'complete') {
        await setActive!({ session: result.createdSessionId });
      } else if (result.status === 'needs_first_factor') {
        // Clerk requires an additional email verification step
        // Find the email_code or email_link strategy
        const emailCodeFactor = result.supportedFirstFactors?.find(
          (f: any) => f.strategy === 'email_code'
        ) as any;
        const emailLinkFactor = result.supportedFirstFactors?.find(
          (f: any) => f.strategy === 'email_link'
        ) as any;

        if (emailCodeFactor) {
          await signIn!.prepareFirstFactor({
            strategy: 'email_code',
            emailAddressId: emailCodeFactor.emailAddressId,
          });
          setVerifyStep(true);
        } else if (emailLinkFactor) {
          await signIn!.prepareFirstFactor({
            strategy: 'email_link',
            emailAddressId: emailLinkFactor.emailAddressId,
            redirectUrl: window.location.origin + '/',
          });
          setError('A sign-in link has been sent to your email. Click it to continue.');
        } else {
          setError('Additional verification required. Please contact support.');
        }
      } else if (result.status === 'needs_second_factor') {
        setError('Two-factor authentication is required. Please use the Clerk modal to complete sign-in.');
      } else {
        console.error('SIGNIN_UNEXPECTED_STATUS:', result.status, JSON.stringify(result));
        setError(`Sign in incomplete (${result.status}). Please try again.`);
      }
    } catch (err: any) {
      console.error('SignIn error:', err);
      setError(err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Sign in failed.');
    } finally { setLoading(false); }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || loading) return;
    setLoading(true); setError('');
    try {
      const result = await signIn!.attemptFirstFactor({
        strategy: 'email_code',
        code: verifyCode,
      });
      if (result.status === 'complete') {
        await setActive!({ session: result.createdSessionId });
      } else {
        setError(`Verification incomplete (Status: ${result.status}). Please try again or contact support.`);
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Invalid code.');
    } finally { setLoading(false); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || loading || !email) return;
    setLoading(true); setError('');
    try {
      await signIn!.create({ identifier: email, strategy: 'reset_password_email_code' });
      setResetSent(true);
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Failed to send reset email.');
    } finally { setLoading(false); }
  };

  if (verifyStep) return (
    <div>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:'1.25rem' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'#eff6ff', border:'2px solid #93c5fd', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <FiMail size={28} color="#2563eb" />
        </div>
      </div>
      <FormTitle style={{ textAlign:'center', fontSize:'1.4rem' }}>Check your email</FormTitle>
      <p style={{ color:'#6b7280', fontSize:'0.9rem', textAlign:'center', marginBottom:'1.5rem', fontFamily:"'Chillax','Inter',sans-serif", lineHeight:1.6 }}>
        We sent a 6-digit sign-in code to <strong style={{ color:'#111827' }}>{email}</strong>.
      </p>
      {error && <ErrorBox>{error}</ErrorBox>}
      <form onSubmit={handleVerifyCode}>
        <Field>
          <Label>Verification Code</Label>
          <StyledInput
            type="text" inputMode="numeric" maxLength={6} placeholder="• • • • • •"
            value={verifyCode} onChange={e => { setVerifyCode(e.target.value.replace(/\D/g,'')); clear(); }} required
            style={{ letterSpacing:'0.4em', fontSize:'1.4rem', textAlign:'center', paddingLeft:'16px' }}
          />
          <p style={{ color:'#6b7280', fontSize:'0.8rem', textAlign:'center', margin:'8px 0 0', fontFamily:"'Chillax','Inter',sans-serif" }}>
            Enter the code, then tap <strong>Continue</strong>
          </p>
        </Field>
        <SubmitBtn type="submit" disabled={loading || verifyCode.length < 6}>
          {loading ? 'Verifying…' : 'Continue'}
        </SubmitBtn>
      </form>
      <FooterNote><PlainLink onClick={() => { setVerifyStep(false); setVerifyCode(''); setError(''); }}>← Back</PlainLink></FooterNote>
    </div>
  );

  if (resetSent) return (
    <div>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:'1.25rem' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'#f0fdf4', border:'2px solid #86efac', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <FiCheckCircle size={28} color="#16a34a" />
        </div>
      </div>
      <FormTitle style={{ textAlign:'center', fontSize:'1.4rem' }}>Check your email</FormTitle>
      <p style={{ color:'#6b7280', fontSize:'0.9rem', textAlign:'center', marginBottom:'1rem', fontFamily:"'Chillax','Inter',sans-serif", lineHeight:1.6 }}>
        We sent a 6-digit reset code to <strong style={{ color:'#111827' }}>{email}</strong>.
        Open the <strong>/reset-password</strong> page and enter the code there.
      </p>
      <SubmitBtn
        type="button"
        onClick={() => {
          // Store email so reset page can pre-fill it
          try { sessionStorage.setItem('resetEmail', email); } catch {}
          window.location.href = '/reset-password';
        }}
      >
        Go to Reset Password →
      </SubmitBtn>
      <FooterNote><PlainLink onClick={() => { setForgotMode(false); setResetSent(false); }}>← Back to Sign In</PlainLink></FooterNote>
    </div>
  );

  if (forgotMode) return (
    <div>
      <FormTitle>Reset password</FormTitle>
      <p style={{ color:'#6b7280', fontSize:'0.9rem', marginBottom:'1.5rem', fontFamily:"'Chillax','Inter',sans-serif", lineHeight:1.6 }}>
        Enter your email and we'll send you a 6-digit reset code.
      </p>
      {error && <ErrorBox>{error}</ErrorBox>}
      <form onSubmit={handleForgot}>
        <Field>
          <Label>Email Address</Label>
          <InputWrap>
            <InputIcon><FiMail /></InputIcon>
            <StyledInput type="email" placeholder="Enter your email" value={email} onChange={e => { setEmail(e.target.value); clear(); }} required />
          </InputWrap>
        </Field>
        <SubmitBtn type="submit" disabled={loading || !email}>
          {loading ? 'Sending…' : 'Send Reset Code'}
        </SubmitBtn>
      </form>
      <FooterNote><PlainLink onClick={() => setForgotMode(false)}>← Back to Sign In</PlainLink></FooterNote>
    </div>
  );

  return (
    <div>
      <FormTitle>Welcome back</FormTitle>
      {error && <ErrorBox>{error}</ErrorBox>}
      <form onSubmit={handleSignIn}>
        <Field>
          <Label>Email Address</Label>
          <InputWrap>
            <InputIcon><FiMail /></InputIcon>
            <StyledInput type="email" placeholder="Enter your email" value={email} onChange={e => { setEmail(e.target.value); clear(); }} required autoComplete="email" />
          </InputWrap>
        </Field>
        <Field>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <Label>Password</Label>
            <ForgotLink type="button" onClick={() => setForgotMode(true)}>Forgot password?</ForgotLink>
          </div>
          <InputWrap>
            <InputIcon><FiLock /></InputIcon>
            <StyledInput
              type={showPw ? 'text' : 'password'} placeholder="Enter your password"
              value={password} onChange={e => { setPassword(e.target.value); clear(); }}
              required autoComplete="current-password" style={{ paddingRight:'44px' }}
            />
            <PasswordToggle type="button" onClick={() => setShowPw(v => !v)}>
              {showPw ? <FiEyeOff /> : <FiEye />}
            </PasswordToggle>
          </InputWrap>
        </Field>
        <SubmitBtn type="submit" disabled={loading || !email || !password}>
          {loading ? 'Verifying…' : 'Continue'}
        </SubmitBtn>
      </form>
      <FooterNote>
        Don't have an account? <PlainLink onClick={onSwitchToRegister}>Sign Up</PlainLink>
      </FooterNote>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   SIGN-UP FORM
══════════════════════════════════════════════════════════════ */
interface RegisterFormProps { onSwitchToLogin: () => void; }

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { signUp, isLoaded, setActive } = useSignUp();
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [hubs, setHubs] = useState<Hub[]>(() => [...DEFAULT_HUBS]);
  const [hubId, setHubId] = useState('');
  const [form, setForm] = useState({ name:'', email:'', password:'', confirmPassword:'' });
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchHubs().then(list => { if (!cancelled) setHubs(list); });
    return () => { cancelled = true; };
  }, []);

  const clear = () => { if (error) setError(''); };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value })); clear();
  };
  const handleRoleChange = (r: 'student' | 'admin') => {
    setRole(r); setForm({ name:'', email:'', password:'', confirmPassword:'' }); setHubId(''); setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || loading) return;
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (role === 'student' && isUncommonOrgStaffEmail(form.email)) { setError('@uncommon.org emails cannot register as students. Switch to Admin.'); return; }
    if (role === 'admin' && !isUncommonOrgStaffEmail(form.email)) { setError('Admin accounts must use an @uncommon.org email address.'); return; }
    // Only students/instructors need a hub; admins (@uncommon.org) do not
    if (role === 'student' && !hubId) { setError('Please select your hub.'); return; }

    setLoading(true); setError('');
    try {
      // Generate a username from email (e.g. "john.doe@gmail.com" → "john.doe123")
      const baseUsername = form.email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      const username = `${baseUsername}_${Math.floor(Math.random() * 900 + 100)}`;

      await signUp!.create({
        emailAddress: form.email,
        password: form.password,
        firstName: form.name.split(' ')[0] || form.name,
        lastName: form.name.split(' ').slice(1).join(' ') || form.name.split(' ')[0] || form.name,
        username,
        unsafeMetadata: {
          userType: role === 'admin' ? 'admin' : 'attendee',
          hubId: role === 'admin' ? undefined : hubId,
          hubName: role === 'admin' ? undefined : (hubs.find(h => h.id === hubId)?.name || ''),
        },
      });
      await signUp!.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || loading) return;
    setLoading(true); setError('');
    try {
      const result = await signUp!.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive!({ session: result.createdSessionId });
      } else {
        // Show the actual Clerk status and missing fields for debugging
        const clerkErr = (result as any)?.errors?.[0];
        if (clerkErr) {
          setError(clerkErr.longMessage || clerkErr.message || `Sign-up incomplete (${result.status})`);
        } else {
          const missing = (result as any).missingFields ? (result as any).missingFields.join(', ') : 'none';
          const unverified = (result as any).unverifiedFields ? (result as any).unverifiedFields.join(', ') : 'none';
          setError(`Sign-up incomplete. Status: "${result.status}". Missing: ${missing}. Unverified: ${unverified}.`);
        }
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Invalid verification code.');
    } finally { setLoading(false); }
  };

  if (pendingVerification) return (
    <div>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:'1.25rem' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'#eff6ff', border:'2px solid #93c5fd', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <FiMail size={28} color="#2563eb" />
        </div>
      </div>
      <FormTitle style={{ textAlign:'center', fontSize:'1.4rem' }}>Verify your email</FormTitle>
      <p style={{ color:'#6b7280', fontSize:'0.9rem', textAlign:'center', marginBottom:'1.5rem', fontFamily:"'Chillax','Inter',sans-serif", lineHeight:1.6 }}>
        We sent a 6-digit code to <strong style={{ color:'#111827' }}>{form.email}</strong>
      </p>
      {error && <ErrorBox>{error}</ErrorBox>}
      <form onSubmit={handleVerify}>
        <Field>
          <Label>Verification Code</Label>
          <StyledInput
            type="text" inputMode="numeric" maxLength={6} placeholder="• • • • • •"
            value={code} onChange={e => { setCode(e.target.value.replace(/\D/g,'')); clear(); }} required
            style={{ letterSpacing:'0.4em', fontSize:'1.4rem', textAlign:'center', paddingLeft:'16px' }}
          />
          <p style={{ color:'#6b7280', fontSize:'0.8rem', textAlign:'center', margin:'8px 0 0', fontFamily:"'Chillax','Inter',sans-serif" }}>
            Enter the code, then tap <strong>Continue</strong>
          </p>
        </Field>
        <SubmitBtn type="submit" disabled={loading || code.length < 6}>
          {loading ? 'Verifying…' : 'Continue'}
        </SubmitBtn>
      </form>
      <FooterNote>Wrong email? <PlainLink onClick={() => setPendingVerification(false)}>Go back</PlainLink></FooterNote>
    </div>
  );

  return (
    <div>
      <FormTitle>Create your account</FormTitle>

      <Label style={{ marginBottom:'8px', display:'block' }}>I am an Uncommon…</Label>
      <RoleRow>
        <RoleBtn $active={role === 'student'} type="button" onClick={() => handleRoleChange('student')}>
          <FiUser size={15} /> Student
        </RoleBtn>
        <RoleBtn $active={role === 'admin'} type="button" onClick={() => handleRoleChange('admin')}>
          <FiCheckCircle size={15} /> Admin
        </RoleBtn>
      </RoleRow>

      {role === 'admin' && (
        <HelperNote><FiCheckCircle size={13} /> Admin accounts require an @uncommon.org email</HelperNote>
      )}

      {error && <ErrorBox>{error}</ErrorBox>}

      <form onSubmit={handleSubmit}>
        <Field>
          <Label>Full Name</Label>
          <InputWrap>
            <InputIcon><FiUser /></InputIcon>
            <StyledInput name="name" type="text" placeholder="Enter your full name" value={form.name} onChange={handleChange} required />
          </InputWrap>
        </Field>

        <Field>
          <Label>Email Address</Label>
          <InputWrap>
            <InputIcon><FiMail /></InputIcon>
            <StyledInput name="email" type="email" placeholder={role === 'admin' ? 'username@uncommon.org' : 'Enter your email'} value={form.email} onChange={handleChange} required />      
          </InputWrap>
        </Field>

        {role === 'student' && (
          <Field>
            <Label>Your Hub</Label>
            <InputWrap>
              <InputIcon><FiMapPin /></InputIcon>
              <StyledSelect name="hubId" value={hubId} onChange={e => { setHubId(e.target.value); clear(); }} required>
                <option value="">Select your hub…</option>
                {hubs.map(h => <option key={h.id} value={h.id}>{hubLabel(h)}</option>)}
              </StyledSelect>
            </InputWrap>
          </Field>
        )}

        <Field>
          <Label>Password</Label>
          <InputWrap>
            <InputIcon><FiLock /></InputIcon>
            <StyledInput name="password" type={showPw ? 'text' : 'password'} placeholder="Create a password (min. 8 chars)" value={form.password} onChange={handleChange} required style={{ paddingRight:'44px' }} />
            <PasswordToggle type="button" onClick={() => setShowPw(v => !v)}>{showPw ? <FiEyeOff /> : <FiEye />}</PasswordToggle>
          </InputWrap>
        </Field>

        <Field>
          <Label>Confirm Password</Label>
          <InputWrap>
            <InputIcon><FiLock /></InputIcon>
            <StyledInput name="confirmPassword" type={showCPw ? 'text' : 'password'} placeholder="Repeat your password" value={form.confirmPassword} onChange={handleChange} required style={{ paddingRight:'44px' }} />
            <PasswordToggle type="button" onClick={() => setShowCPw(v => !v)}>{showCPw ? <FiEyeOff /> : <FiEye />}</PasswordToggle>
          </InputWrap>
        </Field>

        <SubmitBtn type="submit" disabled={loading || (role === 'student' && !hubId) || !form.name || !form.email || !form.password || !form.confirmPassword}>
          {loading ? 'Creating account…' : 'Continue'}
        </SubmitBtn>
      </form>

      <FooterNote>
        Already have an account? <PlainLink onClick={onSwitchToLogin}>Sign In</PlainLink>
      </FooterNote>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export const LoginPage: React.FC = () => {
  const [view, setView] = useState<View>('login');
  const leftRef  = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const formRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();
    if (leftRef.current)  tl.fromTo(leftRef.current,  { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
    if (rightRef.current) tl.fromTo(rightRef.current, { x: 60,  opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, '-=0.6');
  }, []);

  useEffect(() => {
    if (formRef.current) gsap.fromTo(formRef.current, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' });
  }, [view]);

  return (
    <Wrapper data-ui="auth-page">
      {/* LEFT */}
      <LeftPanel ref={leftRef}>
        <Blob top="-80px" left="-80px" size="300px" />
        <Blob bottom="-60px" right="60px" size="220px" />
        <BrandContent>
          <LogoCircle>
            <FiZap size={42} color="#ffffff" />
          </LogoCircle>
          <WelcomeTitle>Welcome to</WelcomeTitle>
          <AppCaption>Uncommon Attendance</AppCaption>
          <WelcomeSub>Smart and reliable attendance tracking for every Uncommon hub. Track, celebrate, and grow together.</WelcomeSub>
        </BrandContent>
        <CloudDivider>
          <svg viewBox="0 0 100 600" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,0 C60,40 20,80 60,120 C100,160 40,200 70,240 C100,280 30,320 60,360 C90,400 20,440 60,480 C100,520 40,560 0,600 L100,600 L100,0 Z" fill="white" />
          </svg>
        </CloudDivider>
        <BottomLinks>
          <button onClick={() => setView('register')}>Create here</button>
          <span>|</span>
          <button onClick={() => setView('login')}>Sign in</button>
        </BottomLinks>
      </LeftPanel>

      {/* RIGHT */}
      <RightPanel ref={rightRef}>
        <MobileTop>
          <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(255,255,255,0.18)', border:'2px solid rgba(255,255,255,0.35)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'0.75rem' }}>
            <FiZap size={28} color="#ffffff" />
          </div>
          <p style={{ fontWeight:700, fontSize:'1rem', margin:0, fontFamily:"'Chillax','Inter',sans-serif" }}>Uncommon Attendance</p>
        </MobileTop>

        <FormArea>
          <TabBar>
            <Tab $active={view === 'login'}    onClick={() => setView('login')}>Sign In</Tab>
            <Tab $active={view === 'register'} onClick={() => setView('register')}>Sign Up</Tab>
          </TabBar>
          <div ref={formRef}>
            {view === 'login'
              ? <SignInForm    onSwitchToRegister={() => setView('register')} />
              : <RegisterForm  onSwitchToLogin={() => setView('login')} />
            }
          </div>
        </FormArea>
        {/* Clerk CAPTCHA */}
        <div id="clerk-captcha" />
      </RightPanel>
    </Wrapper>
  );
};