import React, { useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { theme } from '../../styles/theme';

interface StarFieldProps {
  density?: 'low' | 'medium' | 'high';
  speed?: 'slow' | 'medium' | 'fast';
  className?: string;
}

const twinkle = keyframes`
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-10px) rotate(120deg); }
  66% { transform: translateY(5px) rotate(240deg); }
`;

const drift = keyframes`
  0% { transform: translateX(-100vw); }
  100% { transform: translateX(100vw); }
`;

const StarFieldContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
  overflow: hidden;
`;

const Star = styled.div<{
  size: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
  type: 'twinkle' | 'float' | 'drift';
}>`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  left: ${props => props.left}%;
  top: ${props => props.top}%;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.9), 0 0 30px rgba(255, 255, 255, 0.6);
  animation-delay: ${props => props.delay}s;
  animation-duration: ${props => props.duration}s;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
  
  ${props => {
    switch (props.type) {
      case 'twinkle':
        return css`
          animation-name: ${twinkle};
        `;
      case 'float':
        return css`
          animation-name: ${float};
        `;
      case 'drift':
        return css`
          animation-name: ${drift};
          animation-timing-function: linear;
        `;
      default:
        return css``;
    }
  }}
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: ${props => props.size * 0.3}px;
    height: ${props => props.size * 0.3}px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    width: ${props => props.size * 0.7}px;
    height: ${props => props.size * 0.7}px;
    
    &::before {
      width: ${props => props.size * 0.2}px;
      height: ${props => props.size * 0.2}px;
    }
  }
`;

const ShootingStar = styled.div<{
  left: number;
  top: number;
  delay: number;
  duration: number;
}>`
  position: absolute;
  left: ${props => props.left}%;
  top: ${props => props.top}%;
  width: 2px;
  height: 2px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  animation: ${drift} ${props => props.duration}s linear infinite;
  animation-delay: ${props => props.delay}s;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100px;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.8) 50%,
      transparent
    );
    transform: translateX(-100px);
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    &::after {
      width: 50px;
      transform: translateX(-50px);
    }
  }
`;

export const StarField: React.FC<StarFieldProps> = ({
  density = 'medium',
  speed = 'medium',
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  console.log('StarField component rendering with density:', density, 'speed:', speed);

  const getDensityCount = () => {
    switch (density) {
      case 'low': return { stars: 15, shooting: 1 };
      case 'high': return { stars: 40, shooting: 3 };
      default: return { stars: 25, shooting: 2 };
    }
  };

  const getSpeedMultiplier = () => {
    switch (speed) {
      case 'slow': return 1.5;
      case 'fast': return 0.7;
      default: return 1;
    }
  };

  const generateStars = () => {
    const counts = getDensityCount();
    const speedMultiplier = getSpeedMultiplier();
    const stars = [];
    
    console.log('Generating stars with counts:', counts);

    // Generate twinkling stars
    for (let i = 0; i < counts.stars * 0.6; i++) {
      stars.push(
        <Star
          key={`twinkle-${i}`}
          size={Math.random() * 3 + 2}
          left={Math.random() * 100}
          top={Math.random() * 100}
          delay={Math.random() * 5}
          duration={(Math.random() * 3 + 2) * speedMultiplier}
          type="twinkle"
        />
      );
    }

    // Generate floating stars
    for (let i = 0; i < counts.stars * 0.3; i++) {
      stars.push(
        <Star
          key={`float-${i}`}
          size={Math.random() * 4 + 3}
          left={Math.random() * 100}
          top={Math.random() * 100}
          delay={Math.random() * 8}
          duration={(Math.random() * 6 + 4) * speedMultiplier}
          type="float"
        />
      );
    }

    // Generate drifting stars
    for (let i = 0; i < counts.stars * 0.1; i++) {
      stars.push(
        <Star
          key={`drift-${i}`}
          size={Math.random() * 2 + 1}
          left={-10}
          top={Math.random() * 100}
          delay={Math.random() * 10}
          duration={(Math.random() * 15 + 10) * speedMultiplier}
          type="drift"
        />
      );
    }

    // Generate shooting stars
    for (let i = 0; i < counts.shooting; i++) {
      stars.push(
        <ShootingStar
          key={`shooting-${i}`}
          left={-10}
          top={Math.random() * 50}
          delay={Math.random() * 20 + 5}
          duration={(Math.random() * 3 + 2) * speedMultiplier}
        />
      );
    }

    console.log('Generated', stars.length, 'total stars');
    return stars;
  };

  return (
    <StarFieldContainer ref={containerRef} className={className}>
      {generateStars()}
    </StarFieldContainer>
  );
};

export default StarField;
