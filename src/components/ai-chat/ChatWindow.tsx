import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Minimize2,
  Send,
  Paperclip,
  Mic,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RobotIcon } from './RobotIcon';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  dataCards?: DataCard[];
  quickActions?: QuickAction[];
  metadata?: Record<string, any>;
}

interface DataCard {
  type: 'metric' | 'vehicle' | 'driver' | 'list' | 'chart';
  title: string;
  data: Record<string, any>;
  actionUrl?: string;
}

interface QuickAction {
  label: string;
  action: string;
  variant?: 'default' | 'outline' | 'secondary';
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  suggestedQuestions?: string[];
  proactiveAlerts?: string[];
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  isOpen,
  onClose,
  onMinimize,
  messages,
  onSendMessage,
  isLoading = false,
  suggestedQuestions = [],
  proactiveAlerts = [],
}) => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleCopy = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-[9998]',
        'w-[400px] h-[600px]',
        'bg-vizla-glass backdrop-blur-xl',
        'border border-vizla-glassBorder rounded-2xl',
        'shadow-2xl',
        'flex flex-col',
        'animate-in slide-in-from-bottom-4 duration-300',
        'md:w-[400px] md:h-[600px]',
        'max-md:w-screen max-md:h-screen max-md:bottom-0 max-md:right-0 max-md:rounded-none'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-vizla-glassBorder">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vizla-brand-primary to-purple-500 flex items-center justify-center">
            <RobotIcon size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-vizla-text-primary">VIZLA AI Assistant</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-vizla-success animate-pulse" />
              <span className="text-xs text-vizla-text-muted">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-vizla-text-secondary hover:text-vizla-text-primary"
            onClick={onMinimize}
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-vizla-text-secondary hover:text-vizla-text-primary"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
          {/* Proactive Alerts */}
          {proactiveAlerts.length > 0 && messages.length === 0 && (
            <div className="space-y-2">
              {proactiveAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-vizla-warning/10 border border-vizla-warning/30"
                >
                  <p className="text-sm text-vizla-text-primary">{alert}</p>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {messages.length === 0 && proactiveAlerts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-vizla-brand-primary to-purple-500 flex items-center justify-center mb-4">
                <RobotIcon size={32} className="text-white" animated />
              </div>
              <h4 className="text-lg font-semibold text-vizla-text-primary mb-2">
                Hi! I'm your AI operations assistant
              </h4>
              <p className="text-sm text-vizla-text-secondary mb-6 max-w-xs">
                I can help you query data, analyze metrics, dispatch vehicles, and more.
              </p>
              {suggestedQuestions.length > 0 && (
                <div className="space-y-2 w-full">
                  <p className="text-xs text-vizla-text-muted mb-2">Try asking:</p>
                  {suggestedQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSendMessage(question)}
                      className="w-full text-left px-4 py-2 rounded-lg bg-vizla-glassElev border border-vizla-glassBorder hover:bg-vizla-glass text-sm text-vizla-text-primary transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' && 'flex-row-reverse',
                message.role === 'system' && 'justify-center'
              )}
            >
              {message.role !== 'system' && message.role !== 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vizla-brand-primary to-purple-500 flex items-center justify-center flex-shrink-0">
                  <RobotIcon size={20} className="text-white" />
                </div>
              )}

              <div
                className={cn(
                  'flex flex-col gap-1 max-w-[80%]',
                  message.role === 'user' && 'items-end',
                  message.role === 'system' && 'items-center w-full'
                )}
              >
                <div
                  className={cn(
                    'rounded-2xl px-4 py-2',
                    message.role === 'user' &&
                      'bg-gradient-to-br from-vizla-brand-primary to-purple-500 text-white rounded-br-sm',
                    message.role === 'assistant' &&
                      'bg-vizla-glassElev border border-vizla-glassBorder text-vizla-text-primary rounded-bl-sm',
                    message.role === 'system' &&
                      'bg-vizla-glass text-vizla-text-muted italic text-xs text-center w-full'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                </div>

                {/* Data Cards */}
                {message.dataCards && message.dataCards.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {message.dataCards.map((card, idx) => (
                      <DataCardComponent key={idx} card={card} />
                    ))}
                  </div>
                )}

                {/* Quick Actions */}
                {message.quickActions && message.quickActions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {message.quickActions.map((action, idx) => (
                      <Button
                        key={idx}
                        variant={action.variant || 'outline'}
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          // Handle action
                          console.log('Action:', action.action);
                        }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Timestamp & Copy */}
                {message.role !== 'system' && (
                  <div className="flex items-center gap-2 text-xs text-vizla-text-muted">
                    <span>{formatTime(message.timestamp)}</span>
                    <button
                      onClick={() => handleCopy(message.id, message.content)}
                      className="hover:text-vizla-text-primary transition-colors"
                    >
                      {copiedId === message.id ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vizla-brand-primary to-purple-500 flex items-center justify-center flex-shrink-0">
                <RobotIcon size={20} className="text-white" animated />
              </div>
              <div className="bg-vizla-glassElev border border-vizla-glassBorder rounded-2xl rounded-bl-sm px-4 py-2">
                <div className="flex items-center gap-1">
                  <Loader2 className="w-4 h-4 text-vizla-brand-primary animate-spin" />
                  <span className="text-sm text-vizla-text-muted">Analyzing data...</span>
                </div>
              </div>
            </div>
          )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-vizla-glassBorder">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about operations..."
              className={cn(
                'w-full resize-none rounded-lg px-4 py-2',
                'bg-vizla-glassElev border border-vizla-glassBorder',
                'text-vizla-text-primary placeholder:text-vizla-text-muted',
                'focus:outline-none focus:ring-2 focus:ring-vizla-brand-primary focus:ring-offset-2',
                'max-h-[120px] overflow-y-auto',
                'text-sm'
              )}
              rows={1}
              maxLength={500}
            />
            <div className="absolute bottom-2 right-2 text-xs text-vizla-text-muted">
              {input.length}/500
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-vizla-text-secondary hover:text-vizla-text-primary"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-vizla-text-secondary hover:text-vizla-text-primary"
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-9 px-4 bg-gradient-to-br from-vizla-brand-primary to-purple-500 hover:opacity-90 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Data Card Component
const DataCardComponent: React.FC<{ card: DataCard }> = ({ card }) => {
  return (
    <div className="rounded-lg bg-vizla-glass border border-vizla-glassBorder p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-vizla-text-primary">{card.title}</h4>
        {card.actionUrl && (
          <a
            href={card.actionUrl}
            className="text-xs text-vizla-brand-primary hover:underline"
          >
            View →
          </a>
        )}
      </div>
      {card.type === 'metric' && (
        <div className="space-y-1">
          {Object.entries(card.data).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-vizla-text-secondary">{key}:</span>
              <span className="text-vizla-text-primary font-semibold">{value}</span>
            </div>
          ))}
        </div>
      )}
      {card.type === 'vehicle' && (
        <div className="space-y-1 text-sm">
          <p className="text-vizla-text-primary font-medium">{card.data.vehicleId}</p>
          <p className="text-vizla-text-secondary">{card.data.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded-full bg-vizla-warning/15 text-vizla-warning text-xs">
              {card.data.status}
            </span>
            <span className="text-xs text-vizla-text-muted">{card.data.age}</span>
          </div>
        </div>
      )}
      {card.type === 'list' && (
        <div className="space-y-1">
          {card.data.items?.map((item: string, idx: number) => (
            <div key={idx} className="text-sm text-vizla-text-secondary">
              • {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

