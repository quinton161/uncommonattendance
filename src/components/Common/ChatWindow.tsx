import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { chatService, Message } from '../../services/chatService';
import { theme } from '../../styles/theme';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 400px;
  background: ${theme.colors.gray50};
  border-radius: ${theme.borderRadius.lg};
  overflow: hidden;
  border: 1px solid ${theme.colors.gray200};
  position: relative;

  @media (max-width: ${theme.breakpoints.tablet}) {
    min-height: calc(100vh - 160px);
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
  z-index: 1;
  align-items: center;
  flex-shrink: 0;
  border-top: 1px solid ${theme.colors.gray200};

  @media (max-width: ${theme.breakpoints.tablet}) {
    padding-bottom: env(safe-area-inset-bottom, 10px);
  }
`;

const Input = styled.input`
  flex: 1;
  padding: 10px 15px;
  border-radius: 20px;
  border: none;
  background: white;
  color: #303030;
  outline: none;
  font-size: ${theme.fontSizes.sm};

  &:focus {
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

const TimeLabel = styled.div<{ isOwn: boolean }>`
  font-size: 10px;
  color: ${props => props.isOwn ? 'rgba(255, 255, 255, 0.7)' : theme.colors.textSecondary};
  margin-top: 4px;
  text-align: right;
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

interface ChatWindowProps {
  studentId: string;
  studentName: string;
  currentUserUid: string;
  studentPhotoUrl?: string;
  currentUserPhotoUrl?: string;
  isAdmin?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  studentId,
  studentName,
  currentUserUid,
  studentPhotoUrl,
  currentUserPhotoUrl,
  isAdmin = false
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [adminUid, setAdminUid] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAdminId = async () => {
      const id = await chatService.getAdminId();
      setAdminUid(id);
    };
    fetchAdminId();

    const unsubscribe = chatService.subscribeToMessages(studentId, (msgs) => {
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [studentId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText('');

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
    <ChatContainer>
      <ChatHeader>
        <Avatar hasPhoto={!!studentPhotoUrl}>
          {studentPhotoUrl ? (
            <AvatarImg src={studentPhotoUrl} alt={studentName} />
          ) : (
            getInitials(studentName)
          )}
        </Avatar>
        <div style={{ fontWeight: 'bold' }}>{studentName}</div>
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
              <MessageText>{msg.text}</MessageText>
              <TimeLabel isOwn={isOwn}>{formatTime(msg.createdAt)}</TimeLabel>
            </MessageBubble>
          );
        })}
      </MessageList>
      <InputArea onSubmit={handleSendMessage}>
        <Input
          type="text"
          placeholder="Type a message"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <SendButton type="submit" disabled={!inputText.trim()}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="white" style={{ margin: 'auto' }}>
            <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
          </svg>
        </SendButton>
      </InputArea>
    </ChatContainer>
  );
};
