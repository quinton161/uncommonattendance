import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../Common/Button';
import { Card } from '../Common/Card';
import { Input } from '../Common/Input';
import { theme } from '../../styles/theme';
import { fetchHubs, hubLabel, hubTooltip, type Hub, DEFAULT_HUBS } from '../../services/hubService';
import type { HubSelection } from '../../types';
import { FiCheckCircle } from 'react-icons/fi';
import { isUncommonOrgStaffEmail } from '../../constants/staff';

const Wrap = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xl};
  background: ${theme.colors.backgroundSecondary};
`;

const CardWrap = styled.div`
  width: 100%;
  max-width: 480px;
`;

const Title = styled.h1`
  font-family: ${theme.fonts.heading};
  font-size: 1.5rem;
  color: ${theme.colors.textPrimary};
  margin: 0 0 ${theme.spacing.sm};
  text-align: center;
`;

const Sub = styled.p`
  color: ${theme.colors.textSecondary};
  font-size: 0.95rem;
  text-align: center;
  margin-bottom: ${theme.spacing.lg};
`;

const EmailLine = styled.p`
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  text-align: center;
  margin-bottom: ${theme.spacing.lg};
  word-break: break-all;
`;

const RoleToggle = styled.div`
  display: flex;
  background: ${theme.colors.gray100};
  padding: 4px;
  border-radius: 12px;
  margin-bottom: ${theme.spacing.lg};
`;

const RoleButton = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: ${theme.spacing.md};
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${(p) => (p.$active ? theme.colors.white : 'transparent')};
  color: ${(p) => (p.$active ? theme.colors.primary : theme.colors.textSecondary)};
  box-shadow: ${(p) => (p.$active ? '0 2px 8px rgba(0,0,0,0.05)' : 'none')};
`;

const HubLabel = styled.label`
  display: block;
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.semibold};
  margin-bottom: ${theme.spacing.xs};
  color: ${theme.colors.textPrimary};
`;

const HubSelect = styled.select`
  width: 100%;
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.gray300};
  font-size: 1rem;
  margin-bottom: ${theme.spacing.lg};
  background: ${theme.colors.white};
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

/**
 * First-time Google sign-in: no `users/{uid}` document yet — collect role + hub like email registration.
 */
export const GoogleRegisterGate: React.FC = () => {
  const { user, completeGoogleProfile, cancelGoogleRegistration } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [role, setRole] = useState<'student' | 'instructor'>('student');
  const [hubs, setHubs] = useState<Hub[]>(() => [...DEFAULT_HUBS]);
  const [hubId, setHubId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchHubs().then((list) => {
      if (!cancelled) setHubs(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName);
  }, [user?.displayName]);

  if (!user?.needsProfileCompletion) {
    return null;
  }

  const selectedHub = (): HubSelection | undefined => {
    const h = hubs.find((x) => x.id === hubId);
    return h ? { id: h.id, name: h.name } : undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError('');
    const name = displayName.trim();
    if (!name) {
      setError('Please enter your name.');
      return;
    }
    if (!hubId) {
      setError('Please select your hub.');
      return;
    }
    if (role === 'student' && isUncommonOrgStaffEmail(user.email)) {
      setError('Uncommon staff (@uncommon.org) cannot register as students. Choose Instructor.');
      return;
    }

    if (role === 'instructor' && !isUncommonOrgStaffEmail(user.email)) {
      setError('Instructor accounts must use an @uncommon.org Google account.');
      return;
    }
    setSaving(true);
    try {
      const userType = role === 'instructor' ? 'instructor' : 'attendee';
      await completeGoogleProfile(name, userType, selectedHub());
    } catch (err: any) {
      setError(err?.message || 'Could not create your account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Wrap>
      <CardWrap>
        <Card padding="lg">
          <Title>Complete your account</Title>
          <Sub>You signed in with Google. Choose your role and hub so we can finish creating your profile.</Sub>
          <EmailLine>
            <strong>Signed in as</strong> {user.email}
          </EmailLine>

          <form onSubmit={handleSubmit}>
            <Input
              label="Full name"
              name="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your full name"
              required
              fullWidth
            />

            <RoleToggle>
              <RoleButton type="button" $active={role === 'student'} onClick={() => setRole('student')}>
                Student
              </RoleButton>
              <RoleButton type="button" $active={role === 'instructor'} onClick={() => setRole('instructor')}>
                Instructor
              </RoleButton>
            </RoleToggle>

            {role === 'instructor' && (
              <p style={{ fontSize: '0.85rem', color: theme.colors.textSecondary, marginBottom: theme.spacing.md }}>
                <FiCheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Instructor Google accounts must be <strong>@uncommon.org</strong>
              </p>
            )}

            <div>
              <HubLabel htmlFor="google-reg-hub">Your hub</HubLabel>
              <HubSelect
                id="google-reg-hub"
                value={hubId}
                onChange={(e) => {
                  setHubId(e.target.value);
                  if (error) setError('');
                }}
                required
              >
                <option value="">Select hub…</option>
                {hubs.map((h) => (
                  <option key={h.id} value={h.id} title={hubTooltip(h)}>
                    {hubLabel(h)}
                  </option>
                ))}
              </HubSelect>
            </div>

            {error && (
              <p style={{ color: theme.colors.danger, fontSize: theme.fontSizes.sm, marginBottom: theme.spacing.md }}>
                {error}
              </p>
            )}

            <Actions>
              <Button type="submit" variant="primary" fullWidth loading={saving} disabled={saving}>
                Create account
              </Button>
              <Button
                type="button"
                variant="outline"
                fullWidth
                disabled={saving}
                onClick={() => {
                  void cancelGoogleRegistration();
                }}
              >
                Cancel and sign out
              </Button>
            </Actions>
          </form>
        </Card>
      </CardWrap>
    </Wrap>
  );
};
