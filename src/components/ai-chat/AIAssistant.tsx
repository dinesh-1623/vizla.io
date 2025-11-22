import React, { useState, useEffect, useCallback } from 'react';
import { ChatButton } from './ChatButton';
import { ChatWindow } from './ChatWindow';
import { sendChatMessage, type ChatMessage, type ChatResponse } from '@/lib/services/aiChat';
import { useSession } from '@/lib/auth';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  dataCards?: any[];
  quickActions?: any[];
  metadata?: Record<string, any>;
}

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const { session } = useSession();

  // Suggested questions based on context
  const suggestedQuestions = [
    "What's our clearance rate today?",
    "Show me blocked vehicles >48h",
    "Who are my top drivers today?",
    "Which zones are at capacity?",
  ];

  // Proactive alerts (would come from monitoring)
  const proactiveAlerts: string[] = [];

  const handleSendMessage = useCallback(async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Convert messages to API format
      const chatMessages: ChatMessage[] = [
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        {
          role: 'user',
          content,
        },
      ];

      const response = await sendChatMessage({
        messages: chatMessages,
        userId: session?.user?.id || 'anonymous',
        context: {
          currentPage: window.location.pathname,
          timestamp: new Date().toISOString(),
        },
      });

      // Add assistant response
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        dataCards: response.dataCards,
        quickActions: response.quickActions,
        metadata: response.metadata,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, session]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleMinimize = () => {
    setIsOpen(false);
  };

  return (
    <>
      <ChatButton
        onClick={handleToggle}
        badgeCount={alertCount}
        isOpen={isOpen}
      />
      <ChatWindow
        isOpen={isOpen}
        onClose={handleClose}
        onMinimize={handleMinimize}
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        suggestedQuestions={suggestedQuestions}
        proactiveAlerts={proactiveAlerts}
      />
    </>
  );
};


