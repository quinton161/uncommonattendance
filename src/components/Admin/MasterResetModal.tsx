import React, { useState } from 'react';
import { FiAlertTriangle, FiRefreshCw, FiUsers, FiCheckCircle } from 'react-icons/fi';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: ${theme.spacing.lg};
`;

const ModalContent = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.xl};
  width: 100%;
  max-width: 500px;
  box-shadow: ${theme.shadows.xl};
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
`;

const IconContainer = styled.div<{ $danger?: boolean }>`
  width: 56px;
  height: 56px;
  border-radius: ${theme.borderRadius.full};
  background: ${props => props.$danger ? 'rgba(220, 38, 38, 0.1)' : 'rgba(59, 130, 246, 0.1)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$danger ? '#dc2626' : '#3b82f6'};
`;

const ModalTitle = styled.h2`
  font-family: ${theme.fonts.heading};
  font-size: ${theme.fontSizes.xl};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.textPrimary};
  margin: 0;
`;

const ModalDescription = styled.p`
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.base};
  line-height: 1.6;
  margin: 0 0 ${theme.spacing.lg} 0;
`;

const WarningBox = styled.div`
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  
  ul {
    margin: ${theme.spacing.sm} 0 0 0;
    padding-left: ${theme.spacing.lg};
    color: #dc2626;
    font-size: ${theme.fontSizes.sm};
    
    li {
      margin-bottom: ${theme.spacing.xs};
    }
  }
`;

const InfoBox = styled.div`
  background: ${theme.colors.gray50};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing.sm} 0;
  border-bottom: 1px solid ${theme.colors.gray200};
  
  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.sm};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const InfoValue = styled.span<{ $preserve?: boolean }>`
  font-weight: ${theme.fontWeights.medium};
  color: ${props => props.$preserve ? '#16a34a' : theme.colors.textPrimary};
  font-size: ${theme.fontSizes.sm};
`;

const ConfirmInput = styled.input`
  width: 100%;
  padding: ${theme.spacing.md};
  border: 2px solid ${theme.colors.gray300};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSizes.base};
  margin-bottom: ${theme.spacing.lg};
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
  
  &::placeholder {
    color: ${theme.colors.gray400};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  justify-content: flex-end;
`;

const DangerButton = styled(Button)`
  background: #dc2626;
  border-color: #dc2626;
  
  &:hover {
    background: #b91c1c;
    border-color: #b91c1c;
  }
  
  &:disabled {
    background: #fca5a5;
    border-color: #fca5a5;
    cursor: not-allowed;
  }
`;

interface MasterResetModalProps {
  onClose: () => void;
  onConfirm: () => Promise<void>;
  userCount?: number;
  attendanceCount?: number;
}

export const MasterResetModal: React.FC<MasterResetModalProps> = ({ 
  onClose, 
  onConfirm,
  userCount = 0,
  attendanceCount = 0
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const isConfirmValid = confirmText.toLowerCase() === 'reset';

  const handleReset = async () => {
    if (!isConfirmValid) return;
    
    setLoading(true);
    try {
      await onConfirm();
      // Immediately reload the page to fetch fresh data from Firebase
      window.location.reload();
    } catch (error) {
      console.error('Master reset error:', error);
      setLoading(false);
    }
  };

  return (
    <ModalOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <ModalContent>
        <ModalHeader>
          <IconContainer $danger>
            <FiRefreshCw size={28} />
          </IconContainer>
          <div>
            <ModalTitle>Master Reset</ModalTitle>
          </div>
        </ModalHeader>

        <ModalDescription>
          This is a <strong>dangerous operation</strong> that will permanently delete all attendees and attendance records. This action cannot be undone.
        </ModalDescription>

        <WarningBox>
          <strong>Warning: The following will be PERMANENTLY DELETED:</strong>
          <ul>
            <li>All attendee/student accounts</li>
            <li>All attendance records (check-ins/check-outs)</li>
            <li>All event registrations</li>
            <li>All conversation history</li>
          </ul>
        </WarningBox>

        <InfoBox>
          <InfoRow>
            <InfoLabel><FiUsers size={16} /> Attendees to Delete</InfoLabel>
            <InfoValue>{userCount}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel><FiAlertTriangle size={16} /> Attendance Records</InfoLabel>
            <InfoValue>All</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel><FiCheckCircle size={16} /> Preserved</InfoLabel>
            <InfoValue $preserve>Admin (quintonndlovu161@gmail.com)</InfoValue>
          </InfoRow>
        </InfoBox>

        <ModalDescription style={{ marginBottom: theme.spacing.sm }}>
          Type <strong>"reset"</strong> to confirm:
        </ModalDescription>
        
        <ConfirmInput
          type="text"
          placeholder="Type 'reset' to confirm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          autoComplete="off"
        />

        <ButtonGroup>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <DangerButton 
            onClick={handleReset}
            disabled={!isConfirmValid || loading}
          >
            {loading ? 'Resetting...' : 'Execute Master Reset'}
          </DangerButton>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
};
