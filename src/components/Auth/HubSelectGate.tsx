import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../Common/Button';
import { Card } from '../Common/Card';
import { theme } from '../../styles/theme';
import { fetchHubs, hubLabel, hubTooltip, type Hub, DEFAULT_HUBS } from '../../services/hubService';
import { uniqueToast } from '../../utils/toastUtils';

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
  max-width: 420px;
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

const Select = styled.select`
  width: 100%;
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.gray300};
  font-size: 1rem;
  margin-bottom: ${theme.spacing.lg};
  background: ${theme.colors.white};
`;

/**
 * Shown when a student/instructor account has no `hubId` yet (e.g. legacy user).
 */
export const HubSelectGate: React.FC = () => {
  const { setHub } = useAuth();
  const [hubs, setHubs] = useState<Hub[]>(() => [...DEFAULT_HUBS]);
  const [hubId, setHubId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchHubs().then((list) => {
      if (!cancelled) setHubs(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleContinue = async () => {
    const h = hubs.find((x) => x.id === hubId);
    if (!h) {
      uniqueToast.error('Please select your hub.');
      return;
    }
    setLoading(true);
    try {
      await setHub({ id: h.id, name: h.name });
      uniqueToast.success(`Hub set: ${hubLabel(h)}`);
    } catch (e) {
      console.error(e);
      uniqueToast.error('Could not save hub. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrap>
      <CardWrap>
      <Card padding="lg">
        <Title>Select your hub</Title>
        <Sub>Choose the Uncommon hub you belong to so attendance stays scoped correctly.</Sub>
        <Select value={hubId} onChange={(e) => setHubId(e.target.value)} aria-label="Hub">
          <option value="">— Choose hub —</option>
          {hubs.map((h) => (
            <option key={h.id} value={h.id} title={hubTooltip(h)}>
              {hubLabel(h)}
            </option>
          ))}
        </Select>
        <Button
          variant="primary"
          fullWidth
          loading={loading}
          disabled={loading || !hubId}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </Card>
      </CardWrap>
    </Wrap>
  );
};
