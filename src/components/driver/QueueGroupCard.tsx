import React, { useState, useMemo } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronRight, 
  Home, 
  Package, 
  Eye, 
  Clock, 
  MapPin,
  Users,
  TrendingUp,
  Car
} from 'lucide-react';
import { TowCard } from '@/app/tow-driver/data/baltimoreRun';

interface QueueGroupCardProps {
  title: string;
  vehicles: TowCard[];
  status: 'now' | 'next' | 'later';
  onVehicleClick?: (vehicle: TowCard) => void;
  className?: string;
}

export const QueueGroupCard: React.FC<QueueGroupCardProps> = ({
  title,
  vehicles,
  status,
  onVehicleClick,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(status === 'now'); // Auto-expand 'now' group
  const [selectedVehicle, setSelectedVehicle] = useState<TowCard | null>(null);

  // Calculate route capacity stats
  const routeStats = useMemo(() => {
    const totalVehicles = vehicles.length;
    const estimatedPickupTime = totalVehicles * 20; // 20 minutes per vehicle
    const lotReturnTime = estimatedPickupTime + 30; // +30 minutes to lot
    const stashReturnTime = estimatedPickupTime + 45; // +45 minutes to stash
    const timeSaved = lotReturnTime - stashReturnTime;

    return {
      totalVehicles,
      estimatedPickupTime,
      lotReturnTime,
      stashReturnTime,
      timeSaved: Math.abs(timeSaved)
    };
  }, [vehicles]);

  // Get status-specific styling
  const getStatusStyles = () => {
    switch (status) {
      case 'now':
        return {
          border: 'border-green-500/30',
          bg: 'bg-green-500/10',
          icon: 'text-green-400',
          badge: 'bg-green-500/20 text-green-400'
        };
      case 'next':
        return {
          border: 'border-blue-500/30',
          bg: 'bg-blue-500/10',
          icon: 'text-blue-400',
          badge: 'bg-blue-500/20 text-blue-400'
        };
      case 'later':
        return {
          border: 'border-gray-500/30',
          bg: 'bg-gray-500/10',
          icon: 'text-gray-400',
          badge: 'bg-gray-500/20 text-gray-400'
        };
    }
  };

  const styles = getStatusStyles();

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleVehicleClick = (vehicle: TowCard) => {
    setSelectedVehicle(vehicle);
    onVehicleClick?.(vehicle);
  };

  return (
    <GlassCard className={`transition-all duration-250 ease-out hover:scale-[1.02] ${styles.border} ${className}`}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${styles.bg}`}>
                <Users className={`w-5 h-5 ${styles.icon}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="text-sm text-gray-400">
                  {vehicles.length} vehicles • {formatTime(routeStats.estimatedPickupTime)} pickup time
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Route Capacity Stats */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-md">
                  <Home className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-white">{formatTime(routeStats.lotReturnTime)}</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-md">
                  <Package className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-white">{formatTime(routeStats.stashReturnTime)}</span>
                </div>
                <Badge className={`text-xs ${styles.badge}`}>
                  {formatTime(routeStats.timeSaved)} saved
                </Badge>
              </div>
              
              <Badge className={styles.badge}>
                {status.toUpperCase()}
              </Badge>
              
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden transition-all duration-250 ease-out">
          <div className="px-4 pb-4 border-t border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {vehicles.map((vehicle, index) => (
                <div
                  key={vehicle.id}
                  className="group p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer"
                  onClick={() => handleVehicleClick(vehicle)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-white">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVehicleClick(vehicle);
                      }}
                    >
                      <Eye className="w-4 h-4 text-gray-400" />
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{vehicle.client}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(20)} pickup</span>
                    </div>
                  </div>

                  {/* Vehicle Images Preview */}
                  {vehicle.images && vehicle.images.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {vehicle.images.slice(0, 3).map((image, imgIndex) => (
                        <div
                          key={imgIndex}
                          className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center text-xs text-gray-400"
                        >
                          {imgIndex + 1}
                        </div>
                      ))}
                      {vehicle.images.length > 3 && (
                        <div className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                          +{vehicle.images.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </GlassCard>
  );
};
