import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import styled from 'styled-components';
import { Button } from '../Common/Button';
import { Input } from '../Common/Input';
import { Card } from '../Common/Card';
import { theme } from '../../styles/theme';
import { FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

const Wrap = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xl};
  background: ${theme.colors.backgroundSecondary};
`;

const StyledCard = styled(Card)`
  width: 100%;
  max-width: 440px;
  padding: ${theme.spacing.xl};
`;

const Title = styled.h1`
  font-family: ${theme.fonts.heading};
  font-size: ${theme.fontSizes['2xl']};
  margin: 0 0 ${theme.spacing.sm};
  color: ${theme.colors.textPrimary};
`;

const Sub = styled.p`
  margin: 0 0 ${theme.spacing.lg};
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  line-height: 1.5;
`;

const ErrorRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: #dc2626;
  font-size: ${theme.fontSizes.sm};
  margin-top: ${theme.spacing.md};
`;

const SuccessRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: ${theme.colors.success};
  margin-bottom: ${theme.spacing.lg};
`;

type Step = 'request' | 'verify' | 'done';

/**
 * Password reset page powered by Clerk's native reset_password_email_code flow.
 *
 * Step 1 (request): user enters their email → Clerk sends a 6-digit code.
 * Step 2 (verify):  user enters the code + new password → Clerk confirms the reset.
 * Step 3 (done):    success screen with link back to sign-in.
 */
export default function ResetPasswordPage(): React.ReactElement {
  const { signIn, isLoaded, setActive } = useSignIn();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('request');
  // Pre-fill email if coming from the login page "Forgot password?" flow
  const [email, setEmail] = useState(() => {
    try { return sessionStorage.getItem('resetEmail') || ''; } catch { return ''; }
  });
  const [code, setCode] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If we arrived with a pre-filled email, skip straight to verify step
  // (user already requested a code from the login page)
  React.useEffect(() => {
    const storedEmail = (() => { try { return sessionStorage.getItem('resetEmail'); } catch { return null; } })();
    if (storedEmail) {
      // Clear so it doesn't persist on refresh
      try { sessionStorage.removeItem('resetEmail'); } catch {}
      setEmail(storedEmail);
      // Move to verify step — user already received the code
      setStep('verify');
    }
  }, []);

  /* ── Step 1: send reset email ── */
  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setError(null);
    setLoading(true);
    try {
      await signIn.create({
        identifier: email,
        strategy: 'reset_password_email_code',
      });
      setStep('verify');
    } catch (err: any) {
      setError(
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        'Could not send reset email. Check the address and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: verify code + set new password ── */
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    if (pwd.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (pwd !== pwd2) { setError('Passwords do not match.'); return; }
    setError(null);
    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: pwd,
      });
      if (result.status === 'complete') {
        // Log the user in with the new session
        await setActive!({ session: result.createdSessionId });
        setStep('done');
      } else {
        setError('Reset incomplete. Please try again.');
      }
    } catch (err: any) {
      setError(
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        'Invalid or expired code. Request a new reset email and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrap>
      <StyledCard>
        {/* ── Done ── */}
        {step === 'done' && (
          <>
            <Title>Password updated!</Title>
            <SuccessRow>
              <FiCheckCircle size={22} />
              <span>Your password has been changed successfully.</span>
            </SuccessRow>
            <Sub>You are now signed in. Head to the dashboard to continue.</Sub>
            <Button
              variant="primary"
              style={{ width: '100%' }}
              onClick={() => navigate('/')}
            >
              Go to dashboard
            </Button>
          </>
        )}

        {/* ── Step 1: request ── */}
        {step === 'request' && (
          <>
            <Title>Reset your password</Title>
            <Sub>
              Enter the email address on your account and we'll send you a 6-digit
              code to reset your password.
            </Sub>
            <form onSubmit={handleRequest}>
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="you@example.com"
                required
                fullWidth
              />
              {error && (
                <ErrorRow>
                  <FiAlertTriangle /> {error}
                </ErrorRow>
              )}
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading || !email}
                style={{ marginTop: theme.spacing.lg, width: '100%' }}
              >
                Send reset code
              </Button>
            </form>
            <p style={{ marginTop: theme.spacing.xl, fontSize: theme.fontSizes.sm, textAlign: 'center' }}>
              <Link to="/">← Back to sign in</Link>
            </p>
          </>
        )}

        {/* ── Step 2: verify ── */}
        {step === 'verify' && (
          <>
            <Title>Check your email</Title>
            <Sub>
              We sent a 6-digit code to <strong>{email}</strong>. Enter it below
              along with your new password.
            </Sub>
            <form onSubmit={handleVerify}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(null); }}
                placeholder="• • • • • •"
                required
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  fontSize: '1.5rem',
                  letterSpacing: '0.4em',
                  textAlign: 'center',
                  background: '#f1f5f9',
                  border: '1.5px solid transparent',
                  borderRadius: '12px',
                  fontFamily: 'inherit',
                  color: '#111827',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.background = '#fff'; }}
                onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = '#f1f5f9'; }}
              />
              <div style={{ marginTop: theme.spacing.md }} />
              <Input
                label="New password"
                type="password"
                value={pwd}
                onChange={(e) => { setPwd(e.target.value); setError(null); }}
                placeholder="Min. 8 characters"
                required
                fullWidth
              />
              <div style={{ marginTop: theme.spacing.md }} />
              <Input
                label="Confirm new password"
                type="password"
                value={pwd2}
                onChange={(e) => { setPwd2(e.target.value); setError(null); }}
                placeholder="Repeat your password"
                required
                fullWidth
              />
              {error && (
                <ErrorRow>
                  <FiAlertTriangle /> {error}
                </ErrorRow>
              )}
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading || code.length < 6 || !pwd || !pwd2}
                style={{ marginTop: theme.spacing.lg, width: '100%' }}
              >
                Set new password
              </Button>
            </form>
            <p style={{ marginTop: theme.spacing.md, fontSize: theme.fontSizes.sm, textAlign: 'center' }}>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: theme.colors.primary, cursor: 'pointer', fontSize: 'inherit' }}
                onClick={() => { setStep('request'); setCode(''); setPwd(''); setPwd2(''); setError(null); }}
              >
                ← Re-enter email
              </button>
            </p>
          </>
        )}
      </StyledCard>
    </Wrap>
  );
}
