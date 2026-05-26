import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { Button } from './Button';
import type { AppUpdateDoc } from '../../types/appUpdate';
import {
  getLastSeenAppUpdateSeq,
  setLastSeenAppUpdateSeq,
  subscribeToAppUpdate,
} from '../../services/appUpdateService';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 99990;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.md};
  box-sizing: border-box;
`;

const Panel = styled.div`
  width: 100%;
  max-width: 520px;
  max-height: min(85vh, 720px);
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius['2xl']};
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.22);
  border: 1px solid ${theme.colors.gray200};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const PanelHeader = styled.div`
  flex-shrink: 0;
  padding: ${theme.spacing.lg} ${theme.spacing.xl};
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%);
  color: ${theme.colors.white};
`;

const Eyebrow = styled.p`
  margin: 0 0 ${theme.spacing.xs};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.semibold};
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.9;
`;

const Title = styled.h2`
  margin: 0;
  font-size: ${theme.fontSizes.xl};
  font-family: ${theme.fonts.heading};
  font-weight: ${theme.fontWeights.bold};
  line-height: 1.25;
`;

const ScrollRegion = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: ${theme.spacing.xl};
  -webkit-overflow-scrolling: touch;
`;

const Message = styled.div`
  font-size: ${theme.fontSizes.sm};
  line-height: 1.65;
  color: ${theme.colors.textPrimary};
  white-space: pre-wrap;
  word-break: break-word;
`;

const PanelFooter = styled.div`
  flex-shrink: 0;
  padding: ${theme.spacing.md} ${theme.spacing.xl} ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.gray200};
  display: flex;
  justify-content: flex-end;
`;

/**
 * Listens to `system_config/app_update`. When `seq` is newer than the user’s last-dismissed
 * value (localStorage), shows a scrollable in-app note on load—not a toast—until they tap Got it.
 */
export const AppUpdateNotifier: React.FC = () => {
  const { user, loading } = useAuth();
  const [payload, setPayload] = useState<AppUpdateDoc | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading || !user) return;

    const unsub = subscribeToAppUpdate((data, err) => {
      if (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[AppUpdateNotifier]', err.message);
        }
        return;
      }
      if (!data || !data.seq) {
        setPayload(null);
        setOpen(false);
        return;
      }

      const lastSeen = getLastSeenAppUpdateSeq();
      if (data.seq <= lastSeen) {
        setPayload(null);
        setOpen(false);
        return;
      }

      setPayload(data);
      setOpen(true);
    });

    return () => unsub();
  }, [user, loading]);

  const dismiss = useCallback(() => {
    if (payload?.seq) {
      setLastSeenAppUpdateSeq(payload.seq);
    }
    setOpen(false);
    setPayload(null);
  }, [payload]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !payload) return null;

  return (
    <Overlay role="dialog" aria-modal="true" aria-labelledby="app-update-title">
      <Panel>
        <PanelHeader>
          <Eyebrow>New in Uncommon Attendance</Eyebrow>
          <Title id="app-update-title">{payload.title}</Title>
        </PanelHeader>
        <ScrollRegion tabIndex={0}>
          <Message>{payload.message}</Message>
        </ScrollRegion>
        <PanelFooter>
          <Button type="button" variant="primary" onClick={dismiss}>
            Got it
          </Button>
        </PanelFooter>
      </Panel>
    </Overlay>
  );
};
