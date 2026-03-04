import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { chatService, Message } from '../../services/chatService';
import { theme } from '../../styles/theme';
import { Button } from './Button';
import { Card } from './Card';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 500px;
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.lg};
  overflow: hidden;
  border: 1px solid ${theme.colors.gray200};
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

const MessageBubble = styled.div<{ isOwn: boolean }>`
  max-width: 80%;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  background: ${props => props.isOwn ? theme.colors.primary : theme.colors.gray100};
  color: ${props => props.isOwn ? 'white' : theme.colors.textPrimary};
  align-self: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
  font-size: ${theme.fontSizes.sm};
  box-shadow: ${theme.shadows.sm};
`;

const InputArea = styled.form`
  display: flex;
  padding: ${theme.spacing.md};
  gap: ${theme.spacing.sm};
  background: ${theme.colors.surface};
  border-top: 1px solid ${theme.colors.gray200};
`;

const Input = styled.input`
  flex: 1;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.full};
  border: 1px solid ${theme.colors.gray200};
  background: ${theme.colors.background};
  color: ${theme.colors.textPrimary};
  outline: none;

  &:focus {
    border-color: ${theme.colors.primary};
  }
`;

const TimeLabel = styled.div`
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.textSecondary};
  margin-top: 4px;
  text-align: right;
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

  return (
    <ChatContainer>
      <MessageList ref={scrollRef}>
        {messages.map((msg, index) => (
          <MessageBubble key={msg.id || index} isOwn={msg.senderId === currentUserUid}>
            {msg.text}
            <TimeLabel>{formatTime(msg.createdAt)}</TimeLabel>
          </MessageBubble>
        ))}
      </MessageList>
      <InputArea onSubmit={handleSendMessage}>
        <Input
          type="text"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <Button type="submit" variant="primary" size="sm">Send</Button>
      </InputArea>
    </ChatContainer>
  );
};
