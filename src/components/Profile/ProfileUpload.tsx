import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';
import { UploadIcon, PersonIcon } from '../Common/Icons';
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
`;

const CurrentProfile = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: ${theme.colors.backgroundSecondary};
  border-radius: 8px;
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
`;

const FileInput = styled.input`
  display: none;
`;

const UploadButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ProfileUpload: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileService = ProfileService.getInstance();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('📸 File selected:', file.name, file.type, file.size);
      // Check file type
      if (!file.type.startsWith('image/')) {
        uniqueToast.error('Please select an image file');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        uniqueToast.error('Image size must be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !user) {
      console.warn('⚠️ No file or user for upload');
      return;
    }

    try {
      setUploading(true);
      uniqueToast.info('Uploading profile picture...', { autoClose: false, toastId: 'uploading-toast' });
      
      const downloadURL = await profileService.uploadProfilePicture(user.uid, file);
      
      // Update local auth context without reloading the page
      if (updateProfile) {
        await updateProfile({ photoUrl: downloadURL });
      }
      
      setPreview(null);
      uniqueToast.dismiss('uploading-toast');
      uniqueToast.success('Profile picture updated successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      uniqueToast.dismiss('uploading-toast');
      uniqueToast.error(error.message || 'Failed to upload profile picture. Check your connection.');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  if (!user) {
    return (
      <UploadContainer>
        <PersonIcon size={48} style={{ color: theme.colors.textSecondary }} />
        <p>Please log in to upload a profile picture</p>
      </UploadContainer>
    );
  }

  return (
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
    </UploadContainer>
  );
};

export default ProfileUpload;
export { ProfileUpload };
