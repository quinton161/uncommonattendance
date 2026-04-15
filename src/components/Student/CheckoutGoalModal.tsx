import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';
import type { CheckoutGoalReflectionPayload, GoalCheckChoice } from '../../types/checkoutGoalReflection';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10050;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.md};
  box-sizing: border-box;
`;

const Panel = styled.div`
  width: 100%;
  max-width: 480px;
  max-height: min(90vh, 640px);
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius['2xl']};
  box-shadow: ${theme.shadows.lg};
  border: 1px solid ${theme.colors.gray200};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Head = styled.div`
  padding: ${theme.spacing.lg} ${theme.spacing.xl};
  border-bottom: 1px solid ${theme.colors.gray200};
`;

const Title = styled.h2`
  margin: 0;
  font-size: ${theme.fontSizes.xl};
  font-family: ${theme.fonts.heading};
  color: ${theme.colors.textPrimary};
`;

const Sub = styled.p`
  margin: ${theme.spacing.sm} 0 0;
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  line-height: 1.45;
`;

const Body = styled.div`
  padding: ${theme.spacing.lg} ${theme.spacing.xl};
  overflow-y: auto;
  flex: 1;
  min-height: 0;
`;

const SectionLabel = styled.div`
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing.sm};
`;

const ChoiceRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.md};
`;

const ChoiceBtn = styled.button<{ $active: boolean }>`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  border: 2px solid ${(p) => (p.$active ? theme.colors.primary : theme.colors.gray300)};
  background: ${(p) => (p.$active ? 'rgba(0, 82, 204, 0.08)' : theme.colors.white)};
  color: ${theme.colors.textPrimary};
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.medium};
  cursor: pointer;
  font-family: ${theme.fonts.primary};
  &:focus-visible {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 2px;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 72px;
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.gray300};
  border-radius: ${theme.borderRadius.lg};
  font-size: ${theme.fontSizes.sm};
  resize: vertical;
  box-sizing: border-box;
  font-family: ${theme.fonts.primary};
  margin-bottom: ${theme.spacing.md};
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${theme.colors.gray200};
  margin: ${theme.spacing.lg} 0;
`;

const Footer = styled.div`
  padding: ${theme.spacing.md} ${theme.spacing.xl} ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.gray200};
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
  justify-content: flex-end;
`;

const CHOICES: { id: GoalCheckChoice; label: string }[] = [
  { id: 'yes', label: 'Yes' },
  { id: 'no', label: 'No' },
  { id: 'skip', label: 'Prefer not to say' },
];

export interface CheckoutGoalModalProps {
  open: boolean;
  isFriday: boolean;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: (payload: CheckoutGoalReflectionPayload) => void;
}

export const CheckoutGoalModal: React.FC<CheckoutGoalModalProps> = ({
  open,
  isFriday,
  submitting,
  onCancel,
  onConfirm,
}) => {
  const [dailyAchieved, setDailyAchieved] = useState<GoalCheckChoice>('skip');
  const [dailyNote, setDailyNote] = useState('');
  const [weeklyAchieved, setWeeklyAchieved] = useState<GoalCheckChoice>('skip');
  const [weeklyReflection, setWeeklyReflection] = useState('');

  useEffect(() => {
    if (!open) return;
    setDailyAchieved('skip');
    setDailyNote('');
    setWeeklyAchieved('skip');
    setWeeklyReflection('');
  }, [open]);

  if (!open) return null;

  const submit = () => {
    onConfirm({
      dailyAchieved,
      dailyNote,
      weeklyAchieved: isFriday ? weeklyAchieved : 'skip',
      weeklyReflection: isFriday ? weeklyReflection : '',
    });
  };

  return (
    <Overlay role="dialog" aria-modal="true" aria-labelledby="checkout-goal-title">
      <Panel>
        <Head>
          <Title id="checkout-goal-title">Before you check out</Title>
          <Sub>
            You have at least one weekly goal and/or daily goal. Quick reflection (Harare school day); answers are saved
            with today&apos;s check-out.
          </Sub>
        </Head>
        <Body>
          <SectionLabel>Did you achieve your daily goal(s) for today?</SectionLabel>
          <ChoiceRow>
            {CHOICES.map((c) => (
              <ChoiceBtn
                key={c.id}
                type="button"
                $active={dailyAchieved === c.id}
                onClick={() => setDailyAchieved(c.id)}
              >
                {c.label}
              </ChoiceBtn>
            ))}
          </ChoiceRow>
          <SectionLabel style={{ marginTop: theme.spacing.sm }}>Notes (optional)</SectionLabel>
          <TextArea
            value={dailyNote}
            onChange={(e) => setDailyNote(e.target.value)}
            placeholder="Anything you want to remember about today’s goals…"
            maxLength={1500}
            aria-label="Daily goal notes"
          />

          {isFriday && (
            <>
              <Divider />
              <SectionLabel>Weekly goals (Friday)</SectionLabel>
              <Sub style={{ marginBottom: theme.spacing.md }}>
                How did you do on your <strong>weekly</strong> goals this week?
              </Sub>
              <ChoiceRow>
                {CHOICES.map((c) => (
                  <ChoiceBtn
                    key={`w-${c.id}`}
                    type="button"
                    $active={weeklyAchieved === c.id}
                    onClick={() => setWeeklyAchieved(c.id)}
                  >
                    {c.label}
                  </ChoiceBtn>
                ))}
              </ChoiceRow>
              <SectionLabel>Weekly reflection (optional)</SectionLabel>
              <TextArea
                value={weeklyReflection}
                onChange={(e) => setWeeklyReflection(e.target.value)}
                placeholder="What went well this week? What will you focus on next week?"
                maxLength={2000}
                aria-label="Weekly reflection"
              />
            </>
          )}
        </Body>
        <Footer>
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Stay checked in
          </Button>
          <Button type="button" variant="primary" onClick={submit} loading={submitting} disabled={submitting}>
            Check out
          </Button>
        </Footer>
      </Panel>
    </Overlay>
  );
};
