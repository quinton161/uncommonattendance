import React from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import ProfileUpload from '../components/Profile/ProfileUpload';
import { useAuth } from '../contexts/AuthContext';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.backgroundSecondary} 100%);
  padding: 2rem;
`;

const PageTitle = styled.h1`
  color: ${theme.colors.textPrimary};
  margin-bottom: 2rem;
  text-align: center;
`;

const PageContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <PageContainer>
      <PageTitle>Profile Settings</PageTitle>
      <PageContent>
        <ProfileUpload />
      </PageContent>
    </PageContainer>
  );
};

export default ProfilePage;
