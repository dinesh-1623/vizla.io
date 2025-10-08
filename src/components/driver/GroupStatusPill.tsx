import React from 'react';
import { CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';

interface GroupStatusPillProps {
  timeUsed: number; // in hours
  shiftLength: number; // in hours
  vehicleCount: number;
}

export const GroupStatusPill: React.FC<GroupStatusPillProps> = ({
  timeUsed,
  shiftLength,
  vehicleCount
}) => {
  // Calculate percentage of shift used by this group
  const percentage = Math.round((timeUsed / shiftLength) * 100);
  
  // Determine status based on percentage
  const getStatus = (): 'on-track' | 'at-risk' | 'behind' => {
    if (percentage <= 75) return 'on-track';
    if (percentage <= 100) return 'at-risk';
    return 'behind';
  };

  const status = getStatus();

  // Format time display
  const formatTime = (hours: number): string => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'on-track':
        return {
          icon: <CheckCircle className="w-3 h-3" />,
          bgColor: 'bg-green-600/20',
          textColor: 'text-green-400',
          borderColor: 'border-green-600/30',
          label: 'On Track'
        };
      case 'at-risk':
        return {
          icon: <AlertTriangle className="w-3 h-3" />,
          bgColor: 'bg-yellow-500/20',
          textColor: 'text-yellow-400',
          borderColor: 'border-yellow-500/30',
          label: 'At Risk'
        };
      case 'behind':
        return {
          icon: <TrendingUp className="w-3 h-3" />,
          bgColor: 'bg-red-600/20',
          textColor: 'text-red-400',
          borderColor: 'border-red-600/30',
          label: 'Behind'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-250 ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
      {config.icon}
      <span>
        Uses {formatTime(timeUsed)} ({percentage}% of shift)
      </span>
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
        {config.label}
      </span>
    </div>
  );
};
