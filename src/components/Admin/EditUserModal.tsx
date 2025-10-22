import React, { useState } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';
import { PersonIcon, CheckCircleIcon } from '../Common/Icons';

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
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: ${theme.shadows.xl};
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.xl};
  padding-bottom: ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.gray200};
`;

const ModalTitle = styled.h2`
  font-family: ${theme.fonts.heading};
  font-size: ${theme.fontSizes['2xl']};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textPrimary};
  margin: 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

const Label = styled.label`
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.textPrimary};
  font-family: ${theme.fonts.primary};
`;

const Input = styled.input`
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.gray300};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSizes.base};
  font-family: ${theme.fonts.primary};
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
  }
  
  &:disabled {
    background: ${theme.colors.gray100};
    color: ${theme.colors.textSecondary};
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.gray300};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSizes.base};
  font-family: ${theme.fonts.primary};
  background: ${theme.colors.white};
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
  }
`;

const TextArea = styled.textarea`
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.gray300};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSizes.base};
  font-family: ${theme.fonts.primary};
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  justify-content: flex-end;
  margin-top: ${theme.spacing.lg};
  padding-top: ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.gray200};
`;

const UserAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${theme.borderRadius.full};
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryLight} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.white};
  font-weight: ${theme.fontWeights.semibold};
  font-size: ${theme.fontSizes.lg};
`;

interface EditUserModalProps {
  user: any;
  onClose: () => void;
  onSave: (userData: any) => Promise<void>;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    email: user.email || '',
    userType: user.userType || 'attendee',
    bio: user.bio || '',
    photoUrl: user.photoUrl || ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
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
          <div>
            <ModalTitle>Edit User</ModalTitle>
            <p style={{ 
              margin: 0, 
              color: theme.colors.textSecondary, 
              fontSize: theme.fontSizes.sm 
            }}>
              Update user information and permissions
            </p>
          </div>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              value={formData.displayName}
              onChange={handleChange}
              required
              placeholder="Enter full name"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter email address"
              disabled // Usually email shouldn't be editable
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="userType">User Type</Label>
            <Select
              id="userType"
              name="userType"
              value={formData.userType}
              onChange={handleChange}
              required
            >
              <option value="attendee">Attendee</option>
              <option value="organizer">Organizer</option>
              <option value="admin">Administrator</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="photoUrl">Profile Photo URL</Label>
            <Input
              id="photoUrl"
              name="photoUrl"
              type="url"
              value={formData.photoUrl}
              onChange={handleChange}
              placeholder="https://example.com/photo.jpg"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="bio">Bio</Label>
            <TextArea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Enter user bio or description"
            />
          </FormGroup>

          <ButtonGroup>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={loading}
            >
              {loading ? (
                'Saving...'
              ) : (
                <>
                  <CheckCircleIcon size={16} style={{ marginRight: theme.spacing.xs }} />
                  Save Changes
                </>
              )}
            </Button>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};
