import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { Layout, Container } from '../Common/Layout';
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

const AuthContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, 
    ${theme.colors.primary}15 0%, 
    ${theme.colors.primaryLight}10 25%, 
    ${theme.colors.backgroundSecondary} 50%,
    ${theme.colors.primary}08 75%,
    ${theme.colors.primaryDark}12 100%
  );
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 80%;
    height: 120%;
    background: linear-gradient(45deg, 
      ${theme.colors.primary}20 0%, 
      ${theme.colors.primaryLight}15 50%, 
      transparent 100%
    );
    border-radius: 50%;
    animation: ${css`${float} 20s ease-in-out infinite`};
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -30%;
    left: -10%;
    width: 60%;
    height: 80%;
    background: linear-gradient(45deg, 
      ${theme.colors.primaryDark}15 0%, 
      ${theme.colors.primary}10 50%, 
      transparent 100%
    );
    border-radius: 50%;
    animation: ${css`${float} 25s ease-in-out infinite reverse`};
  }
`;

const AuthCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  width: 100%;
  max-width: 900px;
  min-height: 600px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  position: relative;
  z-index: 1;
  animation: ${css`${fadeInUp} 0.8s ease-out`};
  margin: ${theme.spacing.lg};
  
  @media (max-width: ${theme.breakpoints.desktop}) {
    max-width: 800px;
    min-height: 550px;
  }
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
    max-width: 450px;
    min-height: auto;
    border-radius: 16px;
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    margin: ${theme.spacing.md};
    max-width: calc(100vw - ${theme.spacing.lg});
    border-radius: 12px;
  }
`;

const LeftPanel = styled.div`
  padding: ${theme.spacing['3xl']};
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  min-height: 500px;
  
  @media (max-width: ${theme.breakpoints.desktop}) {
    padding: ${theme.spacing['2xl']};
    min-height: 450px;
  }
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${theme.spacing.xl};
    min-height: auto;
    justify-content: flex-start;
    padding-top: ${theme.spacing['2xl']};
    padding-bottom: ${theme.spacing['2xl']};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.lg};
    padding-top: ${theme.spacing.xl};
    padding-bottom: ${theme.spacing.xl};
  }
`;

const RightPanel = styled.div`
  background: linear-gradient(135deg, 
    ${theme.colors.primary} 0%, 
    ${theme.colors.primaryLight} 50%, 
    ${theme.colors.primaryDark} 100%
  );
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, 
      rgba(255, 255, 255, 0.1) 0%, 
      transparent 70%
    );
    animation: ${css`${float} 15s ease-in-out infinite`};
  }
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    display: none;
  }
`;

const IllustrationContainer = styled.div`
  position: relative;
  z-index: 2;
  animation: ${css`${float} 6s ease-in-out infinite`};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  
  @media (max-width: ${theme.breakpoints.desktop}) {
    transform: scale(0.8);
  }
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    display: none;
  }
`;

const Laptop = styled.div`
  width: 200px;
  height: 140px;
  background: #2d3748;
  border-radius: 8px 8px 0 0;
  position: relative;
  transform: perspective(600px) rotateY(-15deg) rotateX(10deg);
  
  &::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 8px;
    right: 8px;
    bottom: 20px;
    background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
    border-radius: 4px;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: -10px;
    right: -10px;
    height: 8px;
    background: #1a202c;
    border-radius: 0 0 12px 12px;
  }
`;

const Plant = styled.div`
  position: absolute;
  top: 50px;
  right: -30px;
  width: 40px;
  height: 60px;
  
  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 30px;
    height: 20px;
    background: #e2e8f0;
    border-radius: 50%;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 15px;
    left: 50%;
    transform: translateX(-50%);
    width: 8px;
    height: 40px;
    background: #38a169;
    border-radius: 4px;
  }
`;

