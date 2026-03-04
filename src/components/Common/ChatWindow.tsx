import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { chatService, Message } from '../../services/chatService';
import { theme } from '../../styles/theme';
import { Button } from './Button';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 600px;
  background: #e5ddd5; /* WhatsApp background color */
  border-radius: ${theme.borderRadius.lg};
  overflow: hidden;
  border: 1px solid ${theme.colors.gray200};
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url("https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e71a95133d560753066577f51.png");
    opacity: 0.06;
    pointer-events: none;
  }
`;

const ChatHeader = styled.div`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: #075e54; /* WhatsApp Green */
  color: white;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  z-index: 1;
  box-shadow: ${theme.shadows.sm};
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${theme.colors.gray300};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #075e54;
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 1;
  
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
  padding: 6px 12px 8px;
  border-radius: 8px;
  background: ${props => props.isOwn ? '#dcf8c6' : '#ffffff'};
  color: #303030;
  align-self: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
  font-size: ${theme.fontSizes.sm};
  box-shadow: 0 1px 0.5px rgba(0, 0, 0, 0.13);
  position: relative;
  line-height: 1.4;

  /* WhatsApp bubble tail */
  &::after {
    content: "";
    position: absolute;
    top: 0;
    width: 0;
    height: 0;
    border: 8px solid transparent;
    ${props => props.isOwn ? `
      right: -8px;
      border-left-color: #dcf8c6;
      border-top-color: #dcf8c6;
    ` : `
      left: -8px;
      border-right-color: #ffffff;
      border-top-color: #ffffff;
    `}
  }
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

const TimeLabel = styled.div`
  font-size: 11px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: -4px;
  text-align: right;
  height: 15px;
`;

interface ChatWindowProps {
  studentId: string;
  studentName: string;
  currentUserUid: string;
  isAdmin?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  studentId,
  studentName,
  currentUserUid,
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
        isAdmin ? currentUserUid : adminUid
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
        <Avatar>{getInitials(studentName)}</Avatar>
        <div style={{ fontWeight: 'bold' }}>{studentName}</div>
      </ChatHeader>
      <MessageList ref={scrollRef}>
        {messages.map((msg, index) => (
          <MessageBubble key={msg.id || index} isOwn={msg.senderId === currentUserUid}>
            <MessageText>{msg.text}</MessageText>
            <TimeLabel>{formatTime(msg.createdAt)}</TimeLabel>
          </MessageBubble>
        ))}
      </MessageList>
      <InputArea onSubmit={handleSendMessage}>
        <Input
          type="text"
          placeholder="Type a message"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <Button type="submit" variant="primary" size="sm" style={{ borderRadius: '50%', width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyItems: 'center', backgroundColor: '#075e54', border: 'none' }}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="white" style={{ margin: 'auto' }}>
            <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
          </svg>
        </Button>
      </InputArea>
    </ChatContainer>
  );
};
