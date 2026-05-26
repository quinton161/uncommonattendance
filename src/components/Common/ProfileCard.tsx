import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

interface ProfileCardProps {
  name: string;
  role: string;
  avatarUrl?: string;
  status?: 'online' | 'away' | 'offline';
  stat?: {
    value: string | number;
    label: string;
  };
  className?: string;
  children?: React.ReactNode;
}

const CardContainer = styled.div`
  position: relative;
  border-radius: ${theme.borderRadius['3xl']};
  overflow: hidden;
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%);
  color: ${theme.colors.white};
  box-shadow: 0 8px 32px rgba(0, 82, 204, 0.25);
`;

const BackgroundPattern = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.08) 0%, transparent 40%);
  pointer-events: none;
`;

const CardContent = styled.div`
  position: relative;
  z-index: 1;
  padding: ${theme.spacing.xl};
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.lg};
  }
`;

const AvatarWrapper = styled.div`
  position: relative;
  margin-bottom: ${theme.spacing.md};
`;

const Avatar = styled.div<{ $hasImage: boolean }>`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: ${({ $hasImage }) => $hasImage ? 'transparent' : 'rgba(255, 255, 255, 0.2)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${theme.fontSizes['3xl']};
  font-weight: ${theme.fontWeights.bold};
  border: 3px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    width: 80px;
    height: 80px;
    font-size: ${theme.fontSizes['2xl']};
  }
`;

const StatusDot = styled.span<{ $status: 'online' | 'away' | 'offline' }>`
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid ${theme.colors.primary};
  background: ${({ $status }) => {
    switch ($status) {
      case 'online': return '#27ae60';
      case 'away': return '#f39c12';
      default: return '#95a5a6';
    }
  }};
`;

const Name = styled.h3`
  margin: 0 0 ${theme.spacing.xs};
  font-size: ${theme.fontSizes.xl};
  font-weight: ${theme.fontWeights.semibold};
  font-family: ${theme.fonts.heading};
`;

const Role = styled.span`
  font-size: ${theme.fontSizes.sm};
  opacity: 0.85;
  margin-bottom: ${theme.spacing.md};
  display: block;
`;

const StatBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  border-radius: ${theme.borderRadius.full};
  margin-top: ${theme.spacing.sm};
`;

const StatValue = styled.span`
  font-size: ${theme.fontSizes.lg};
  font-weight: ${theme.fontWeights.bold};
`;

const StatLabel = styled.span`
  font-size: ${theme.fontSizes.xs};
  opacity: 0.85;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const ChildrenContainer = styled.div`
  width: 100%;
  margin-top: ${theme.spacing.lg};
  padding-top: ${theme.spacing.lg};
  border-top: 1px solid rgba(255, 255, 255, 0.15);
`;

export const ProfileCard: React.FC<ProfileCardProps> = ({
  name,
  role,
  avatarUrl,
  status,
  stat,
  className,
  children,
}) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <CardContainer className={className}>
      <BackgroundPattern />
      <CardContent>
        <AvatarWrapper>
          <Avatar $hasImage={!!avatarUrl}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} />
            ) : (
              initials
            )}
          </Avatar>
          {status && <StatusDot $status={status} />}
        </AvatarWrapper>
        <Name>{name}</Name>
        <Role>{role}</Role>
        {stat && (
          <StatBadge>
            <StatValue>{stat.value}</StatValue>
            <StatLabel>{stat.label}</StatLabel>
          </StatBadge>
        )}
        {children && <ChildrenContainer>{children}</ChildrenContainer>}
      </CardContent>
    </CardContainer>
  );
};

export default ProfileCard;