const AnalyticsChart = styled.div`
  position: absolute;
  top: 20px;
  left: -50px;
  width: 35px;
  height: 25px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  &::before {
    content: '';
    position: absolute;
    bottom: 4px;
    left: 4px;
    width: 4px;
    height: 8px;
    background: ${theme.colors.primary};
    border-radius: 1px;
    box-shadow: 
      6px 2px 0 ${theme.colors.primaryLight},
      12px -1px 0 ${theme.colors.primary},
      18px 3px 0 ${theme.colors.primaryDark},
      24px 1px 0 ${theme.colors.primaryLight};
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    right: 2px;
    width: 6px;
    height: 6px;
    border: 1px solid ${theme.colors.primary};
    border-radius: 50%;
    background: ${theme.colors.primaryLight};
  }
`;

const DataCloud = styled.div`
  position: absolute;
  top: -10px;
  right: -60px;
  width: 40px;
  height: 25px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  &::before {
    content: '';
    position: absolute;
    top: -8px;
    left: 8px;
    width: 15px;
    height: 15px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    box-shadow: 
      8px 0 0 -2px rgba(255, 255, 255, 0.9),
      -4px 0 0 -1px rgba(255, 255, 255, 0.9);
  }
  
  &::after {
    content: '☁';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 12px;
    color: ${theme.colors.primary};
  }
`;

const SmartBrain = styled.div`
  position: absolute;
  bottom: 10px;
  left: -35px;
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryLight});
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: ${css`${pulse} 2s ease-in-out infinite`};
  
  &::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 8px;
    width: 14px;
    height: 14px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.5);
  }
  
  &::after {
    content: '🧠';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 14px;
    filter: brightness(1.2);
  }
`;

const NetworkNodes = styled.div`
  position: absolute;
  bottom: -5px;
  right: -45px;
  width: 35px;
  height: 35px;
  
  &::before {
    content: '';
    position: absolute;
    top: 5px;
    left: 5px;
    width: 6px;
    height: 6px;
    background: ${theme.colors.primary};
    border-radius: 50%;
    box-shadow: 
      12px 0 0 ${theme.colors.primaryLight},
      6px 12px 0 ${theme.colors.primaryDark},
      18px 12px 0 ${theme.colors.primary},
      24px 6px 0 ${theme.colors.primaryLight};
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 8px;
    left: 8px;
    width: 20px;
    height: 1px;
    background: linear-gradient(45deg, ${theme.colors.primary}, transparent);
    transform: rotate(0deg);
    box-shadow: 
      0 12px 0 0 linear-gradient(-45deg, ${theme.colors.primaryLight}, transparent),
      12px 6px 0 0 linear-gradient(90deg, ${theme.colors.primaryDark}, transparent);
  }
`;

const Header = styled.div`
  margin-bottom: ${theme.spacing.xl};
  animation: ${css`${slideIn} 0.6s ease-out 0.2s both`};
`;

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

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const handleTabClick = (tab: 'login' | 'signup') => {
    setIsLogin(tab === 'login');
  };

  return (
    <AuthContainer>
      <AuthCard>
        <LeftPanel>
          <Header>
            <UncommonLogo size="lg" showSubtitle={false} />
          </Header>
          
          <TabContainer>
            <TabButton 
              active={isLogin} 
              onClick={() => handleTabClick('login')}
            >
              Login
            </TabButton>
            <TabButton 
              active={!isLogin} 
              onClick={() => handleTabClick('signup')}
            >
              Sign up
            </TabButton>
          </TabContainer>
          
          <FormContainer>
            {isLogin ? (
              <LoginForm onToggleMode={() => setIsLogin(false)} />
            ) : (
              <RegisterForm onToggleMode={() => setIsLogin(true)} />
            )}
          </FormContainer>
        </LeftPanel>
        
        <RightPanel>
          <IllustrationContainer>
            <Laptop />
            <Plant />
            <AnalyticsChart />
            <DataCloud />
            <SmartBrain />
            <NetworkNodes />
          </IllustrationContainer>
        </RightPanel>
      </AuthCard>
    </AuthContainer>
  );
};
