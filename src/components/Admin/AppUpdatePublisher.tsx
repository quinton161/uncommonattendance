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

/** Admin-only: publish a broadcast update; all signed-in users get a real-time toast */
export const AppUpdatePublisher: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      uniqueToast.error('Enter a title and message.');
      return;
    }
    setSaving(true);
    try {
      await publishAppUpdate({ title: title.trim(), message: message.trim() });
      uniqueToast.success('Update published. Users will see the scrollable note the next time they open the app.');
      setTitle('');
      setMessage('');
    } catch (err) {
      uniqueToast.error(err instanceof Error ? err.message : 'Could not publish update.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <Title>Notify all users</Title>
      <Hint>
        Saves to Firebase. When someone opens the app and hasn&apos;t seen this version yet, they get a full-screen
        scrollable note (not a small toast) with this title and message until they tap <strong>Got it</strong>. Each
        publish bumps the version so everyone sees the new note once.
      </Hint>
      <form onSubmit={handleSubmit}>
        <Field>
          <Label htmlFor="app-update-title">Title</Label>
          <Input
            id="app-update-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. New attendance report"
            maxLength={120}
            autoComplete="off"
          />
        </Field>
        <Field>
          <Label htmlFor="app-update-body">Message</Label>
          <TextArea
            id="app-update-body"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What changed or what users should know…"
            maxLength={2000}
          />
        </Field>
        <Button type="submit" variant="primary" loading={saving} disabled={saving}>
          Publish update
        </Button>
      </form>
    </Card>
  );
};
