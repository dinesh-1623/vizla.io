import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Package, 
  Clock, 
  MapPin, 
  Navigation, 
  Eye,
  ChevronRight,
  Zap
} from 'lucide-react';

interface RouteGroup {
  id: string;
  title: string;
  vehicles: Array<{
    id: string;
    client: string;
    year: number;
    make: string;
    model: string;
    address: string;
    lat?: number;
    lng?: number;
    img?: string;
    images?: string[];
  }>;
  lotDuration: number; // minutes to lot
  stashDuration: number; // minutes to stash
  timeSaved: number; // minutes saved by using stash
  googleMapsUrl: string;
}

interface NowNextLaterProps {
  nowGroup?: RouteGroup;
  nextGroup?: RouteGroup;
  laterGroups: RouteGroup[];
  onVehicleClick: (vehicle: any) => void;
  onStartRoute: (group: RouteGroup) => void;
  onMarkBatchDone: (group: RouteGroup) => void;
  carsPerGroup: number;
  onCarsPerGroupChange: (value: number) => void;
  className?: string;
}

export const NowNextLater: React.FC<NowNextLaterProps> = ({
  nowGroup,
  nextGroup,
  laterGroups,
  onVehicleClick,
  onStartRoute,
  onMarkBatchDone,
  carsPerGroup,
  onCarsPerGroupChange,
  className = ''
}) => {
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const RouteGroupCard: React.FC<{ group: RouteGroup; type: 'now' | 'next' | 'later' }> = ({ 
    group, 
    type 
  }) => {
    const isExpanded = expandedGroups.has(group.id);

    const getTypeColor = () => {
      switch (type) {
        case 'now': return 'bg-green-500/20 text-green-400 border-green-500/30';
        case 'next': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case 'later': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      }
    };

    const getTypeIcon = () => {
      switch (type) {
        case 'now': return <Zap className="w-4 h-4" />;
        case 'next': return <Clock className="w-4 h-4" />;
        case 'later': return <MapPin className="w-4 h-4" />;
        default: return <MapPin className="w-4 h-4" />;
      }
    };

    return (
      <GlassCard className="p-4 border border-white/10">
        <div 
          className="flex items-center justify-between mb-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors"
          onClick={() => toggleGroupExpansion(group.id)}
        >
          <div className="flex items-center gap-2">
            {getTypeIcon()}
            <h4 className="font-semibold text-white">{group.title}</h4>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <ChevronRight 
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`} 
            />
          </div>
        </div>

        {/* Collapsible Content */}
        {isExpanded && (
          <>
            {/* Route Duration Details - Matching Driver Progress Style */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">Time to Tow & Lot:</span>
                </div>
                <span className="text-white font-medium">{formatTime(group.lotDuration)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-gray-300">Time to Tow & Stash:</span>
                </div>
                <span className="text-white font-medium">{formatTime(group.stashDuration)}</span>
              </div>
              
              {group.timeSaved > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Stash saves:</span>
                  <span className="text-green-400 font-medium">{formatTime(group.timeSaved)}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between border-t border-white/10 pt-2">
                <span className="text-sm font-medium text-white">Total Time:</span>
                <span className="text-white font-bold">{formatTime(group.stashDuration)}</span>
              </div>
            </div>

            {/* Start Route Button */}
            <Button
              onClick={() => onStartRoute(group)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 mb-3"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Start Route
            </Button>

            {/* Vehicle List - Matching Driver Progress Style */}
            <div className="space-y-2">
              {group.vehicles.map((vehicle, index) => (
                <div 
                  key={vehicle.id}
                  className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-white font-medium text-sm">
                        {vehicle.client}:
                      </div>
                      <div className="text-gray-400 text-xs">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </div>
                      <div className="text-gray-500 text-xs truncate">
                        {vehicle.address}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onVehicleClick(vehicle)}
                    className="text-gray-400 hover:text-white hover:bg-white/10 p-1"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </GlassCard>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Route Groups</h3>
          <p className="text-gray-300 text-sm">
            Now/Next/Later workflow for efficient vehicle pickup
          </p>
        </div>
      </div>

      {/* Batch Size Control */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-white font-medium">Batch Size</h4>
            <p className="text-gray-400 text-sm">Adjust vehicles per batch (4-20)</p>
          </div>
          <div className="text-white font-bold text-lg">
            {carsPerGroup} vehicles
          </div>
        </div>
        
        <input
          type="range"
          min="4"
          max="20"
          value={carsPerGroup}
          onChange={(e) => onCarsPerGroupChange(parseInt(e.target.value))}
          className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((carsPerGroup - 4) / (20 - 4)) * 100}%, #374151 ${((carsPerGroup - 4) / (20 - 4)) * 100}%, #374151 100%)`
          }}
        />
        
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>4</span>
          <span>12</span>
          <span>20</span>
        </div>
      </div>

      {/* Now/Next/Later Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Now Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <h4 className="text-lg font-medium text-white">Now</h4>
            <Badge className="bg-green-500/20 text-green-400 border-0">
              Current Batch
            </Badge>
          </div>
          
          {nowGroup ? (
            <>
              <RouteGroupCard group={nowGroup} type="now" />
              {/* Mark Batch Done Button - Separate from card like Driver Progress */}
              <Button
                onClick={() => onMarkBatchDone(nowGroup)}
                className="w-full bg-green-600 hover:bg-green-700 text-white border-0 mt-4"
              >
                Mark Batch Done
              </Button>
            </>
          ) : (
            <GlassCard className="p-8 text-center border border-white/10">
              <div className="text-gray-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No current batch</p>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Next Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <h4 className="text-lg font-medium text-white">Next</h4>
            <Badge className="bg-blue-500/20 text-blue-400 border-0">
              Upcoming
            </Badge>
          </div>
          
          {nextGroup ? (
            <RouteGroupCard group={nextGroup} type="next" />
          ) : (
            <GlassCard className="p-8 text-center border border-white/10">
              <div className="text-gray-400">
                <ChevronRight className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No next batch</p>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Later Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <h4 className="text-lg font-medium text-white">Later</h4>
            <Badge className="bg-gray-500/20 text-gray-400 border-0">
              {laterGroups.length} batches
            </Badge>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {laterGroups.length > 0 ? (
              laterGroups.map((group, index) => (
                <RouteGroupCard 
                  key={group.id} 
                  group={group} 
                  type="later" 
                />
              ))
            ) : (
              <GlassCard className="p-8 text-center border border-white/10">
                <div className="text-gray-400">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No later batches</p>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
