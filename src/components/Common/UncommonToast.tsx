import React from 'react';
import styled, { keyframes } from 'styled-components';
import { AlertTriangle, Check, Info, X } from 'lucide-react';

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(10px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const Card = styled.div<{ $variant: 'success' | 'error' | 'info' | 'warning' }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 380px;
  margin: 0 auto;
  padding: 12px 16px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid ${(p) =>
    p.$variant === 'success' ? '#d1fae5' :
    p.$variant === 'error' ? '#fecaca' :
    p.$variant === 'warning' ? '#fef3c7' :
    '#bfdbfe'};
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.02);
  animation: ${slideIn} 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'Chillax', 'Inter', sans-serif;
`;

const IconBox = styled.div<{ $variant: 'success' | 'error' | 'info' | 'warning' }>`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${(p) =>
    p.$variant === 'success' ? '#d1fae5' :
    p.$variant === 'error' ? '#fecaca' :
    p.$variant === 'warning' ? '#fef3c7' :
    '#bfdbfe'};
  color: ${(p) =>
    p.$variant === 'success' ? '#059669' :
    p.$variant === 'error' ? '#dc2626' :
    p.$variant === 'warning' ? '#d97706' :
    '#0052CC'};
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
`;

const LabelText = styled.p<{ $variant: 'success' | 'error' | 'info' | 'warning' }>`
  margin: 0 0 1px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${(p) =>
    p.$variant === 'success' ? '#059669' :
    p.$variant === 'error' ? '#dc2626' :
    p.$variant === 'warning' ? '#d97706' :
    '#0052CC'};
`;

const Msg = styled.p`
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
`;

export type UncommonToastVariant = 'success' | 'error' | 'info' | 'warning';

const LABELS: Record<UncommonToastVariant, string> = {
  success: 'Success',
  error: 'Error',
  info: 'Notice',
  warning: 'Heads up',
};

function iconFor(variant: UncommonToastVariant) {
  const s = 16;
  switch (variant) {
    case 'success':
      return <Check size={s} strokeWidth={2.5} />;
    case 'error':
      return <X size={s} strokeWidth={2.5} />;
    case 'warning':
      return <AlertTriangle size={s} strokeWidth={2.5} />;
    default:
      return <Info size={s} strokeWidth={2.5} />;
  }
}

export interface UncommonToastBodyProps {
  variant: UncommonToastVariant;
  message: string;
  labelOverride?: string;
}

export const UncommonToastBody: React.FC<UncommonToastBodyProps> = ({ variant, message, labelOverride }) => (
  <Card $variant={variant} role="status" aria-live="polite">
    <IconBox $variant={variant}>{iconFor(variant)}</IconBox>
    <Content>
      <LabelText $variant={variant}>{labelOverride ?? LABELS[variant]}</LabelText>
      <Msg>{message}</Msg>
    </Content>
  </Card>
);
