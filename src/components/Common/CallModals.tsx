import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { CallSession } from '../../types';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 20px;
  padding: 30px;
  text-align: center;
  max-width: 320px;
  width: 90%;
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

const Avatar = styled.div<{ isVideo?: boolean }>`
  width: ${props => props.isVideo ? '120px' : '80px'};
  height: ${props => props.isVideo ? '120px' : '80px'};
  border-radius: 50%;
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: ${props => props.isVideo ? '48px' : '32px'};
  color: white;
`;

const Title = styled.h2`
  font-size: ${theme.fontSizes.xl};
  color: ${theme.colors.textPrimary};
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: ${theme.fontSizes.base};
  color: ${theme.colors.textSecondary};
  margin-bottom: 24px;
`;

const CallTypeIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 24px;
`;

const ActionButton = styled.button<{ isDecline?: boolean }>`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  ${props => props.isDecline ? `
    background: #dc3545;
    &:hover { background: #c82333; transform: scale(1.1); }
  ` : `
    background: #25D366;
    &:hover { background: #20bd5a; transform: scale(1.1); }
  `}
`;

const ButtonLabel = styled.p<{ isDecline?: boolean }>`
  font-size: ${theme.fontSizes.xs};
  color: ${props => props.isDecline ? '#dc3545' : '#25D366'};
  margin-top: 8px;
`;

// Active call screen styles
const ActiveCallContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  color: white;
`;

const RemoteVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
`;

const LocalVideo = styled.video`
  position: absolute;
  bottom: 100px;
  right: 20px;
  width: 120px;
  height: 160px;
  border-radius: 12px;
  object-fit: cover;
  border: 3px solid white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const CallInfo = styled.div`
  text-align: center;
  z-index: 1;
`;

const CallName = styled.h2`
  font-size: 28px;
  margin-bottom: 8px;
`;

const CallStatus = styled.p`
  font-size: 16px;
  opacity: 0.8;
  margin-bottom: 40px;
`;

const CallControls = styled.div`
  display: flex;
  gap: 24px;
  z-index: 1;
`;

const ControlButton = styled.button<{ isActive?: boolean; danger?: boolean }>`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.danger ? '#dc3545' : (props.isActive ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)')};
  
  &:hover {
    background: ${props => props.danger ? '#c82333' : 'rgba(255,255,255,0.2)'};
    transform: scale(1.1);
  }
`;

const ControlLabel = styled.span`
  font-size: 12px;
  color: white;
  margin-top: 8px;
  display: block;
`;

const ControlsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

interface IncomingCallModalProps {
  call: CallSession;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  call,
  onAccept,
  onDecline
}) => {
  const isVideo = call.type === 'video';

  return (
    <Overlay>
      <ModalContainer>
        {isVideo ? (
          <CallTypeIcon>📹</CallTypeIcon>
        ) : (
          <Avatar isVideo={isVideo}>👤</Avatar>
        )}
        
        <Title>{call.callerName}</Title>
        <Subtitle>
          {isVideo ? 'Incoming video call...' : 'Incoming voice call...'}
        </Subtitle>
        
        <ButtonContainer>
          <div>
            <ActionButton onClick={onDecline} isDecline>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.73-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
              </svg>
            </ActionButton>
            <ButtonLabel isDecline>Decline</ButtonLabel>
          </div>
          
          <div>
            <ActionButton onClick={onAccept}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z"/>
              </svg>
            </ActionButton>
            <ButtonLabel>Accept</ButtonLabel>
          </div>
        </ButtonContainer>
      </ModalContainer>
    </Overlay>
  );
};

interface ActiveCallScreenProps {
  call: CallSession;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
}

export const ActiveCallScreen: React.FC<ActiveCallScreenProps> = ({
  call,
  localStream,
  remoteStream,
  isMuted,
  isVideoOff,
  onToggleMute,
  onToggleVideo,
  onEndCall
}) => {
  const localVideoRef = React.useRef<HTMLVideoElement>(null);
  const remoteVideoRef = React.useRef<HTMLVideoElement>(null);
  const isVideo = call.type === 'video';

  React.useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  React.useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <ActiveCallContainer>
      {isVideo && remoteStream && (
        <RemoteVideo ref={remoteVideoRef} autoPlay playsInline />
      )}
      
      {isVideo && localStream && (
        <LocalVideo ref={localVideoRef} autoPlay playsInline muted />
      )}
      
      <CallInfo>
        <CallName>{call.type === 'video' ? call.callerName : call.calleeName}</CallName>
        <CallStatus>Connected</CallStatus>
      </CallInfo>
      
      <CallControls>
        <ControlsWrapper>
          <ControlButton 
            isActive={isMuted} 
            onClick={onToggleMute}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            )}
          </ControlButton>
          <ControlLabel>{isMuted ? "Unmute" : "Mute"}</ControlLabel>
        </ControlsWrapper>
        
        {isVideo && (
          <ControlsWrapper>
            <ControlButton 
              isActive={isVideoOff} 
              onClick={onToggleVideo}
              title={isVideoOff ? "Turn on camera" : "Turn off camera"}
            >
              {isVideoOff ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                </svg>
              )}
            </ControlButton>
            <ControlLabel>{isVideoOff ? "Start Video" : "Stop Video"}</ControlLabel>
          </ControlsWrapper>
        )}
        
        <ControlsWrapper>
          <ControlButton danger onClick={onEndCall} title="End call">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.73-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
            </svg>
          </ControlButton>
          <ControlLabel>End</ControlLabel>
        </ControlsWrapper>
      </CallControls>
    </ActiveCallContainer>
  );
};
