import React from 'react';
import { Clock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface ShiftUtilizationMeterProps {
  totalTimeUsed: number; // in hours
  shiftLength: number; // in hours (default 12h)
  status: 'on-track' | 'at-risk' | 'behind';
}

export const ShiftUtilizationMeter: React.FC<ShiftUtilizationMeterProps> = ({
  totalTimeUsed,
  shiftLength,
  status
}) => {
  const percentage = Math.min((totalTimeUsed / shiftLength) * 100, 100);
  
  // Determine colors based on status
  const getStatusColor = () => {
    switch (status) {
      case 'on-track':
        return 'bg-green-600';
      case 'at-risk':
        return 'bg-yellow-500';
      case 'behind':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'on-track':
        return <CheckCircle className="w-4 h-4" />;
      case 'at-risk':
        return <AlertTriangle className="w-4 h-4" />;
      case 'behind':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'on-track':
        return 'On Track';
      case 'at-risk':
        return 'At Risk';
      case 'behind':
        return 'Behind';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-gray-900/40 backdrop-blur-sm rounded-lg p-4 border border-gray-600/30 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-100">Shift Utilization</h3>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
          status === 'on-track' ? 'bg-green-600/20 text-green-400 border border-green-600/30' :
          status === 'at-risk' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
          'bg-red-600/20 text-red-400 border border-red-600/30'
        }`}>
          {getStatusIcon()}
          {getStatusText()}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-300">
          <span>{totalTimeUsed.toFixed(1)}h used</span>
          <span>{shiftLength}h shift</span>
        </div>
        
        <div className="relative">
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-250 ${getStatusColor()}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-100">
              {percentage.toFixed(0)}%
            </span>
          </div>
        </div>
        
        <div className="text-xs text-gray-400 text-center">
          {totalTimeUsed < shiftLength 
            ? `${(shiftLength - totalTimeUsed).toFixed(1)}h remaining`
            : `${(totalTimeUsed - shiftLength).toFixed(1)}h over`
          }
        </div>
      </div>
    </div>
  );
};
