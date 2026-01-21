import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { UncommonLogo } from '../Common/UncommonLogo';
import { theme } from '../../styles/theme';

// Animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-10px) rotate(2deg);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

// Removed unused styled-components: AnimatedBackground, Particle, AuthContainer, AuthCard, LeftPanel, RightPanel, IllustrationContainer, Laptop, Plant, AnalyticsChart, DataCloud, SmartBrain, NetworkNodes, Header

const TabContainer = styled.div`
  display: flex;
  margin-bottom: ${theme.spacing.xl};
  background: ${theme.colors.gray100};
  border-radius: 12px;
  padding: 4px;
  position: relative;
`;

const TabButton = styled.button<{ active: boolean }>`
  flex: 1;
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border: none;
  background: ${props => props.active ? theme.colors.white : 'transparent'};
  color: ${props => props.active ? theme.colors.primary : theme.colors.textSecondary};
  font-weight: ${props => props.active ? theme.fontWeights.semibold : theme.fontWeights.medium};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
  font-size: ${theme.fontSizes.base};
  
  &:hover {
    color: ${theme.colors.primary};
    transform: translateY(-1px);
  }
  
  ${props => props.active && css`
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.1),
      0 2px 4px rgba(0, 0, 0, 0.05);
    animation: ${pulse} 0.3s ease-out;
  `}
`;

const FormContainer = styled.div`
  animation: ${css`${slideIn} 0.6s ease-out 0.4s both`};
`;

// Glassmorphism Login Page - Uncommon Style

const GlassBgContainer = styled.div`
  min-height: 100vh;
  width: 100vw;
  max-width: 100vw;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: #fff;
  position: relative;
  overflow-x: hidden;
  padding-top: 5vh;
`;

const GlassCard = styled.div`
  background: rgba(255, 255, 255, 0.14);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-radius: 20px;
  border: 1.5px solid rgba(255,255,255,0.25);
  padding: 2.2rem 2.2rem 1.7rem 2.2rem;
  min-width: 280px;
  max-width: 420px;
  width: 100%;
  max-width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  margin: 0;
  min-height: unset;
  box-sizing: border-box;
  overflow-x: hidden;
  @media (max-width: 900px) {
    max-width: 370px;
    padding: 1.5rem 1rem 1.1rem 1rem;
  }
  @media (max-width: 600px) {
    max-width: 98vw;
    min-width: 0;
    padding: 1.1rem 0.5rem 1.1rem 0.5rem;
  }
  @media (max-width: 400px) {
    padding: 0.5rem 0.1rem 0.5rem 0.1rem;
  }
`;

// Removed unused Glass styled-components: GlassTitle, GlassInput, GlassButton, GlassLinksRow, GlassLinkLeft, GlassLinkRight, GlassDivider, GlassSocialRow, GlassSocialBtn

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <GlassBgContainer style={{background: '#fff'}}>
      <GlassCard>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.2rem' }}>
          <UncommonLogo size="lg" showSubtitle={false} />
        </div>
        <TabContainer>
          <TabButton active={isLogin} onClick={() => setIsLogin(true)}>Login</TabButton>
          <TabButton active={!isLogin} onClick={() => setIsLogin(false)}>Sign Up</TabButton>
        </TabContainer>
        <FormContainer>
          {isLogin ? (
            <LoginForm onToggleMode={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onToggleMode={() => setIsLogin(true)} />
          )}
        </FormContainer>
      </GlassCard>
    </GlassBgContainer>
  );
};
