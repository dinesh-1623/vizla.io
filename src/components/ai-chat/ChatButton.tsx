import React from 'react';
import { cn } from '@/lib/utils';
import { RobotIcon } from './RobotIcon';

interface ChatButtonProps {
  onClick: () => void;
  badgeCount?: number;
  isOpen?: boolean;
}

export const ChatButton: React.FC<ChatButtonProps> = ({ onClick, badgeCount = 0, isOpen = false }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-[9999]',
        'w-[60px] h-[60px] rounded-full',
        'bg-gradient-to-br from-vizla-brand-primary to-purple-500',
        'shadow-lg shadow-vizla-brand-primary/30',
        'flex items-center justify-center',
        'transition-all duration-300',
        'hover:scale-110 hover:shadow-xl hover:shadow-vizla-brand-primary/40',
        'focus:outline-none focus:ring-2 focus:ring-vizla-brand-primary focus:ring-offset-2 focus:ring-offset-vizla-canvas',
        isOpen && 'scale-90 opacity-0 pointer-events-none',
        'animate-pulse'
      )}
      aria-label="Open AI Assistant"
    >
      <RobotIcon size={28} className="text-white" animated={!isOpen} />
      
      {badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-vizla-danger text-white text-xs font-bold flex items-center justify-center animate-bounce">
          {badgeCount > 9 ? '9+' : badgeCount}
        </span>
      )}
    </button>
  );
};

