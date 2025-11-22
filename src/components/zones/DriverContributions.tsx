import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Driver } from '@/lib/zones/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DriverContributionsProps {
  drivers: Driver[];
  title?: string;
}

export const DriverContributions: React.FC<DriverContributionsProps> = ({ 
  drivers, 
  title = "DRIVER CONTRIBUTIONS" 
}) => {
  const getDriverInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getDriverStatus = (driver: Driver) => {
    const utilization = (driver.usedHours / driver.shiftHours) * 100;
    if (utilization <= 80) return 'excellent';
    if (utilization <= 95) return 'good';
    return 'needs-attention';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-emerald-500';
      case 'good':
        return 'bg-amber-500';
      case 'needs-attention':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <TrendingUp className="w-3 h-3 text-emerald-400" />;
      case 'good':
        return <Minus className="w-3 h-3 text-amber-400" />;
      case 'needs-attention':
        return <TrendingDown className="w-3 h-3 text-red-400" />;
      default:
        return <Minus className="w-3 h-3 text-gray-400" />;
    }
  };

  const utilizationPercentage = (driver: Driver) => {
    return (driver.usedHours / driver.shiftHours) * 100;
  };

  return (
    <div className="bg-vizla-glass/50 backdrop-blur-xl border border-vizla-glassBorder rounded-xl p-3">
      <h3 className="text-lg font-semibold text-vizla-text-primary mb-3">{title}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {drivers.map(driver => {
          const status = getDriverStatus(driver);
          const utilization = utilizationPercentage(driver);
          
          return (
            <div key={driver.id} className="bg-vizla-glass/30 backdrop-blur-xl border border-vizla-glassBorder rounded-lg p-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-vizla-glass/50 rounded-full flex items-center justify-center text-sm font-medium text-vizla-text-primary">
                    {getDriverInitials(driver.name)}
                  </div>
                  <div>
                    <div className="font-medium text-vizla-text-primary">{driver.name}</div>
                    <div className="text-sm text-vizla-text-secondary">
                      {driver.towed} tows • {driver.usedHours}h/{driver.shiftHours}h
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(status)}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-vizla-text-secondary">
                  <span>Progress</span>
                  <span>{Math.round(utilization)}%</span>
                </div>
                <Progress 
                  value={utilization} 
                  className="h-2"
                  // @ts-ignore - Progress component might not have className prop
                />
              </div>
              
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-vizla-glassBorder">
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {driver.towed} tows
                </Badge>
                <Badge className={`${getStatusColor(status)}/20 text-${status === 'excellent' ? 'emerald' : status === 'good' ? 'amber' : 'red'}-400 border-${status === 'excellent' ? 'emerald' : status === 'good' ? 'amber' : 'red'}-500/30`}>
                  {status === 'excellent' ? 'On Track' : status === 'good' ? 'At Risk' : 'Behind'}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};



