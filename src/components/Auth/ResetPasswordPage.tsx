import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { Button } from '../Common/Button';
import { Input } from '../Common/Input';
import { Card } from '../Common/Card';
import { theme } from '../../styles/theme';
import { getFirebaseAuthErrorMessage } from '../../utils/firebaseAuthErrors';
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

function extractOobCode(searchParams: URLSearchParams, hash: string): string | null {
  let c = searchParams.get('oobCode');
  if (c) return c;
  if (hash) {
    const q = hash.startsWith('#') ? hash.slice(1) : hash;
    try {
      const p = new URLSearchParams(q);
      c = p.get('oobCode');
      if (c) return c;
    } catch {
      /* ignore */
    }
  }
  return null;
}

function tryParseOobFromPasted(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  if (/^[A-Za-z0-9_-]{20,}$/.test(t) && !t.includes('://')) {
    return t;
  }
  try {
    const u = new URL(t);
    return u.searchParams.get('oobCode');
  } catch {
    return null;
  }
}

/**
 * Public route: completes Firebase password reset using `oobCode` from the email link
 * (or pasted). Updates Auth password; Firestore user docs stay as-is.
 */
export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [emailHint, setEmailHint] = useState<string | null>(null);
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [paste, setPaste] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const code = extractOobCode(searchParams, window.location.hash);
    if (!code) {
      return;
    }
    let cancelled = false;
    setVerifying(true);
    setError(null);
    verifyPasswordResetCode(auth, code)
      .then((email) => {
        if (!cancelled) {
          setOobCode(code);
          setEmailHint(email);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('This reset link or code is invalid or has expired. Request a new reset from the sign-in page.');
          setOobCode(null);
        }
      })
      .finally(() => {
        if (!cancelled) setVerifying(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const applyPaste = () => {
    const code = tryParseOobFromPasted(paste);
    if (!code) {
      setError('Could not find a reset code. Paste the full link from your email, or the long code by itself.');
      return;
    }
    setError(null);
    setVerifying(true);
    verifyPasswordResetCode(auth, code)
      .then((email) => {
        setOobCode(code);
        setEmailHint(email);
      })
      .catch(() => {
        setError('Invalid or expired code. Request a new password reset email.');
        setOobCode(null);
      })
      .finally(() => setVerifying(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!oobCode) {
      setError('Missing reset code.');
      return;
    }
    if (pwd.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (pwd !== pwd2) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, pwd);
      setSuccess(true);
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? (err as { code?: string }).code : undefined;
      setError(getFirebaseAuthErrorMessage(code, 'Could not reset password. Request a new email and try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrap>
      <StyledCard>
        <Title>Set a new password</Title>
        <Sub>
          {success
            ? 'Your password has been updated. You can sign in with your new password.'
            : verifying
              ? 'Checking your reset code…'
              : emailHint
                ? `Resetting password for ${emailHint}`
                : 'Open the link in your password-reset email, or paste the full link (or the reset code) below.'}
        </Sub>

        {success ? (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                color: theme.colors.success,
                marginBottom: theme.spacing.lg,
              }}
            >
              <FiCheckCircle size={22} />
              <span>Password updated successfully.</span>
            </div>
            <Link to="/">
              <Button variant="primary" style={{ width: '100%' }}>
                Back to sign in
              </Button>
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            {!emailHint && !verifying && (
              <>
                <label style={{ fontSize: theme.fontSizes.sm, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Paste link or code from email
                </label>
                <textarea
                  value={paste}
                  onChange={(e) => setPaste(e.target.value)}
                  rows={3}
                  placeholder="https://… or paste the long reset code"
                  style={{
                    width: '100%',
                    marginBottom: theme.spacing.md,
                    padding: theme.spacing.md,
                    borderRadius: theme.borderRadius.md,
                    border: `1px solid ${theme.colors.gray300}`,
                    fontSize: theme.fontSizes.sm,
                  }}
                />
                <Button type="button" variant="outline" onClick={applyPaste} disabled={verifying || !paste.trim()}>
                  Continue with pasted link / code
                </Button>
              </>
            )}

            {emailHint && oobCode && (
              <>
                <Input
                  label="New password"
                  type="password"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                />
                <div style={{ marginTop: theme.spacing.md }} />
                <Input
                  label="Confirm new password"
                  type="password"
                  value={pwd2}
                  onChange={(e) => setPwd2(e.target.value)}
                />
              </>
            )}

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  color: '#dc2626',
                  fontSize: theme.fontSizes.sm,
                  marginTop: theme.spacing.md,
                }}
              >
                <FiAlertTriangle />
                {error}
              </div>
            )}

            {emailHint && oobCode && (
              <Button type="submit" variant="primary" loading={loading} disabled={loading || verifying} style={{ marginTop: theme.spacing.lg, width: '100%' }}>
                Update password
              </Button>
            )}

            <p style={{ marginTop: theme.spacing.xl, fontSize: theme.fontSizes.sm, textAlign: 'center' }}>
              <Link to="/">← Back to sign in</Link>
            </p>
          </form>
        )}
      </StyledCard>
    </Wrap>
  );
};
