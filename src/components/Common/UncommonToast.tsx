import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import confetti from 'canvas-confetti';
import { AlertTriangle, Check, Info, X } from 'lucide-react';
import { theme } from '../../styles/theme';

const floatIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const Card = styled.div<{ $variant: 'success' | 'error' | 'info' | 'warning' }>`
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: ${theme.spacing.xl} 2.75rem ${theme.spacing.lg} ${theme.spacing.xl};
  border-radius: ${theme.borderRadius['3xl']};
  background: #2d2d2d;
  color: ${theme.colors.white};
  text-align: center;
  font-family: ${theme.fonts.primary};
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.06),
    0 24px 48px rgba(0, 0, 0, 0.45),
    ${(p) =>
      p.$variant === 'success'
        ? '0 0 48px rgba(39, 174, 96, 0.22)'
        : p.$variant === 'error'
          ? '0 0 48px rgba(231, 76, 60, 0.18)'
          : p.$variant === 'warning'
            ? '0 0 48px rgba(243, 156, 18, 0.2)'
            : '0 0 48px rgba(0, 82, 204, 0.15)'};
  animation: ${floatIn} 0.38s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
`;

const IconWrap = styled.div<{ $variant: 'success' | 'error' | 'info' | 'warning' }>`
  width: 56px;
  height: 56px;
  margin: 0 auto ${theme.spacing.md};
  border-radius: ${theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(p) =>
    p.$variant === 'success'
      ? theme.colors.success
      : p.$variant === 'error'
        ? theme.colors.danger
        : p.$variant === 'warning'
          ? theme.colors.warning
          : theme.colors.primary};
  color: ${theme.colors.white};
  box-shadow: ${(p) =>
    p.$variant === 'success'
      ? '0 0 0 4px rgba(39, 174, 96, 0.25), 0 8px 24px rgba(39, 174, 96, 0.35)'
      : p.$variant === 'error'
        ? '0 0 0 4px rgba(231, 76, 60, 0.2), 0 8px 24px rgba(231, 76, 60, 0.3)'
        : p.$variant === 'warning'
          ? '0 0 0 4px rgba(243, 156, 18, 0.2), 0 8px 24px rgba(243, 156, 18, 0.2)'
          : '0 0 0 4px rgba(0, 82, 204, 0.2), 0 8px 24px rgba(0, 82, 204, 0.25)'};
`;

const MessageText = styled.p`
  margin: 0;
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.medium};
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.92);
  white-space: pre-wrap;
  word-break: break-word;
`;

const Label = styled.span<{ $variant: 'success' | 'error' | 'info' | 'warning' }>`
  display: block;
  margin-bottom: ${theme.spacing.xs};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.semibold};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${(p) =>
    p.$variant === 'success'
      ? 'rgba(39, 174, 96, 0.95)'
      : p.$variant === 'error'
        ? 'rgba(231, 76, 60, 0.95)'
        : p.$variant === 'warning'
          ? 'rgba(243, 156, 18, 0.95)'
          : 'rgba(100, 180, 255, 0.95)'};
`;

export type UncommonToastVariant = 'success' | 'error' | 'info' | 'warning';

const LABELS: Record<UncommonToastVariant, string> = {
  success: 'Success',
  error: 'Error',
  info: 'Notice',
  warning: 'Heads up',
};

function iconFor(variant: UncommonToastVariant) {
  switch (variant) {
    case 'success':
      return <Check size={28} strokeWidth={2.5} aria-hidden />;
    case 'error':
      return <X size={26} strokeWidth={2.5} aria-hidden />;
    case 'warning':
      return <AlertTriangle size={26} strokeWidth={2.5} aria-hidden />;
    default:
      return <Info size={26} strokeWidth={2.5} aria-hidden />;
  }
}

export interface UncommonToastBodyProps {
  variant: UncommonToastVariant;
  message: string;
  /** Replaces the default uppercase label (e.g. app announcements) */
  labelOverride?: string;
}

export const UncommonToastBody: React.FC<UncommonToastBodyProps> = ({ variant, message, labelOverride }) => {
  useEffect(() => {
    if (variant !== 'success') return;
    const id = window.requestAnimationFrame(() => {
      confetti({
        particleCount: 55,
        spread: 62,
        startVelocity: 28,
        origin: { x: 0.5, y: 0.14 },
        colors: ['#27ae60', '#ffffff', '#0052CC', '#2684ff', '#6bcf7f'],
        ticks: 140,
        gravity: 0.95,
        scalar: 0.95,
        zIndex: 99999,
      });
    });
    return () => window.cancelAnimationFrame(id);
  }, [variant]);

  return (
    <Card $variant={variant} role="status" aria-live="polite">
      <IconWrap $variant={variant}>{iconFor(variant)}</IconWrap>
      <Label $variant={variant}>{labelOverride ?? LABELS[variant]}</Label>
      <MessageText>{message}</MessageText>
    </Card>
  );
};
