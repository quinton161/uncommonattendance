import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import { storage } from '../../services/firebase';
import { Layout, Container, AppHeader } from '../Common/Layout';
import { Button } from '../Common/Button';
import { Input } from '../Common/Input';
import { Card } from '../Common/Card';
import { ArrowBackIcon } from '../Common/Icons';
import { theme } from '../../styles/theme';

const ProfileContainer = styled.div`
  padding: ${theme.spacing.xl} 0;
  min-height: calc(100vh - 64px);
`;

const ProfileHeader = styled.div`
  text-align: center;
  margin-bottom: ${theme.spacing.xl};
`;

const AvatarSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.xl};
`;

const Avatar = styled.div<{ photoURL?: string }>`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${({ photoURL }) => 
    photoURL 
      ? `url(${photoURL}) center/cover`
      : `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`
  };
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.white};
  font-size: ${theme.fontSizes['2xl']};
  font-weight: ${theme.fontWeights.bold};
  border: 4px solid ${theme.colors.white};
  box-shadow: ${theme.shadows.lg};
  position: relative;
  overflow: hidden;
`;

const AvatarOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: pointer;
  
  &:hover {
    opacity: 1;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const ProfileForm = styled.form`
  display: grid;
  gap: ${theme.spacing.lg};
  max-width: 500px;
  margin: 0 auto;
`;

const FormSection = styled.div`
  display: grid;
  gap: ${theme.spacing.md};
`;

const SectionTitle = styled.h3`
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing.sm};
  padding-bottom: ${theme.spacing.xs};
  border-bottom: 2px solid ${theme.colors.gray200};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  justify-content: center;
  margin-top: ${theme.spacing.lg};
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

const ErrorMessage = styled.div`
  background-color: ${theme.colors.danger}10;
  border: 1px solid ${theme.colors.danger}30;
  color: ${theme.colors.danger};
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSizes.sm};
  text-align: center;
  margin-bottom: ${theme.spacing.md};
`;

const SuccessMessage = styled.div`
  background-color: ${theme.colors.success}10;
  border: 1px solid ${theme.colors.success}30;
  color: ${theme.colors.success};
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSizes.sm};
  text-align: center;
  margin-bottom: ${theme.spacing.md};
`;

const BackButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  background: ${theme.colors.white};
  border: 2px solid ${theme.colors.primary};
  color: ${theme.colors.primary};
  font-weight: ${theme.fontWeights.semibold};
  box-shadow: ${theme.shadows.sm};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${theme.colors.primary};
    color: ${theme.colors.white};
    transform: translateY(-1px);
    box-shadow: ${theme.shadows.md};
  }
  
  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.sm};
    padding: ${theme.spacing.sm} ${theme.spacing.md};
  }
  
  @media (max-width: 420px) {
    padding: ${theme.spacing.md};
    font-size: ${theme.fontSizes.base};
    min-height: 44px;
  }
`;

interface ProfilePageProps {
  onBack: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
    setSuccess('');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    setError('');

    try {
      // Create a reference to the file in Firebase Storage
      const storageRef = ref(storage, `profile-photos/${user.uid}/${file.name}`);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get the download URL
      const photoURL = await getDownloadURL(snapshot.ref);
      
      // Update the user profile
      await updateProfile({ photoUrl: photoURL });
      
      setSuccess('Profile photo updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile({
        displayName: formData.displayName,
      });
      
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Layout>
      <AppHeader title="Profile Settings">
        <BackButton onClick={onBack}>
          <ArrowBackIcon size={16} />
          Back to Dashboard
        </BackButton>
      </AppHeader>
      
      <ProfileContainer>
        <Container maxWidth="md">
          <ProfileHeader>
            <h1>Profile Settings</h1>
            <p style={{ color: theme.colors.textSecondary }}>
              Manage your personal information and preferences
            </p>
          </ProfileHeader>

          <Card padding="lg">
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {success && <SuccessMessage>{success}</SuccessMessage>}

            <AvatarSection>
              <Avatar photoURL={user?.photoUrl}>
                {!user?.photoUrl && getInitials(user?.displayName || 'User')}
                <AvatarOverlay onClick={() => fileInputRef.current?.click()}>
                  {uploadingPhoto ? '⏳' : '📷'}
                </AvatarOverlay>
              </Avatar>
              
              <HiddenFileInput
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                loading={uploadingPhoto}
              >
                {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
              </Button>
            </AvatarSection>

            <ProfileForm onSubmit={handleSubmit}>
              <FormSection>
                <SectionTitle>Personal Information</SectionTitle>
                
                <Input
                  label="Full Name"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                  fullWidth
                />
                
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  disabled
                  fullWidth
                  helperText="Email cannot be changed"
                />
              </FormSection>

              <FormSection>
                <SectionTitle>Account Information</SectionTitle>
                
                <Input
                  label="Role"
                  value={user?.userType === 'admin' ? 'Admin' : user?.userType === 'organizer' ? 'Organizer' : 'Attendee'}
                  disabled
                  fullWidth
                  helperText="Role is assigned by administrators"
                />
                
                <Input
                  label="Member Since"
                  value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                  disabled
                  fullWidth
                />
              </FormSection>

              <ButtonGroup>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  disabled={loading || !formData.displayName.trim()}
                >
                  Save Changes
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={onBack}
                >
                  Cancel
                </Button>
              </ButtonGroup>
            </ProfileForm>
          </Card>
        </Container>
      </ProfileContainer>
    </Layout>
  );
};
