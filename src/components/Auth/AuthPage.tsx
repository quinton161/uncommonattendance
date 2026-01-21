import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { UncommonLogo } from '../Common/UncommonLogo';
import { theme } from '../../styles/theme';
import { FaGoogle, FaFacebookF } from 'react-icons/fa';

// Workaround: ensure react-icons components have a ComponentType-compatible type
const GoogleIcon = FaGoogle as unknown as React.ComponentType<any>;
const FacebookIcon = FaFacebookF as unknown as React.ComponentType<any>;

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

const AnimatedBackground = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  background: none;
`;

const Particle = styled.div<{ x: number; y: number; color: string; size: number; duration: number }>`
  position: absolute;
  left: ${({ x }) => x}%;
  top: ${({ y }) => y}%;
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  background: ${({ color }) => color};
  opacity: 0.15;
  border-radius: 50%;
  filter: blur(2px);
  animation: ${float} ${({ duration }) => duration}s ease-in-out infinite alternate;
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
  background: rgba(255, 255, 255, 0.80);
  backdrop-filter: blur(32px) saturate(180%);
  border-radius: 32px;
  box-shadow: 0 8px 40px 0 rgba(80, 80, 180, 0.10), 0 1.5px 10px 0 rgba(80, 80, 180, 0.06), 0 0.5px 0 rgba(255,255,255,0.9);
  border: 1.5px solid rgba(255,255,255,0.25);
  overflow: hidden;
  width: 100%;
  max-width: 480px;
  min-height: unset;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
  animation: ${css`${fadeInUp} 0.8s ease-out`};
  margin: 0 auto;
  padding: ${theme.spacing['2xl']} ${theme.spacing.xl};
  @media (max-width: ${theme.breakpoints.tablet}) {
    max-width: 95vw;
    padding: ${theme.spacing.xl} ${theme.spacing.md};
    border-radius: 18px;
  }
  @media (max-width: ${theme.breakpoints.mobile}) {
    margin: ${theme.spacing.sm};
    max-width: 420px;
    border-radius: 12px;
    padding: ${theme.spacing.lg} ${theme.spacing.sm};
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

const GlassTitle = styled.h2`
  color: #fff;
  text-align: center;
  font-size: 1.6rem;
  font-weight: 500;
  margin-bottom: 2rem;
  text-shadow: 0 1px 12px rgba(255,255,255,0.18);
  letter-spacing: 0.5px;
`;

const GlassInput = styled.input`
  border: none;
  outline: none;
  background: rgba(255,255,255,0.18);
  border-radius: 2rem;
  padding: 0.9rem 1.2rem;
  margin-bottom: 1.3rem;
  color: #fff;
  font-size: 1rem;
  font-weight: 400;
  box-shadow: 0 1.5px 8px 0 rgba(80, 80, 180, 0.07);
  transition: background 0.2s;
  &::placeholder {
    color: #f3f3f3cc;
    opacity: 1;
    font-weight: 300;
    letter-spacing: 0.5px;
  }
  &:focus {
    background: rgba(255,255,255,0.26);
  }
`;

const GlassButton = styled.button`
  background: #7d2846;
  color: #fff;
  border: none;
  border-radius: 2rem;
  font-size: 1.09rem;
  font-weight: 600;
  padding: 0.95rem 0;
  margin-bottom: 1.2rem;
  margin-top: 0.1rem;
  box-shadow: 0 4px 18px 0 #7d284655;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: background 0.18s, transform 0.13s;
  &:hover, &:focus {
    background: #a03a5e;
    transform: translateY(-2px) scale(1.03);
  }
`;

const GlassLinksRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;
  font-size: 0.97rem;
`;
const GlassLinkLeft = styled.a`
  color: #fff;
  opacity: 0.85;
  text-decoration: none;
  font-size: 0.97rem;
  transition: color 0.17s;
  &:hover { color: #f6c5e5; }
`;
const GlassLinkRight = styled.a`
  color: #fff;
  opacity: 0.85;
  text-decoration: none;
  font-size: 0.97rem;
  transition: color 0.17s;
  &:hover { color: #f6c5e5; }
`;
const GlassDivider = styled.div`
  color: #fff;
  opacity: 0.65;
  text-align: center;
  margin: 1.2rem 0 0.6rem 0;
  font-size: 0.93rem;
  letter-spacing: 0.3px;
  position: relative;
  &:before, &:after {
    content: '';
    display: inline-block;
    width: 30%;
    height: 1px;
    margin: 0 0.5em 0 0;
    background: rgba(255,255,255,0.25);
    vertical-align: middle;
  }
  &:after {
    margin: 0 0 0 0.5em;
  }
`;
const GlassSocialRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.2rem;
  margin-top: 0.6rem;
`;
const GlassSocialBtn = styled.button`
  background: rgba(255,255,255,0.18);
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.3rem;
  box-shadow: 0 2px 8px 0 rgba(80, 80, 180, 0.11);
  cursor: pointer;
  transition: background 0.2s, transform 0.13s;
  &:hover, &:focus {
    background: #fff2;
    transform: scale(1.1);
  }
`;

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  // Glassmorphism animated particles
  const particles = Array.from({ length: 16 }).map((_, i) => {
    const colors = [theme.colors.primary, theme.colors.primaryLight, theme.colors.primaryDark, theme.colors.secondary];
    return {
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: colors[i % colors.length],
      size: 60 + Math.random() * 80,
      duration: 7 + Math.random() * 12,
      key: i
    };
  });

  const handleTabClick = (tab: 'login' | 'signup') => {
    setIsLogin(tab === 'login');
  };

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
