import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { DriverContributions } from '../../components/zones/DriverContributions';
import { mockZones } from '../../lib/zones/mock';
import { 
  Filter, 
  ChevronRight, 
  Users, 
  Target, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';

export default function ZoneCapacityOverview() {
  const navigate = useNavigate();
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState('all');
  const [selectedShift, setSelectedShift] = useState('Day');

  // Mock data for the overview
  const goalCapacityData = {
    goal: 105,
    driversAssigned: 10,
    towed: 58,
    goalPercentage: 55,
    timeToGoal: { hours: 23, minutes: 30 },
    timeAvailable: { hours: 43, minutes: 20 },
    timeAhead: { hours: 19, minutes: 50 },
    status: 'on-track'
  };

  const fullCapacityData = {
    located: 146,
    remaining: 88,
    towed: 58,
    completionPercentage: 40,
    timeToTowAll: { hours: 44 },
    timeAvailable: { hours: 43, minutes: 20 },
    timeNeeded: { hours: 0, minutes: 40 },
    status: 'at-risk'
  };

  const assumptions = [
    'Tow cycle = 30 min',
    'Shift = 12h'
  ];

  // Filter drivers based on selected market and shift
  const filteredDrivers = useMemo(() => {
    const driverMap = new Map();
    mockZones
      .filter(zone => {
        if (selectedMarket !== 'all' && zone.market !== selectedMarket) return false;
        if (zone.shift !== selectedShift) return false;
        return true;
      })
      .flatMap(zone => zone.drivers)
      .forEach(driver => {
        if (!driverMap.has(driver.id)) {
          driverMap.set(driver.id, driver);
        }
      });
    return Array.from(driverMap.values());
  }, [selectedMarket, selectedShift]);

  const formatTime = (hours: number, minutes?: number) => {
    if (minutes !== undefined) {
      return `${hours}h ${minutes}m`;
    }
    return `${hours}h`;
  };

  const handleViewDetailed = () => {
    navigate('/zones/capacity/detailed');
  };

  return (
    <div className="min-h-screen bg-vizla-background p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-vizla-text-primary mb-2">
          Zone Capacity Planning
        </h1>
        <p className="text-vizla-text-secondary">
          Monitor driver capacity, track progress against goals, and optimize resource allocation.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-vizla-glass/50 backdrop-blur-xl border border-vizla-glassBorder rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-vizla-text-secondary" />
            <span className="text-sm font-medium text-vizla-text-primary">Filters:</span>
          </div>
          
          <Select value={selectedMarket} onValueChange={setSelectedMarket}>
            <SelectTrigger className="w-32 bg-vizla-glass border-vizla-glassBorder">
              <SelectValue placeholder="All Markets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Markets</SelectItem>
              <SelectItem value="Baltimore">Baltimore</SelectItem>
              <SelectItem value="Chicago">Chicago</SelectItem>
              <SelectItem value="Dallas">Dallas</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all-zones">
            <SelectTrigger className="w-28 bg-vizla-glass border-vizla-glassBorder">
              <SelectValue placeholder="All Zones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-zones">All Zones</SelectItem>
              <SelectItem value="downtown">Downtown</SelectItem>
              <SelectItem value="harbor">Harbor</SelectItem>
              <SelectItem value="west">West</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedShift} onValueChange={setSelectedShift}>
            <SelectTrigger className="w-28 bg-vizla-glass border-vizla-glassBorder">
              <SelectValue placeholder="All Shifts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Day">Day</SelectItem>
              <SelectItem value="Night">Night</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-vizla-text-secondary">
            {format(new Date(), 'MM/dd/yyyy')}
          </div>
        </div>
      </div>

      {/* Goal Capacity Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <h2 className="text-lg font-semibold text-vizla-text-primary">Goal Capacity</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Goal Card */}
          <div className="bg-vizla-glass/50 backdrop-blur-xl border border-vizla-glassBorder rounded-lg p-2">
            <div className="text-3xl font-bold text-vizla-text-primary mb-1">
              {goalCapacityData.goal}
            </div>
            <div className="text-sm text-vizla-text-secondary">
              {goalCapacityData.driversAssigned} drivers assigned
            </div>
          </div>

          {/* Towed Card */}
          <div className="bg-vizla-glass/50 backdrop-blur-xl border border-vizla-glassBorder rounded-lg p-2">
            <div className="text-3xl font-bold text-vizla-text-primary mb-1">
              {goalCapacityData.towed}
            </div>
            <div className="text-sm text-vizla-text-secondary">
              {goalCapacityData.goalPercentage}% of goal
            </div>
          </div>

          {/* Time to Goal Card */}
          <div className="bg-vizla-glass/50 backdrop-blur-xl border border-vizla-glassBorder rounded-lg p-2">
            <div className="text-3xl font-bold text-emerald-400 mb-1">
              {formatTime(goalCapacityData.timeToGoal.hours, goalCapacityData.timeToGoal.minutes)}
            </div>
            <div className="text-sm text-vizla-text-secondary">
              {formatTime(goalCapacityData.timeAvailable.hours, goalCapacityData.timeAvailable.minutes)} available
            </div>
          </div>

          {/* Recommended Action Card */}
          <div className={`backdrop-blur-xl border rounded-lg p-2 ${
            goalCapacityData.status === 'on-track' 
              ? 'bg-emerald-500/20 border-emerald-500/30' 
              : 'bg-amber-500/20 border-amber-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {goalCapacityData.status === 'on-track' ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              )}
              <span className="text-sm font-medium text-vizla-text-primary">
                RECOMMENDED ACTION (Goal Capacity)
              </span>
            </div>
            <div className="text-sm text-vizla-text-secondary">
              {goalCapacityData.status === 'on-track' 
                ? `On track · ${formatTime(goalCapacityData.timeAhead.hours, goalCapacityData.timeAhead.minutes)} ahead of schedule`
                : 'Behind schedule · Action needed'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Full Capacity Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <h2 className="text-lg font-semibold text-vizla-text-primary">Full Capacity (All Located)</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Located Card */}
          <div className="bg-vizla-glass/50 backdrop-blur-xl border border-vizla-glassBorder rounded-lg p-2">
            <div className="text-3xl font-bold text-vizla-text-primary mb-1">
              {fullCapacityData.located}
            </div>
            <div className="text-sm text-vizla-text-secondary">
              {fullCapacityData.remaining} remaining
            </div>
          </div>

          {/* Towed Card */}
          <div className="bg-vizla-glass/50 backdrop-blur-xl border border-vizla-glassBorder rounded-lg p-2">
            <div className="text-3xl font-bold text-vizla-text-primary mb-1">
              {fullCapacityData.towed}
            </div>
            <div className="text-sm text-vizla-text-secondary">
              {fullCapacityData.completionPercentage}% complete
            </div>
          </div>

          {/* Time to Tow All Card */}
          <div className="bg-vizla-glass/50 backdrop-blur-xl border border-vizla-glassBorder rounded-lg p-2">
            <div className="text-3xl font-bold text-vizla-text-primary mb-1">
              {formatTime(fullCapacityData.timeToTowAll.hours)}
            </div>
            <div className="text-sm text-vizla-text-secondary">
              {formatTime(fullCapacityData.timeAvailable.hours, fullCapacityData.timeAvailable.minutes)} available
            </div>
          </div>

          {/* Recommended Action Card */}
          <div className="bg-amber-500/20 backdrop-blur-xl border border-amber-500/30 rounded-lg p-2">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-medium text-vizla-text-primary">
                RECOMMENDED ACTION (Full Capacity)
              </span>
            </div>
            <div className="text-sm text-vizla-text-secondary">
              Need {formatTime(fullCapacityData.timeNeeded.hours, fullCapacityData.timeNeeded.minutes)} more · Add 1 driver or overtime to complete all
            </div>
          </div>
        </div>
      </div>

      {/* Driver Contributions Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <h2 className="text-lg font-semibold text-vizla-text-primary">Driver Contributions</h2>
        </div>
        
        <DriverContributions 
          drivers={filteredDrivers.slice(0, 9)} // Show first 9 drivers (3 per row)
          title="DRIVER CONTRIBUTIONS"
        />
      </div>

      {/* View Detailed Button */}
      <div className="flex justify-center mb-6">
        <Button
          onClick={handleViewDetailed}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 text-white px-6 py-3"
        >
          View Detailed Zone Breakdown
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Assumptions Section */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          onClick={() => setShowAssumptions(!showAssumptions)}
          className="text-vizla-text-secondary hover:text-vizla-text-primary p-0 h-auto"
        >
          <Settings className="w-4 h-4 mr-2" />
          Show Assumptions
        </Button>
        
        {showAssumptions && (
          <div className="bg-vizla-glass/30 backdrop-blur-xl border border-vizla-glassBorder rounded-lg p-4">
            <div className="space-y-2">
              {assumptions.map((assumption, index) => (
                <div key={index} className="text-sm text-vizla-text-secondary">
                  {assumption}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
