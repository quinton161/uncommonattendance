import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { TimeService } from '../../services/timeService';
import { WiFiIcon } from './Icons';

const StatusContainer = styled.div<{ isOnline: boolean; usingInternetTime: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSizes.xs};
  background: ${props => {
    if (!props.isOnline) return theme.colors.error;
    if (!props.usingInternetTime) return theme.colors.warning;
    return theme.colors.success;
  }};
  color: ${theme.colors.white};
  opacity: 0.9;
  transition: all 0.3s ease;

  &:hover {
    opacity: 1;
  }
`;

const StatusText = styled.span`
  font-weight: ${theme.fontWeights.medium};
`;

const TimeSyncStatus: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState({
    isOnline: true,
    lastSyncTime: 0,
    timeOffset: 0,
    usingInternetTime: true
  });

  useEffect(() => {
    const timeService = TimeService.getInstance();
    
    const updateStatus = () => {
      const status = timeService.getSyncStatus();
      setSyncStatus({
        isOnline: status.isOnline,
        lastSyncTime: status.lastSyncTime || 0,
        timeOffset: status.timeOffset,
        usingInternetTime: status.usingInternetTime
      });
    };

    // Initial status
    updateStatus();

    // Update status every 30 seconds
    const interval = setInterval(updateStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusText = (): string => {
    if (!syncStatus.isOnline) {
      return 'Offline - Using System Time';
    }
    
    if (!syncStatus.usingInternetTime) {
      return 'Syncing...';
    }
    
    const lastSync = syncStatus.lastSyncTime;
    if (lastSync > 0) {
      const minutesAgo = Math.floor((Date.now() - lastSync) / 60000);
      if (minutesAgo < 1) {
        return 'Time Synced';
      } else if (minutesAgo < 60) {
        return `Synced ${minutesAgo}m ago`;
      } else {
        const hoursAgo = Math.floor(minutesAgo / 60);
        return `Synced ${hoursAgo}h ago`;
      }
    }
    
    return 'Time Synced';
  };

  const handleForceSync = async () => {
    const timeService = TimeService.getInstance();
    await timeService.forceSync();
    const status = timeService.getSyncStatus();
    setSyncStatus({
      isOnline: status.isOnline,
      lastSyncTime: status.lastSyncTime || 0,
      timeOffset: status.timeOffset,
      usingInternetTime: status.usingInternetTime
    });
  };

  return (
    <StatusContainer 
      isOnline={syncStatus.isOnline}
      usingInternetTime={syncStatus.usingInternetTime}
      onClick={handleForceSync}
      title="Click to force time sync"
      style={{ cursor: 'pointer' }}
    >
      {syncStatus.isOnline ? (
        <WiFiIcon size={12} />
      ) : (
        <WiFiIcon size={12} style={{ opacity: 0.5 }} />
      )}
      <StatusText>{getStatusText()}</StatusText>
    </StatusContainer>
  );
};

export default TimeSyncStatus;
