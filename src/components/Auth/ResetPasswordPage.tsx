import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthActions } from '@convex-dev/auth/react';
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

export default function ResetPasswordPage(): React.ReactElement {
  const { signIn } = useAuthActions();

  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setLoading(true);
    try {
      await signIn("resend-otp", { email });
      setStep('verify');
    } catch (err: any) {
      setError(err?.message || 'Could not send reset code. Check the address and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) return;
    setError(null);
    setLoading(true);
    try {
      await signIn("resend-otp", { email, code });
      setStep('done');
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired code. Request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrap>
      <StyledCard>
        {step === 'done' && (
          <>
            <Title>Signed in!</Title>
            <SuccessRow>
              <FiCheckCircle size={22} />
              <span>You've been signed in successfully.</span>
            </SuccessRow>
            <Sub>Head to the dashboard to continue.</Sub>
            <Button
              variant="primary"
              style={{ width: '100%' }}
              onClick={() => window.location.href = '/'}
            >
              Go to dashboard
            </Button>
          </>
        )}

        {step === 'request' && (
          <>
            <Title>Reset your password</Title>
            <Sub>
              Enter your email and we'll send you a sign-in code.
              Once signed in, you can update your password from your profile.
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
                Send sign-in code
              </Button>
            </form>
            <p style={{ marginTop: theme.spacing.xl, fontSize: theme.fontSizes.sm, textAlign: 'center' }}>
              <Link to="/">← Back to sign in</Link>
            </p>
          </>
        )}

        {step === 'verify' && (
          <>
            <Title>Check your email</Title>
            <Sub>
              We sent a code to <strong>{email}</strong>. Enter it below to sign in.
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
              {error && (
                <ErrorRow>
                  <FiAlertTriangle /> {error}
                </ErrorRow>
              )}
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading || code.length < 6}
                style={{ marginTop: theme.spacing.lg, width: '100%' }}
              >
                Sign in
              </Button>
            </form>
            <p style={{ marginTop: theme.spacing.md, fontSize: theme.fontSizes.sm, textAlign: 'center' }}>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: theme.colors.primary, cursor: 'pointer', fontSize: 'inherit' }}
                onClick={() => { setStep('request'); setCode(''); setError(null); }}
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
