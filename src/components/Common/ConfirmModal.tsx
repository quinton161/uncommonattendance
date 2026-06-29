import React, { useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { AlertTriangle, X } from 'lucide-react';

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const slideIn = keyframes`
  from { transform: scale(0.92) translateY(12px); opacity: 0; }
  to   { transform: scale(1) translateY(0);       opacity: 1; }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100000;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: ${fadeIn} 0.2s ease;
`;

const Modal = styled.div`
  background: #fff;
  border-radius: 20px;
  padding: 32px 28px 24px;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
  animation: ${slideIn} 0.25s ease;
  position: relative;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  &:hover { background: #e5e7eb; }
`;

const IconWrap = styled.div<{ $danger?: boolean }>`
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: ${({ $danger }) => ($danger ? '#fef2f2' : '#fffbeb')};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin: 0 0 8px;
`;

const Message = styled.p`
  font-size: 14px;
  color: #4b5563;
  text-align: center;
  line-height: 1.6;
  margin: 0 0 24px;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 10px;
`;

const CancelBtn = styled.button`
  flex: 1;
  padding: 12px 0;
  border-radius: 12px;
  border: 1.5px solid #e5e7eb;
  background: #fff;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #f9fafb; }
`;

const ConfirmBtn = styled.button<{ $danger?: boolean }>`
  flex: 1;
  padding: 12px 0;
  border-radius: 12px;
  border: none;
  background: ${({ $danger }) =>
    $danger
      ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
      : 'linear-gradient(135deg, #0052CC, #003D99)'};
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  &:hover { opacity: 0.88; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export interface ConfirmModalProps {
  /** Modal title */
  title: string;
  /** Descriptive message explaining what will happen */
  message: string;
  /** Label for the confirm button (default: "Confirm") */
  confirmLabel?: string;
  /** If true, confirm button is styled red */
  danger?: boolean;
  /** Called when the user confirms */
  onConfirm: () => void | Promise<void>;
  /** Called when the user cancels (also fired on overlay / ESC click) */
  onCancel: () => void;
  /** Show a loading spinner inside confirm button while true */
  loading?: boolean;
}

/**
 * Generic confirmation modal for destructive or important admin actions.
 * Usage:
 *   <ConfirmModal
 *     title="Delete John Doe?"
 *     message="This will permanently remove their account and all attendance records."
 *     confirmLabel="Delete"
 *     danger
 *     onConfirm={handleDelete}
 *     onCancel={() => setShowConfirm(false)}
 *   />
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Auto-focus the confirm button on open; trap ESC
  useEffect(() => {
    confirmRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <Overlay onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <Modal onClick={(e) => e.stopPropagation()}>
        <CloseBtn onClick={onCancel} aria-label="Close">
          <X size={16} />
        </CloseBtn>
        <IconWrap $danger={danger}>
          <AlertTriangle size={26} color={danger ? '#dc2626' : '#d97706'} />
        </IconWrap>
        <Title id="confirm-title">{title}</Title>
        <Message>{message}</Message>
        <ButtonRow>
          <CancelBtn onClick={onCancel} disabled={loading}>
            Cancel
          </CancelBtn>
          <ConfirmBtn
            ref={confirmRef}
            $danger={danger}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </ConfirmBtn>
        </ButtonRow>
      </Modal>
    </Overlay>
  );
};
