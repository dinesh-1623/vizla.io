import React, { useMemo, useState } from 'react';
import { QueueGroupCard } from './QueueGroupCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Users, 
  TrendingUp, 
  Play, 
  Pause,
  RotateCcw
} from 'lucide-react';
import { TowCard } from '@/app/tow-driver/data/baltimoreRun';

interface QueueManagerProps {
  vehicles: TowCard[];
  onVehicleClick?: (vehicle: TowCard) => void;
  className?: string;
}

interface QueueGroup {
  id: string;
  title: string;
  vehicles: TowCard[];
  status: 'now' | 'next' | 'later';
  priority: number;
}

export const QueueManager: React.FC<QueueManagerProps> = ({
  vehicles,
  onVehicleClick,
  className = ''
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Queue logic: Now (4 vehicles), Next (4 vehicles), Later (remaining)
  const queueGroups = useMemo((): QueueGroup[] => {
    if (vehicles.length === 0) return [];

    // Sort vehicles by priority and client importance
    const sortedVehicles = [...vehicles].sort((a, b) => {
      // Priority sorting: high-value clients first, then by vehicle age/newer first
      const clientPriority = {
        'Capital One': 1,
        'Wells Fargo': 2,
        'Bank of America': 3,
        'Chase Bank': 4,
        'PNC Bank': 5,
        'M&T Bank': 6,
        'Synchrony Bank': 7,
        'TD Bank': 8
      };
      
      const aPriority = clientPriority[a.client as keyof typeof clientPriority] || 10;
      const bPriority = clientPriority[b.client as keyof typeof clientPriority] || 10;
      
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      // Secondary sort by vehicle year (newer first)
      return b.year - a.year;
    });

    const groups: QueueGroup[] = [];
    
    // Now Group (current batch - 4 vehicles)
    const nowVehicles = sortedVehicles.slice(0, 4);
    if (nowVehicles.length > 0) {
      groups.push({
        id: 'now',
        title: 'Now • Active Batch',
        vehicles: nowVehicles,
        status: 'now',
        priority: 1
      });
    }

    // Next Group (next batch - 4 vehicles)
    const nextVehicles = sortedVehicles.slice(4, 8);
    if (nextVehicles.length > 0) {
      groups.push({
        id: 'next',
        title: 'Next • Ready Queue',
        vehicles: nextVehicles,
        status: 'next',
        priority: 2
      });
    }

    // Later Group (remaining vehicles)
    const laterVehicles = sortedVehicles.slice(8);
    if (laterVehicles.length > 0) {
      groups.push({
        id: 'later',
        title: 'Later • Pending Queue',
        vehicles: laterVehicles,
        status: 'later',
        priority: 3
      });
    }

    return groups;
  }, [vehicles]);

  const totalVehicles = vehicles.length;
  const activeVehicles = queueGroups.find(g => g.status === 'now')?.vehicles.length || 0;
  const pendingVehicles = totalVehicles - activeVehicles;

  const handleStartQueue = () => {
    setIsRunning(true);
    // Simulate queue progression
    console.log('🚀 Queue started - Now group active');
  };

  const handlePauseQueue = () => {
    setIsRunning(false);
    console.log('⏸️ Queue paused');
  };

  const handleResetQueue = () => {
    setIsRunning(false);
    setCurrentTime(new Date());
    console.log('🔄 Queue reset');
  };

  const handleCompleteBatch = (groupId: string) => {
    console.log(`✅ Batch completed: ${groupId}`);
    // In a real implementation, this would move vehicles to completed status
    // and promote the next group to "now"
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Queue Status Header */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-lg font-semibold text-white">Driver Queue</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge className="bg-green-500/20 text-green-400 border-0">
                <Users className="w-3 h-3 mr-1" />
                {totalVehicles} Total
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-400 border-0">
                <TrendingUp className="w-3 h-3 mr-1" />
                {activeVehicles} Active
              </Badge>
              <Badge className="bg-gray-500/20 text-gray-400 border-0">
                {pendingVehicles} Pending
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isRunning ? (
              <Button
                onClick={handleStartQueue}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white border-0"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Queue
              </Button>
            ) : (
              <Button
                onClick={handlePauseQueue}
                size="sm"
                variant="outline"
                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            )}
            
            <Button
              onClick={handleResetQueue}
              size="sm"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Queue Groups */}
      <div className="space-y-3">
        {queueGroups.map((group) => (
          <QueueGroupCard
            key={group.id}
            title={group.title}
            vehicles={group.vehicles}
            status={group.status}
            onVehicleClick={onVehicleClick}
          />
        ))}
      </div>

      {/* Empty State */}
      {queueGroups.length === 0 && (
        <GlassCard className="p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <Clock className="w-12 h-12 text-gray-400 opacity-50" />
            <h3 className="text-lg font-medium text-white">No Vehicles in Queue</h3>
            <p className="text-gray-400 text-sm">
              Add vehicles to start the driver queue workflow
            </p>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
