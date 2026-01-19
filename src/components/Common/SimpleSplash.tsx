import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { UncommonLogo } from './UncommonLogo';
import { theme } from '../../styles/theme';

// Simple loading animations
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
`;

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

// Styled components
const SplashContainer = styled.div<{ isExiting?: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: ${css`${fadeIn} 0.3s ease-out`};
  
  ${props => props.isExiting && css`
    animation: ${fadeIn} 0.3s ease-out reverse;
  `}
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${theme.spacing.xl};
  animation: ${css`${pulse} 2s ease-in-out infinite`};
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${theme.colors.gray200};
  border-top: 3px solid ${theme.colors.primary};
  border-radius: 50%;
  animation: ${css`${spin} 1s linear infinite`};
  margin-top: ${theme.spacing.lg};
`;

const LoadingText = styled.div`
  font-family: ${theme.fonts.primary};
  font-size: ${theme.fontSizes.base};
  color: ${theme.colors.textSecondary};
  margin-top: ${theme.spacing.md};
  text-align: center;
`;

// Component props
interface SimpleSplashProps {
  onFinish: () => void;
  duration?: number;
}

export const SimpleSplash: React.FC<SimpleSplashProps> = ({
  onFinish,
  duration = 2000
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onFinish();
      }, 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onFinish]);

  if (!isVisible) return null;

  return (
    <SplashContainer 
      isExiting={isExiting}
      role="dialog"
      aria-label="Loading application"
      aria-live="polite"
    >
      <LogoContainer>
        <UncommonLogo size="lg" showSubtitle={false} />
      </LogoContainer>
      
      <LoadingSpinner />
      
      <LoadingText>
        Loading...
      </LoadingText>
    </SplashContainer>
  );
};

export default SimpleSplash;
