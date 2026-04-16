import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';
import { AttendanceService } from '../../services/attendanceService';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${theme.zIndex.modal};
  padding: ${theme.spacing.lg};
`;

const Panel = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.lg};
  max-width: 440px;
  width: 100%;
  padding: ${theme.spacing.xl};
`;

const Title = styled.h3`
  margin: 0 0 ${theme.spacing.sm};
  font-family: ${theme.fonts.heading};
  font-size: ${theme.fontSizes.xl};
  color: ${theme.colors.textPrimary};
`;

const Sub = styled.p`
  margin: 0 0 ${theme.spacing.lg};
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
`;

const Label = styled.label`
  display: block;
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing.xs};
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.gray300};
  font-size: ${theme.fontSizes.sm};
  resize: vertical;
  margin-bottom: ${theme.spacing.sm};
`;

const Hint = styled.p`
  margin: 0 0 ${theme.spacing.lg};
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.textSecondary};
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.sm};
`;

export interface CheckInDailyGoalModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (goal: string) => void | Promise<void>;
  minChars?: number;
}

export const CheckInDailyGoalModal: React.FC<CheckInDailyGoalModalProps> = ({
  open,
  onClose,
  onSubmit,
  minChars = AttendanceService.CHECK_IN_GOAL_MIN_LEN,
}) => {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setText('');
  }, [open]);

  if (!open) return null;

  const trimmed = text.trim();
  const valid = trimmed.length >= minChars;

  const handleSubmit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Overlay
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkin-goal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <Panel onClick={(e) => e.stopPropagation()}>
        <Title id="checkin-goal-title">Today&apos;s goal</Title>
        <Sub>
          What do you want to focus on or achieve today? It is saved here and on your Goals page under
          this week&apos;s daily goals (we create the week if needed).
        </Sub>
        <Label htmlFor="checkin-daily-goal">Your goal for today (required)</Label>
        <TextArea
          id="checkin-daily-goal"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Finish module 2 exercises, ask two questions in class…"
          autoFocus
        />
        <Hint>
          At least {minChars} characters ({trimmed.length}/{minChars}).
        </Hint>
        <Actions>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => void handleSubmit()}
            disabled={!valid || submitting}
          >
            {submitting ? 'Checking in…' : 'Continue check-in'}
          </Button>
        </Actions>
      </Panel>
    </Overlay>
  );
};
