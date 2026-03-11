import React from 'react';
import styled from 'styled-components';
import { CallSession } from '../../types';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #075e54; /* WhatsApp Dark Green */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 60px 20px 80px;
  z-index: 10000;
  animation: fadeIn 0.3s ease;
  color: white;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContainer = styled.div`
  text-align: center;
  width: 100%;
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

const Avatar = styled.div<{ isVideo?: boolean }>`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30px;
  font-size: 60px;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
`;

const Title = styled.h2`
  font-size: 32px;
  color: white;
  margin-bottom: 12px;
  font-weight: 400;
`;

const Subtitle = styled.p`
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 24px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-around;
  width: 100%;
  max-width: 400px;
`;

const ActionButton = styled.button<{ isDecline?: boolean }>`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

  ${props => props.isDecline ? `
    background: #ff3b30;
    &:hover { background: #e0352b; transform: scale(1.05); }
  ` : `
    background: #4cd964;
    &:hover { background: #44c359; transform: scale(1.05); }
  `}

  svg {
    width: 32px;
    height: 32px;
  }
`;

const ButtonLabel = styled.p`
  font-size: 14px;
  color: white;
  margin-top: 12px;
  font-weight: 500;
`;

// Active call screen styles
const ActiveCallContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #075e54;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10000;
  color: white;
`;

const RemoteVideoContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RemoteVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const LocalVideo = styled.video`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 100px;
  height: 150px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  z-index: 10;
`;

const CallInfoOverlay = styled.div<{ isVideo?: boolean }>`
  text-align: center;
  z-index: 5;
  padding-top: 60px;
  width: 100%;
  background: ${props => props.isVideo ? 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)' : 'transparent'};
  padding-bottom: 40px;
`;

const CallName = styled.h2`
  font-size: 32px;
  margin-bottom: 8px;
  font-weight: 400;
`;

const CallStatus = styled.p`
  font-size: 16px;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const CallControlsBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  padding: 20px 10px 40px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 5;
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
  background: ${props => props.danger ? '#ff3b30' : (props.isActive ? 'white' : 'rgba(255, 255, 255, 0.2)')};
  color: ${props => props.isActive ? '#075e54' : 'white'};
  
  &:hover {
    transform: scale(1.1);
  }

  svg {
    width: 28px;
    height: 28px;
    fill: currentColor;
  }
`;

const ControlsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const ControlLabel = styled.span`
  font-size: 12px;
  color: white;
  font-weight: 500;
`;

const VoiceCallBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #075e54;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const VoiceAvatar = styled.div`
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 20px;
  overflow: hidden;
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
        <Avatar isVideo={isVideo}>
          {isVideo ? '📹' : '👤'}
        </Avatar>
        
        <Title>{call.callerName}</Title>
        <Subtitle>
          {isVideo ? 'WhatsApp Video Call' : 'WhatsApp Voice Call'}
        </Subtitle>
      </ModalContainer>
      
      <ButtonContainer>
        <ControlsWrapper>
          <ActionButton onClick={onDecline} isDecline>
            <svg viewBox="0 0 24 24" fill="white">
              <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.73-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
            </svg>
          </ActionButton>
          <ButtonLabel>Decline</ButtonLabel>
        </ControlsWrapper>
        
        <ControlsWrapper>
          <ActionButton onClick={onAccept}>
            <svg viewBox="0 0 24 24" fill="white">
              <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z"/>
            </svg>
          </ActionButton>
          <ButtonLabel>Accept</ButtonLabel>
        </ControlsWrapper>
      </ButtonContainer>
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
      {isVideo ? (
        <>
          <RemoteVideoContainer>
            {remoteStream ? (
              <RemoteVideo ref={remoteVideoRef} autoPlay playsInline />
            ) : (
              <VoiceAvatar>👤</VoiceAvatar>
            )}
          </RemoteVideoContainer>
          
          {localStream && !isVideoOff && (
            <LocalVideo ref={localVideoRef} autoPlay playsInline muted />
          )}
        </>
      ) : (
        <VoiceCallBackground>
          <VoiceAvatar>👤</VoiceAvatar>
        </VoiceCallBackground>
      )}
      
      <CallInfoOverlay isVideo={isVideo}>
        <CallName>{call.type === 'video' ? call.callerName : call.calleeName}</CallName>
        <CallStatus>{remoteStream ? 'Ongoing Call' : 'Connecting...'}</CallStatus>
      </CallInfoOverlay>
      
      <CallControlsBar>
        <ControlsWrapper>
          <ControlButton 
            isActive={isMuted} 
            onClick={onToggleMute}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg viewBox="0 0 24 24">
                <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24">
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
                <svg viewBox="0 0 24 24">
                  <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                </svg>
              )}
            </ControlButton>
            <ControlLabel>{isVideoOff ? "Start Video" : "Stop Video"}</ControlLabel>
          </ControlsWrapper>
        )}
        
        <ControlsWrapper>
          <ControlButton danger onClick={onEndCall} title="End call">
            <svg viewBox="0 0 24 24" fill="white">
              <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.73-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
            </svg>
          </ControlButton>
          <ControlLabel>End</ControlLabel>
        </ControlsWrapper>
      </CallControlsBar>
    </ActiveCallContainer>
  );
};
