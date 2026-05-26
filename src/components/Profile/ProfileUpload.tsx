import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';
import { UploadIcon, PersonIcon, CancelIcon } from '../Common/Icons';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileService } from '../../services/profileService';
import { uniqueToast } from '../../utils/toastUtils';

const UploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
`;

const CurrentProfile = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: ${theme.colors.backgroundSecondary};
  border-radius: 8px;
  width: 100%;
  text-align: center;
`;

const ProfileImage = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid ${theme.colors.primary};
`;

const UploadArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid ${theme.colors.gray200};
`;

const FileInput = styled.input`
  display: none;
`;

const UploadButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DeleteSection = styled.div`
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const DeleteButton = styled(Button)`
  background-color: transparent;
  color: ${theme.colors.error};
  border: 1px solid ${theme.colors.error};
  
  &:hover {
    background-color: ${theme.colors.error}10;
  }
`;

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
  z-index: 2000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;

const ModalTitle = styled.h2`
  color: ${theme.colors.error};
  margin-bottom: 1rem;
`;

const ModalText = styled.p`
  margin-bottom: 2rem;
  color: ${theme.colors.textSecondary};
  line-height: 1.5;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

const ProfileUpload: React.FC = () => {
  const { user, updateProfile, deleteAccount } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileService = ProfileService.getInstance();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('📸 File selected:', file.name, file.type, file.size);
      if (!file.type.startsWith('image/')) {
        uniqueToast.error('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        uniqueToast.error('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    const file = selectedFile;
    if (!file || !user) {
      uniqueToast.error('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      uniqueToast.info('Uploading profile picture...', { autoClose: false, toastId: 'uploading-toast' });
      
      const downloadURL = await profileService.uploadProfilePicture(user.uid, file);
      
      if (updateProfile) {
        await updateProfile({ photoUrl: downloadURL });
      }
      
      setPreview(null);
      setSelectedFile(null);
      uniqueToast.dismiss('uploading-toast');
      uniqueToast.success('Profile picture updated successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      uniqueToast.dismiss('uploading-toast');
      uniqueToast.error(error.message || 'Failed to upload profile picture.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await deleteAccount();
      // Auth state change will handle navigation
    } catch (error: any) {
      console.error('Account deletion error:', error);
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  if (!user) {
    return (
      <UploadContainer>
        <PersonIcon size={48} style={{ color: theme.colors.textSecondary }} />
        <p>Please log in to manage your profile</p>
      </UploadContainer>
    );
  }

  return (
    <>
      <UploadContainer>
        <CurrentProfile>
          {user.photoUrl ? (
            <ProfileImage 
              src={user.photoUrl} 
              alt={`${user.displayName}'s profile`}
            />
          ) : (
            <div style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '50%', 
              background: theme.colors.gray100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <PersonIcon size={48} style={{ color: theme.colors.textSecondary }} />
            </div>
          )}
          <div>
            <h3>{user.displayName}</h3>
            <p style={{ color: theme.colors.textSecondary, fontSize: '0.9rem' }}>
              {user.email}
            </p>
            <p style={{ color: theme.colors.primary, fontSize: '0.8rem', marginTop: '0.5rem', textTransform: 'uppercase', fontWeight: 'bold' }}>
              {user.userType}
            </p>
          </div>
        </CurrentProfile>

        <UploadArea>
          <FileInput
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
          />
          
          {preview && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Preview:</p>
              <img 
                src={preview} 
                alt="Preview" 
                style={{ 
                  width: '100px', 
                  height: '100px', 
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #e0e0e0'
                }} 
              />
            </div>
          )}

          <UploadButton
            onClick={triggerFileSelect}
            disabled={uploading}
            variant="primary"
          >
            <UploadIcon size={20} />
            {uploading ? 'Uploading...' : 'Choose New Photo'}
          </UploadButton>

          {preview && (
            <div style={{ marginTop: '0.5rem' }}>
              <Button
                onClick={handleUpload}
                disabled={uploading}
                variant="secondary"
              >
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </Button>
            </div>
          )}
        </UploadArea>

        <DeleteSection>
          <p style={{ color: theme.colors.textSecondary, fontSize: '0.85rem', textAlign: 'center' }}>
            Dangerous Area: Deleting your account will permanently remove all your data.
          </p>
          <DeleteButton 
            onClick={() => setShowDeleteModal(true)}
            disabled={uploading || isDeleting}
          >
            <CancelIcon size={18} style={{ marginRight: '0.5rem' }} />
            Delete Account
          </DeleteButton>
        </DeleteSection>
      </UploadContainer>

      {showDeleteModal && (
        <ModalOverlay onClick={() => !isDeleting && setShowDeleteModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalTitle>Delete Account?</ModalTitle>
            <ModalText>
              This action is <strong>permanent</strong> and cannot be undone. 
              All your profile information and data will be permanently removed.
            </ModalText>
            <ModalActions>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

export default ProfileUpload;
export { ProfileUpload };
