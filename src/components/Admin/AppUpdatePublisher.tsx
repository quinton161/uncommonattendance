import React, { useState } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';
import { publishAppUpdate } from '../../services/appUpdateService';
import { uniqueToast } from '../../utils/toastUtils';

const Card = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius['2xl']};
  padding: ${theme.spacing.xl};
  border: 1px solid ${theme.colors.gray200};
  box-shadow: ${theme.shadows.sm};
`;

const Title = styled.h3`
  margin: 0 0 ${theme.spacing.sm};
  font-size: ${theme.fontSizes.lg};
  color: ${theme.colors.textPrimary};
  font-family: ${theme.fonts.heading};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const Hint = styled.p`
  margin: 0 0 ${theme.spacing.lg};
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  line-height: 1.5;
`;

const Field = styled.div`
  margin-bottom: ${theme.spacing.md};
`;

const Label = styled.label`
  display: block;
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing.xs};
`;

const Input = styled.input`
  width: 100%;
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.gray300};
  border-radius: ${theme.borderRadius.lg};
  font-size: ${theme.fontSizes.sm};
  box-sizing: border-box;
  font-family: ${theme.fonts.primary};
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.gray300};
  border-radius: ${theme.borderRadius.lg};
  font-size: ${theme.fontSizes.sm};
  resize: vertical;
  box-sizing: border-box;
  font-family: ${theme.fonts.primary};
`;

/** Admin-only: broadcast a user-facing “what’s new” message to everyone signed in */
export const AppUpdatePublisher: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      uniqueToast.error('Add a short headline and a message for users.');
      return;
    }
    setSaving(true);
    try {
      await publishAppUpdate({ title: title.trim(), message: message.trim() });
      uniqueToast.success('Sent. Everyone signed in will see this update on screen.');
      setTitle('');
      setMessage('');
    } catch (err) {
      uniqueToast.error(err instanceof Error ? err.message : 'Could not send this update.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <Title>What&apos;s new for everyone</Title>
      <Hint>
        Describe what <strong>students and staff will see or use</strong> in the app—today&apos;s improvements to
        attendance, check-in, goals, dashboards, or buttons. Write in plain language. Do <strong>not</strong> mention
        databases, servers, Firebase, APIs, or other technical internals; users only need to know what changed for
        them on screen.
      </Hint>
      <form onSubmit={handleSubmit}>
        <Field>
          <Label htmlFor="app-update-title">Short headline</Label>
          <Input
            id="app-update-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Easier hub filter on your dashboard"
            maxLength={120}
            autoComplete="off"
          />
        </Field>
        <Field>
          <Label htmlFor="app-update-body">What users will notice</Label>
          <TextArea
            id="app-update-body"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. You can pick your hub from the menu at the top of the dashboard so attendance and goals only show your site. Check-in works the same way as before."
            maxLength={2000}
          />
        </Field>
        <Button type="submit" variant="primary" loading={saving} disabled={saving}>
          Send update to everyone
        </Button>
      </form>
    </Card>
  );
};
