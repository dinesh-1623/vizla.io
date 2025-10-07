import React from 'react';
import { AssignmentResult } from '@/lib/assignment/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  Users, 
  Zap,
  TrendingUp,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface AssignmentSummaryProps {
  result: AssignmentResult;
  onReassign?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

export const AssignmentSummary: React.FC<AssignmentSummaryProps> = ({
  result,
  onReassign,
  onViewDetails,
  className = ''
}) => {
  const { assignmentSummary, driverUtilization } = result;
  const { assignedCount, unassignedCount, zoneMatches, processingTimeMs } = assignmentSummary;
  
  const successRate = assignmentSummary.totalVehicles > 0 
    ? Math.round((assignedCount / assignmentSummary.totalVehicles) * 100)
    : 0;

  const zoneMatchRate = assignedCount > 0 
    ? Math.round((zoneMatches / assignedCount) * 100)
    : 0;

  return (
    <GlassCard className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Auto-Assignment Complete</h3>
            <p className="text-gray-300 text-sm">
              Processed in {processingTimeMs}ms • {successRate}% success rate
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {onReassign && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReassign}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reassign
            </Button>
          )}
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewDetails}
              className="border-white/20 text-white hover:bg-white/10"
            >
              View Details
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-lg mx-auto mb-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">{assignedCount}</div>
          <div className="text-sm text-gray-400">Assigned</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-amber-500/20 rounded-lg mx-auto mb-2">
            <AlertCircle className="w-6 h-6 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{unassignedCount}</div>
          <div className="text-sm text-gray-400">Pending</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-lg mx-auto mb-2">
            <MapPin className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{zoneMatchRate}%</div>
          <div className="text-sm text-gray-400">Zone Match</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-lg mx-auto mb-2">
            <Zap className="w-6 h-6 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{processingTimeMs}ms</div>
          <div className="text-sm text-gray-400">Processing</div>
        </div>
      </div>

      {/* Assignment Breakdown */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-white flex items-center gap-2">
          <Users className="w-5 h-5" />
          Driver Utilization
        </h4>
        
        <div className="space-y-3">
          {driverUtilization.slice(0, 5).map((driver) => (
            <div key={driver.driverId} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div>
                  <div className="text-white font-medium">{driver.driverName}</div>
                  <div className="text-sm text-gray-400">
                    {driver.assignedCount} vehicles • {driver.zones.join(', ')} zone
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`border-0 ${
                    driver.capacityUtilization > 0.8 
                      ? 'bg-red-500/20 text-red-400' 
                      : driver.capacityUtilization > 0.6
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-green-500/20 text-green-400'
                  }`}
                >
                  {Math.round(driver.capacityUtilization * 100)}% utilized
                </Badge>
              </div>
            </div>
          ))}
          
          {driverUtilization.length > 5 && (
            <div className="text-center text-sm text-gray-400">
              +{driverUtilization.length - 5} more drivers
            </div>
          )}
        </div>
      </div>

      {/* Performance Badge */}
      {processingTimeMs < 200 && (
        <div className="mt-4 flex items-center justify-center">
          <Badge className="bg-green-500/20 text-green-400 border-0">
            <TrendingUp className="w-3 h-3 mr-1" />
            High Performance ({processingTimeMs}ms)
          </Badge>
        </div>
      )}
    </GlassCard>
  );
};
