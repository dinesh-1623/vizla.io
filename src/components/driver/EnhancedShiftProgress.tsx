import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
  Target,
  Zap,
  BarChart3,
  Timer,
  Users,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

interface EnhancedShiftProgressProps {
  totalTimeUsed: number; // in hours
  shiftLength: number; // in hours
  status: 'on-track' | 'at-risk' | 'behind';
  onShiftLengthChange: (hours: number) => void;
  // Advanced metrics
  vehiclesCompleted: number;
  totalVehicles: number;
  averageTimePerVehicle: number;
  efficiencyRating: number; // 0-100
  estimatedCompletion: number; // hours remaining
}

export const EnhancedShiftProgress: React.FC<EnhancedShiftProgressProps> = ({
  totalTimeUsed,
  shiftLength,
  status,
  onShiftLengthChange,
  vehiclesCompleted,
  totalVehicles,
  averageTimePerVehicle,
  efficiencyRating,
  estimatedCompletion
}) => {
  const [showSettings, setShowSettings] = useState(false);
  
  const percentage = Math.min((totalTimeUsed / shiftLength) * 100, 100);
  const completionRate = totalVehicles > 0 ? (vehiclesCompleted / totalVehicles) * 100 : 0;
  
  // Veteran-level status calculation with more granular thresholds
  const getEnhancedStatus = () => {
    if (percentage <= 50) return { status: 'excellent', color: 'green', icon: CheckCircle, label: 'Excellent Pace' };
    if (percentage <= 65) return { status: 'on-track', color: 'green', icon: CheckCircle, label: 'On Track' };
    if (percentage <= 80) return { status: 'good', color: 'blue', icon: Target, label: 'Good Progress' };
    if (percentage <= 95) return { status: 'at-risk', color: 'yellow', icon: AlertTriangle, label: 'At Risk' };
    if (percentage <= 110) return { status: 'behind', color: 'orange', icon: TrendingUp, label: 'Behind Schedule' };
    return { status: 'critical', color: 'red', icon: TrendingUp, label: 'Critical Overrun' };
  };

  const enhancedStatus = getEnhancedStatus();
  const StatusIcon = enhancedStatus.icon;

  // Calculate productivity metrics
  const vehiclesPerHour = totalTimeUsed > 0 ? vehiclesCompleted / totalTimeUsed : 0;
  const projectedCompletion = totalTimeUsed + estimatedCompletion;
  const shiftUtilization = (projectedCompletion / shiftLength) * 100;

  // Color schemes for different statuses
  const getStatusColors = () => {
    switch (enhancedStatus.status) {
      case 'excellent':
        return {
          bg: 'bg-green-600',
          bgLight: 'bg-green-600/20',
          text: 'text-green-400',
          border: 'border-green-600/30',
          progress: 'bg-green-500'
        };
      case 'on-track':
        return {
          bg: 'bg-green-600',
          bgLight: 'bg-green-600/20',
          text: 'text-green-400',
          border: 'border-green-600/30',
          progress: 'bg-green-500'
        };
      case 'good':
        return {
          bg: 'bg-blue-600',
          bgLight: 'bg-blue-600/20',
          text: 'text-blue-400',
          border: 'border-blue-600/30',
          progress: 'bg-blue-500'
        };
      case 'at-risk':
        return {
          bg: 'bg-yellow-500',
          bgLight: 'bg-yellow-500/20',
          text: 'text-yellow-400',
          border: 'border-yellow-500/30',
          progress: 'bg-yellow-500'
        };
      case 'behind':
        return {
          bg: 'bg-orange-500',
          bgLight: 'bg-orange-500/20',
          text: 'text-orange-400',
          border: 'border-orange-500/30',
          progress: 'bg-orange-500'
        };
      case 'critical':
        return {
          bg: 'bg-red-600',
          bgLight: 'bg-red-600/20',
          text: 'text-red-400',
          border: 'border-red-600/30',
          progress: 'bg-red-600'
        };
    }
  };

  const colors = getStatusColors();

  return (
    <div className="bg-gray-900/60 backdrop-blur-md rounded-xl p-6 border border-gray-600/40 shadow-2xl">
      {/* Header with Settings */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-800/50 rounded-lg">
            <Clock className="w-6 h-6 text-gray-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-100">Shift Progress</h2>
            <p className="text-sm text-gray-400">Real-time performance tracking</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className={`${colors.bgLight} ${colors.text} ${colors.border} px-3 py-1`}>
            <StatusIcon className="w-4 h-4 mr-2" />
            {enhancedStatus.label}
          </Badge>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Shift Length Adjuster */}
      {showSettings && (
        <div className="mb-6 p-4 bg-gray-800/30 rounded-lg border border-gray-600/30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">Shift Length:</span>
            </div>
            <div className="flex-1 max-w-xs">
              <Slider
                value={[shiftLength]}
                onValueChange={([value]) => onShiftLengthChange(value)}
                max={12}
                min={1}
                step={0.5}
                className="w-full"
              />
            </div>
            <div className="text-sm font-medium text-gray-200 min-w-[3rem] text-center">
              {shiftLength}h
            </div>
          </div>
        </div>
      )}

      {/* Main Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Primary Progress Bar */}
        <div className="lg:col-span-2">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-300">
                <span className="font-medium">{totalTimeUsed.toFixed(1)}h</span> used of{' '}
                <span className="font-medium">{shiftLength}h</span> shift
              </div>
              <div className="text-sm font-bold text-gray-100">
                {percentage.toFixed(0)}%
              </div>
            </div>
            
            <div className="relative">
              <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                <div 
                  className={`h-4 rounded-full transition-all duration-500 ease-out ${colors.progress}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              {/* Milestone markers */}
              <div className="absolute top-0 left-0 w-full h-4 flex justify-between items-center pointer-events-none">
                <div className="w-0.5 h-2 bg-gray-600 ml-[25%]"></div>
                <div className="w-0.5 h-2 bg-gray-600 ml-[50%]"></div>
                <div className="w-0.5 h-2 bg-gray-600 ml-[75%]"></div>
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-400">
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Time Remaining/Over */}
        <div className="flex flex-col justify-center">
          <div className={`p-4 rounded-lg ${colors.bgLight} ${colors.border} border`}>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-100 mb-1">
                {totalTimeUsed < shiftLength 
                  ? `${(shiftLength - totalTimeUsed).toFixed(1)}h`
                  : `+${(totalTimeUsed - shiftLength).toFixed(1)}h`
                }
              </div>
              <div className={`text-sm font-medium ${colors.text}`}>
                {totalTimeUsed < shiftLength ? 'Remaining' : 'Over Schedule'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vehicle Progress */}
        <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-600/20">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Vehicles</span>
          </div>
          <div className="text-xl font-bold text-gray-100">
            {vehiclesCompleted}/{totalVehicles}
          </div>
          <div className="text-xs text-gray-400">
            {completionRate.toFixed(0)}% complete
          </div>
        </div>

        {/* Efficiency */}
        <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-600/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Efficiency</span>
          </div>
          <div className="text-xl font-bold text-gray-100">
            {efficiencyRating}%
          </div>
          <div className="text-xs text-gray-400">
            {vehiclesPerHour.toFixed(1)} vehicles/hr
          </div>
        </div>

        {/* Average Time */}
        <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-600/20">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-green-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Avg Time</span>
          </div>
          <div className="text-xl font-bold text-gray-100">
            {averageTimePerVehicle.toFixed(1)}h
          </div>
          <div className="text-xs text-gray-400">
            per vehicle
          </div>
        </div>

        {/* Projected Completion */}
        <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-600/20">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Projected</span>
          </div>
          <div className="text-xl font-bold text-gray-100">
            {projectedCompletion.toFixed(1)}h
          </div>
          <div className="text-xs text-gray-400">
            total completion
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div className={`mt-6 p-4 rounded-lg ${colors.bgLight} ${colors.border} border`}>
        <div className="flex items-center gap-3">
          <StatusIcon className={`w-5 h-5 ${colors.text}`} />
          <div>
            <div className={`font-medium ${colors.text}`}>
              {enhancedStatus.label}
            </div>
            <div className="text-sm text-gray-300">
              {status === 'on-track' && 'You\'re maintaining excellent progress through your shift.'}
              {status === 'at-risk' && 'Consider optimizing routes or increasing efficiency to stay on schedule.'}
              {status === 'behind' && 'Focus on high-priority vehicles and consider requesting assistance.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
