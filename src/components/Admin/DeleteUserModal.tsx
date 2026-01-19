import React, { useState } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';
import { PersonIcon } from '../Common/Icons';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${theme.spacing.lg};
`;

const ModalContent = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.xl};
  width: 100%;
  max-width: 450px;
  box-shadow: ${theme.shadows.xl};
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
`;

const IconContainer = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${theme.borderRadius.full};
  background: rgba(239, 68, 68, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dc2626;
`;

const ModalTitle = styled.h2`
  font-family: ${theme.fonts.heading};
  font-size: ${theme.fontSizes.xl};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textPrimary};
  margin: 0;
`;

const ModalDescription = styled.p`
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.base};
  line-height: 1.5;
  margin: 0 0 ${theme.spacing.lg} 0;
`;

const UserInfo = styled.div`
  background: ${theme.colors.gray50};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${theme.borderRadius.full};
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryLight} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.white};
  font-weight: ${theme.fontWeights.semibold};
  font-size: ${theme.fontSizes.sm};
`;

const UserDetails = styled.div`
  h4 {
    margin: 0 0 ${theme.spacing.xs} 0;
    font-size: ${theme.fontSizes.base};
    font-weight: ${theme.fontWeights.medium};
    color: ${theme.colors.textPrimary};
  }
  
  p {
    margin: 0;
    font-size: ${theme.fontSizes.sm};
    color: ${theme.colors.textSecondary};
  }
`;

const WarningBox = styled.div`
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  
  p {
    margin: 0;
    font-size: ${theme.fontSizes.sm};
    color: #d97706;
    font-weight: ${theme.fontWeights.medium};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  justify-content: flex-end;
`;

const DeleteButton = styled(Button)`
  background: #dc2626;
  border-color: #dc2626;
  
  &:hover {
    background: #b91c1c;
    border-color: #b91c1c;
  }
  
  &:disabled {
    background: #fca5a5;
    border-color: #fca5a5;
  }
`;

interface DeleteUserModalProps {
  user: any;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ user, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <ModalOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <ModalContent>
        <ModalHeader>
          <IconContainer>
            <PersonIcon size={24} />
          </IconContainer>
          <div>
            <ModalTitle>Delete User</ModalTitle>
          </div>
        </ModalHeader>

        <ModalDescription>
          Are you sure you want to delete this user? This action cannot be undone.
        </ModalDescription>

        <UserInfo>
          <UserAvatar>
            {user.photoUrl ? (
              <img 
                src={user.photoUrl} 
                alt={user.displayName} 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              getInitials(user.displayName || 'Unknown')
            )}
          </UserAvatar>
          <UserDetails>
            <h4>{user.displayName || 'Unknown User'}</h4>
            <p>{user.email}</p>
            <p style={{ textTransform: 'capitalize', color: theme.colors.primary }}>
              {user.userType}
            </p>
          </UserDetails>
        </UserInfo>

        <WarningBox>
          <p>
            ⚠️ This will mark the user as deleted and remove their access to the system. 
            Their attendance records will be preserved for historical purposes.
          </p>
        </WarningBox>

        <ButtonGroup>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <DeleteButton 
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete User'}
          </DeleteButton>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
};
