import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import type { User } from '../../types';
import {
  fetchHubs,
  hubLabel,
  hubTooltip,
  instructorAssignedHubId,
  resolvedHubLabel,
  type Hub,
  DEFAULT_HUBS,
} from '../../services/hubService';

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
  min-width: 220px;
  max-width: 100%;
`;

const Label = styled.label`
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textSecondary};
`;

const Select = styled.select`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.gray300};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSizes.sm};
  background: ${theme.colors.white};
  min-height: 40px;
  color: ${theme.colors.textPrimary};
`;

const ReadOnlyHub = styled.div`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.gray300};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSizes.sm};
  background: ${theme.colors.gray50};
  color: ${theme.colors.textPrimary};
  min-height: 40px;
  display: flex;
  align-items: center;
`;

export interface AdminHubScopeSelectProps {
  user: User | null;
  value: string;
  onChange: (hubId: string) => void;
  id?: string;
  label?: string;
}

/** Admins: filter one hub or all. Instructors: assigned hub only (read-only). */
export function AdminHubScopeSelect({
  user,
  value,
  onChange,
  id = 'admin-hub-scope',
  label = 'Hub',
}: AdminHubScopeSelectProps): React.ReactElement | null {
  const [hubs, setHubs] = useState<Hub[]>(() => [...DEFAULT_HUBS]);

  useEffect(() => {
    let cancelled = false;
    fetchHubs().then((list) => {
      if (!cancelled) setHubs(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (user?.userType !== 'admin' && user?.userType !== 'instructor') return null;

  if (user.userType === 'instructor') {
    const hubId = instructorAssignedHubId(user);
    const hub = hubs.find((h) => h.id === hubId);
    return (
      <Wrap>
        <Label htmlFor={id}>{label}</Label>
        <ReadOnlyHub id={id} title={hub ? hubTooltip(hub) : undefined}>
          {hub ? hubLabel(hub) : resolvedHubLabel({ hubId })}
        </ReadOnlyHub>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <Label htmlFor={id}>{label}</Label>
      <Select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${label}: filter by hub or all hubs`}
      >
        <option value="">All hubs</option>
        {hubs.map((h) => (
          <option key={h.id} value={h.id} title={hubTooltip(h)}>
            {hubLabel(h)}
          </option>
        ))}
      </Select>
    </Wrap>
  );
}
