import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { chatService, Message } from '../../services/chatService';
import { callService } from '../../services/callService';
import { presenceService } from '../../services/presenceService';
import { webrtcService } from '../../services/webrtcService';
import { theme } from '../../styles/theme';
import { IncomingCallModal, ActiveCallScreen } from './CallModals';
import { CallSession } from '../../types';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  min-height: 0;
  background: ${theme.colors.gray50};
  border-radius: ${theme.borderRadius.lg};
  overflow: hidden;
  border: 1px solid ${theme.colors.gray200};
  position: relative;

  @media (max-width: ${theme.breakpoints.tablet}) {
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
`;

const ChatHeader = styled.div`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: ${theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  z-index: 1;
  box-shadow: ${theme.shadows.sm};
  flex-shrink: 0;
`;

const Avatar = styled.div<{ hasPhoto?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.hasPhoto ? 'transparent' : 'rgba(255, 255, 255, 0.2)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  overflow: hidden;
`;

const AvatarImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* Momentum scrolling for Safari/iOS */
  padding: ${theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 1;
  min-height: 0;
  overflow-anchor: none;
  
  /* Custom Scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
`;

const MessageBubble = styled.div<{ isOwn: boolean }>`
  max-width: 85%;
  padding: 8px 12px;
  border-radius: 12px;
  background: ${props => props.isOwn ? theme.colors.primary : theme.colors.white};
  color: ${props => props.isOwn ? theme.colors.white : theme.colors.textPrimary};
  align-self: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
  font-size: ${theme.fontSizes.sm};
  box-shadow: ${theme.shadows.sm};
  position: relative;
  line-height: 1.4;
  border: 1px solid ${props => props.isOwn ? 'transparent' : theme.colors.gray200};
`;

const MessageText = styled.div`
  margin-right: 20px;
`;

const InputArea = styled.form`
  display: flex;
  padding: 10px;
  gap: 10px;
  background: #f0f0f0;
  z-index: 10;
  align-items: center;
  flex-shrink: 0;
  border-top: 1px solid ${theme.colors.gray200};
  position: sticky;
  bottom: 0;

  @media (max-width: ${theme.breakpoints.tablet}) {
    padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
  }
`;

const Input = styled.input`
  flex: 1;
  padding: 10px 15px;
  border-radius: 20px;
  border: 1px solid ${theme.colors.gray200};
  background: white;
  color: #303030;
  outline: none;
  font-size: 16px; /* Prevents auto-zoom on iOS Safari */

  &:focus {
    box-shadow: 0 0 0 2px ${theme.colors.primary}40;
    border-color: ${theme.colors.primary};
  }

  @media (min-width: ${theme.breakpoints.tablet}) {
    font-size: ${theme.fontSizes.sm};
  }
`;

const TimeLabel = styled.div<{ isOwn: boolean }>`
  font-size: 10px;
  color: ${props => props.isOwn ? 'rgba(255, 255, 255, 0.7)' : theme.colors.textSecondary};
  margin-top: 4px;
  text-align: right;
`;

const ReadReceipt = styled.span`
  color: #53bdeb;
  margin-left: 4px;
`;

const VoiceRecordContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: ${theme.colors.gray100};
  border-radius: 20px;
`;

const RecordButton = styled.button<{ isRecording: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: ${props => props.isRecording ? '#f44336' : theme.colors.primary};
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
`;

const RecordingTimer = styled.span`
  font-size: 14px;
  color: #f44336;
  font-weight: 500;
`;

const VoiceMessageContainer = styled.div<{ isOwn: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: ${props => props.isOwn ? theme.colors.primary : theme.colors.gray100};
  border-radius: 16px;
  min-width: 150px;
  max-width: 250px;
`;

const PlayButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.3);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AudioProgress = styled.div`
  flex: 1;
  height: 4px;
  background: rgba(255,255,255,0.3);
  border-radius: 2px;
`;

const AudioDuration = styled.span`
  font-size: 12px;
  color: rgba(255,255,255,0.8);
`;

const SendButton = styled.button`
  border-radius: 50%;
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${theme.colors.primary};
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background-color: ${theme.colors.primaryDark};
    transform: scale(1.05);
  }

  &:disabled {
    background-color: ${theme.colors.gray300};
    cursor: not-allowed;
  }
`;

const OnlineStatusDot = styled.span<{ isOnline: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${props => props.isOnline ? '#25D366' : theme.colors.gray400};
  display: inline-block;
  margin-right: 6px;
`;

const CallButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  color: white;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CallButtonsContainer = styled.div`
  display: flex;
  gap: 4px;
`;

const StatusText = styled.span<{ isOnline: boolean }>`
  font-size: ${theme.fontSizes.xs};
  color: ${props => props.isOnline ? '#25D366' : theme.colors.gray400};
`;

const TypingIndicator = styled.div`
  padding: 8px 16px;
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.textSecondary};
  font-style: italic;
`;

const TypingDot = styled.span`
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${theme.colors.textSecondary};
  margin: 0 2px;
  animation: typing 1.4s infinite ease-in-out;
  
  &:nth-child(1) { animation-delay: 0s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.4s; }
  
  @keyframes typing {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30% { transform: translateY(-4px); opacity: 1; }
  }
`;

interface ChatWindowProps {
  studentId: string;
  studentName: string;
  currentUserUid: string;
  currentUserName?: string;
  studentPhotoUrl?: string;
  currentUserPhotoUrl?: string;
  isAdmin?: boolean;
  adminUid?: string;
  adminPhotoUrl?: string;
  adminName?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  studentId,
  studentName,
  currentUserUid,
  currentUserName,
  studentPhotoUrl,
  currentUserPhotoUrl,
  isAdmin = false,
  adminUid: providedAdminUid,
  adminPhotoUrl: providedAdminPhotoUrl,
  adminName: providedAdminName
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [adminUid, setAdminUid] = useState<string>(providedAdminUid || '');
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [typingUsers, setTypingUsers] = useState<{ userId: string; userName: string }[]>([]);
  
  // Get the other user's ID based on context
  const otherUserId = isAdmin ? studentId : providedAdminUid || '';
  const otherUserName = isAdmin ? studentName : (providedAdminName || 'Admin');

  useEffect(() => {
    if (!adminUid) return;

    if (!providedAdminUid) {
      const fetchAdminId = async () => {
        const id = await chatService.getAdminId();
        setAdminUid(id);
      };
      fetchAdminId();
    } else {
      setAdminUid(providedAdminUid);
    }

    // Use composite ID for unique student-admin conversation
    const conversationId = `${studentId}_${adminUid}`;

    const unsubscribe = chatService.subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      
      // Mark messages as read when received
      msgs.forEach(msg => {
        if (msg.senderId !== currentUserUid && msg.id) {
          chatService.markMessageAsRead(conversationId, msg.id, currentUserUid);
        }
      });
    });

    return () => unsubscribe();
  }, [studentId, adminUid, providedAdminUid]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!adminUid) return;
    
    const conversationId = `${studentId}_${adminUid}`;
    const unsubscribe = chatService.subscribeToTyping(conversationId, (users) => {
      // Filter out current user
      setTypingUsers(users.filter(u => u.userId !== currentUserUid));
    });
    
    return () => unsubscribe();
  }, [studentId, adminUid, currentUserUid]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Check online status of the other user
  useEffect(() => {
    if (!otherUserId) return;
    
    const checkOnlineStatus = async () => {
      const isOnline = await presenceService.isUserOnline(otherUserId);
      setIsOtherUserOnline(isOnline);
    };
    
    checkOnlineStatus();
    // Check every 10 seconds
    const interval = setInterval(checkOnlineStatus, 10000);
    
    return () => clearInterval(interval);
  }, [otherUserId]);

  const handleVoiceCall = async () => {
    if (isCalling) return;
    setIsCalling(true);
    try {
      await callService.initiateCall(otherUserId, otherUserName, 'voice');
    } catch (error) {
      console.error('Failed to initiate voice call:', error);
    } finally {
      setIsCalling(false);
    }
  };

  const handleVideoCall = async () => {
    if (isCalling) return;
    setIsCalling(true);
    try {
      await callService.initiateCall(otherUserId, otherUserName, 'video');
    } catch (error) {
      console.error('Failed to initiate video call:', error);
    } finally {
      setIsCalling(false);
    }
  };

  // Set up WebRTC callbacks
  useEffect(() => {
    webrtcService.setCallbacks(
      (stream) => setLocalStream(stream),
      (stream) => setRemoteStream(stream),
      (state) => {
        if (state === 'ended') {
          setActiveCall(null);
          setLocalStream(null);
          setRemoteStream(null);
        }
      }
    );

    // Listen for incoming calls
    callService.setCallCallbacks(
      (call) => {
        if (call) setIncomingCall(call);
      },
      (call) => {
        if (!call) setIncomingCall(null);
      },
      (message) => {
        webrtcService.handleSignalingMessage(message);
      }
    );
  }, []);

  const handleAcceptCall = async () => {
    if (!incomingCall) return;
    try {
      await callService.acceptCall(incomingCall.id);
      await webrtcService.answerCall(incomingCall.id, incomingCall.type);
      setActiveCall(incomingCall);
      setIncomingCall(null);
    } catch (error) {
      console.error('Failed to accept call:', error);
    }
  };

  const handleDeclineCall = async () => {
    if (!incomingCall) return;
    try {
      await callService.declineCall(incomingCall.id);
      setIncomingCall(null);
    } catch (error) {
      console.error('Failed to decline call:', error);
    }
  };

  const handleEndCall = () => {
    webrtcService.endCall();
    setActiveCall(null);
  };

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    webrtcService.toggleMute(newMuted);
  };

  const handleToggleVideo = () => {
    const newVideoOff = !isVideoOff;
    setIsVideoOff(newVideoOff);
    webrtcService.toggleVideo(!newVideoOff);
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedAudio(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start timer to track duration
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordedAudio(null);
      setRecordingDuration(0);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const sendVoiceMessage = async () => {
    if (!recordedAudio || !adminUid) return;

    try {
      await chatService.sendVoiceMessage(
        studentId,
        studentName,
        currentUserUid,
        recordedAudio,
        recordingDuration,
        isAdmin ? currentUserUid : adminUid,
        currentUserPhotoUrl
      );
      setRecordedAudio(null);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to send voice message:', error);
    }
  };

  // Audio playback function
  const playAudio = (audioUrl: string, messageId: string) => {
    if (playingAudioId === messageId) {
      // Stop playing
      setPlayingAudioId(null);
    } else {
      // Start playing
      const audio = new Audio(audioUrl);
      audio.onended = () => setPlayingAudioId(null);
      audio.play();
      setPlayingAudioId(messageId);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText('');

    // Clear typing indicator when sending
    if (adminUid) {
      const conversationId = `${studentId}_${adminUid}`;
      chatService.setTyping(conversationId, currentUserUid, currentUserName || 'User', false);
    }

    try {
      await chatService.sendMessage(
        studentId,
        studentName,
        currentUserUid,
        text,
        isAdmin ? currentUserUid : adminUid,
        currentUserPhotoUrl
      );
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const formatTime = (createdAt: any) => {
    if (!createdAt) return '';
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <>
      {incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}
      
      {activeCall && (
        <ActiveCallScreen
          call={activeCall}
          localStream={localStream}
          remoteStream={remoteStream}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          onToggleMute={handleToggleMute}
          onToggleVideo={handleToggleVideo}
          onEndCall={handleEndCall}
        />
      )}
      
      <ChatContainer>
        <ChatHeader>
        <Avatar hasPhoto={!!studentPhotoUrl}>
          {isAdmin ? (
            studentPhotoUrl ? (
              <AvatarImg src={studentPhotoUrl} alt={studentName} />
            ) : (
              getInitials(studentName)
            )
          ) : (
            // If student is viewing, show the admin's photo/initials
            providedAdminPhotoUrl ? (
              <AvatarImg src={providedAdminPhotoUrl} alt={providedAdminName || "Admin"} />
            ) : (
              getInitials(providedAdminName || "Admin")
            )
          )}
        </Avatar>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold' }}>{isAdmin ? studentName : (providedAdminName || "Admin")}</div>
          <StatusText isOnline={isOtherUserOnline}>
            <OnlineStatusDot isOnline={isOtherUserOnline} />
            {isOtherUserOnline ? 'online' : 'offline'}
          </StatusText>
        </div>
        <CallButtonsContainer>
          <CallButton onClick={handleVoiceCall} disabled={isCalling || !otherUserId} title="Voice call">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
            </svg>
          </CallButton>
          <CallButton onClick={handleVideoCall} disabled={isCalling || !otherUserId} title="Video call">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
            </svg>
          </CallButton>
        </CallButtonsContainer>
      </ChatHeader>
      <MessageList ref={scrollRef}>
        {messages.map((msg, index) => {
          const isOwn = msg.senderId === currentUserUid;
          return (
            <MessageBubble key={msg.id || index} isOwn={isOwn}>
              {!isOwn && msg.senderPhotoUrl && (
                <Avatar 
                  hasPhoto={true} 
                  style={{ 
                    width: 24, 
                    height: 24, 
                    fontSize: 10,
                    position: 'absolute',
                    left: 8,
                    top: 8
                  }}
                >
                  <AvatarImg src={msg.senderPhotoUrl} alt="" />
                </Avatar>
              )}
              {/* Voice message or text message */}
              {msg.messageType === 'voice' && msg.audioUrl ? (
                <VoiceMessageContainer isOwn={isOwn}>
                  <PlayButton onClick={() => playAudio(msg.audioUrl!, msg.id || '')}>
                    {playingAudioId === msg.id ? (
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
                        <path d="M6 6h12v12H6z"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </PlayButton>
                  <AudioProgress />
                  <AudioDuration>{msg.audioDuration || 0}s</AudioDuration>
                </VoiceMessageContainer>
              ) : (
                <MessageText>{msg.text}</MessageText>
              )}
              <TimeLabel isOwn={isOwn}>
                {formatTime(msg.createdAt)}
                {/* Read receipt indicator */}
                {isOwn && msg.readBy && msg.readBy.includes(isAdmin ? studentId : adminUid) && (
                  <ReadReceipt>✓✓</ReadReceipt>
                )}
              </TimeLabel>
            </MessageBubble>
          );
        })}
      </MessageList>
      
      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <TypingIndicator>
          <TypingDot />
          <TypingDot />
          <TypingDot />
          {' '}{typingUsers[0].userName} is typing...
        </TypingIndicator>
      )}
      
      {/* Voice recording UI */}
      {isRecording ? (
        <VoiceRecordContainer>
          <RecordButton isRecording={true} onClick={stopRecording}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </RecordButton>
          <RecordingTimer>Recording: {recordingDuration}s</RecordingTimer>
          <RecordButton isRecording={false} onClick={cancelRecording} style={{ marginLeft: 'auto', background: '#9e9e9e' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </RecordButton>
        </VoiceRecordContainer>
      ) : recordedAudio ? (
        <VoiceRecordContainer>
          <RecordButton isRecording={false} onClick={sendVoiceMessage} style={{ background: '#4caf50' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </RecordButton>
          <RecordingTimer>Voice message ({recordingDuration}s)</RecordingTimer>
          <RecordButton isRecording={false} onClick={() => { setRecordedAudio(null); setRecordingDuration(0); }} style={{ marginLeft: 'auto', background: '#9e9e9e' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </RecordButton>
        </VoiceRecordContainer>
      ) : (
      <InputArea onSubmit={handleSendMessage}>
        <Input
          type="text"
          placeholder="Type a message"
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            // Notify other user that we're typing
            if (adminUid && e.target.value) {
              const conversationId = `${studentId}_${adminUid}`;
              chatService.setTyping(conversationId, currentUserUid, currentUserName || 'User', true);
            }
          }}
        />
        {/* Microphone button for voice recording */}
        <RecordButton isRecording={false} onClick={startRecording} style={{ marginRight: '4px' }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </RecordButton>
        <SendButton type="submit" disabled={!inputText.trim()}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="white" style={{ margin: 'auto' }}>
            <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
          </svg>
        </SendButton>
      </InputArea>
      )}
    </ChatContainer>
    </>
  );
};
