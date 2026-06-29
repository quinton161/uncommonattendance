import React, { useEffect, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { WifiOff, Wifi } from 'lucide-react';

const slideDown = keyframes`
  from { transform: translateY(-100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(0);    opacity: 1; }
  to   { transform: translateY(-100%); opacity: 0; }
`;

const Banner = styled.div<{ $visible: boolean; $online: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  pointer-events: none;
  animation: ${({ $visible }) =>
    $visible
      ? css`${slideDown} 0.35s ease forwards`
      : css`${slideUp} 0.35s ease forwards`};

  background: ${({ $online }) =>
    $online
      ? 'linear-gradient(90deg, #059669, #10b981)'
      : 'linear-gradient(90deg, #dc2626, #ef4444)'};

  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
`;

/**
 * Shows a top banner whenever the browser goes offline.
 * Also briefly shows a "Back online" banner when connectivity is restored.
 */
export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [showOnline, setShowOnline] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
      setShowOnline(false);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setShowOnline(true);
      // Show "back online" briefly, then hide
      setTimeout(() => {
        setShowBanner(false);
        setShowOnline(false);
      }, 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Show immediately if already offline on mount
    if (!navigator.onLine) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <Banner $visible={showBanner} $online={isOnline || showOnline}>
      {isOnline ? <Wifi size={15} /> : <WifiOff size={15} />}
      {isOnline
        ? 'You\'re back online!'
        : 'No internet connection — some features may not work'}
    </Banner>
  );
};
