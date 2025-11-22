import React from 'react';
import { cn } from '@/lib/utils';

interface RobotIconProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export const RobotIcon: React.FC<RobotIconProps> = ({ 
  className, 
  size = 24,
  animated = false 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        'transition-all duration-300',
        animated && 'animate-pulse',
        className
      )}
    >
      {/* Robot Head */}
      <rect
        x="6"
        y="4"
        width="12"
        height="10"
        rx="2"
        fill="currentColor"
        className="opacity-90"
      />
      
      {/* Robot Eyes */}
      <circle
        cx="10"
        cy="8"
        r="1.5"
        fill="white"
        className={animated ? 'animate-pulse' : ''}
      />
      <circle
        cx="14"
        cy="8"
        r="1.5"
        fill="white"
        className={animated ? 'animate-pulse' : ''}
      />
      
      {/* Robot Antenna */}
      <circle
        cx="12"
        cy="3"
        r="1"
        fill="currentColor"
        className="opacity-70"
      />
      <line
        x1="12"
        y1="3"
        x2="12"
        y2="4"
        stroke="currentColor"
        strokeWidth="1.5"
        className="opacity-70"
      />
      
      {/* Robot Mouth */}
      <rect
        x="10"
        y="10.5"
        width="4"
        height="1.5"
        rx="0.75"
        fill="white"
        className="opacity-80"
      />
      
      {/* Robot Body */}
      <rect
        x="7"
        y="14"
        width="10"
        height="8"
        rx="1.5"
        fill="currentColor"
        className="opacity-80"
      />
      
      {/* Robot Chest Panel */}
      <rect
        x="9"
        y="16"
        width="6"
        height="4"
        rx="0.5"
        fill="white"
        className="opacity-20"
      />
      <line
        x1="11"
        y1="17.5"
        x2="13"
        y2="17.5"
        stroke="currentColor"
        strokeWidth="0.5"
        className="opacity-40"
      />
      <line
        x1="11"
        y1="19"
        x2="13"
        y2="19"
        stroke="currentColor"
        strokeWidth="0.5"
        className="opacity-40"
      />
      
      {/* Robot Arms */}
      <rect
        x="3"
        y="15"
        width="3"
        height="6"
        rx="1.5"
        fill="currentColor"
        className="opacity-70"
      />
      <rect
        x="18"
        y="15"
        width="3"
        height="6"
        rx="1.5"
        fill="currentColor"
        className="opacity-70"
      />
      
      {/* Robot Legs */}
      <rect
        x="8.5"
        y="22"
        width="2.5"
        height="2"
        rx="1"
        fill="currentColor"
        className="opacity-70"
      />
      <rect
        x="13"
        y="22"
        width="2.5"
        height="2"
        rx="1"
        fill="currentColor"
        className="opacity-70"
      />
    </svg>
  );
};


