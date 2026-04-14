import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';
import type { AbsenceReason } from '../../types';
import { AttendanceService } from '../../services/attendanceService';
import { uniqueToast } from '../../utils/toastUtils';

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

const Select = styled.select`
  width: 100%;
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.gray300};
  font-size: ${theme.fontSizes.sm};
  margin-bottom: ${theme.spacing.lg};
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 88px;
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.gray300};
  font-size: ${theme.fontSizes.sm};
  resize: vertical;
  margin-bottom: ${theme.spacing.lg};
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.sm};
`;

export interface AbsenceRecordModalProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  dateStr: string;
  hubId?: string;
  recordedByUid: string;
  recordedByName: string;
  initialReason?: AbsenceReason | '';
  initialNotes?: string;
  onSaved: () => void;
}

const REASONS: { value: AbsenceReason; label: string }[] = [
  { value: 'excused', label: 'Excused — student communicated the reason' },
  { value: 'unexcused', label: 'Unexcused — student did not communicate the reason' },
  { value: 'dropout', label: 'Dropout — student has left the program' },
];

export const AbsenceRecordModal: React.FC<AbsenceRecordModalProps> = ({
  open,
  onClose,
  studentId,
  studentName,
  dateStr,
  hubId,
  recordedByUid,
  recordedByName,
  initialReason,
  initialNotes,
  onSaved,
}) => {
  const [reason, setReason] = useState<AbsenceReason | ''>('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReason(initialReason && REASONS.some((r) => r.value === initialReason) ? initialReason : '');
    setNotes(initialNotes || '');
  }, [open, initialReason, initialNotes]);

  if (!open) return null;

  const handleSave = async () => {
    if (!reason) {
      uniqueToast.error('Select an absence reason.');
      return;
    }
    setSaving(true);
    try {
      await AttendanceService.getInstance().recordStaffAbsent({
        studentId,
        studentName,
        date: dateStr,
        hubId,
        absenceReason: reason as AbsenceReason,
        absenceNotes: notes,
        recordedByUid,
        recordedByName,
      });
      uniqueToast.success('Absence record saved.');
      onSaved();
      onClose();
    } catch (e: any) {
      console.error(e);
      uniqueToast.error(e?.message || 'Could not save absence record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Overlay role="dialog" aria-modal="true" aria-labelledby="absence-modal-title" onClick={onClose}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <Title id="absence-modal-title">Record absence</Title>
        <Sub>
          <strong>{studentName}</strong> · {dateStr}
        </Sub>
        <Label htmlFor="absence-reason">Absence reason (required)</Label>
        <Select
          id="absence-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value as AbsenceReason | '')}
        >
          <option value="">Select…</option>
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
        <Label htmlFor="absence-notes">Notes (optional)</Label>
        <TextArea
          id="absence-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional context for coordinators…"
        />
        <Actions>
          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={handleSave} loading={saving} disabled={saving}>
            Save
          </Button>
        </Actions>
      </Panel>
    </Overlay>
  );
};
