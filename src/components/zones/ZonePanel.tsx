import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zone, ZonePanelData } from '@/lib/zones/types';
import { ZoneKPIRow } from './ZoneKPIRow';
import { DriverMiniCard } from './DriverMiniCard';
import { Truck, Users, ChevronRight } from 'lucide-react';

interface ZonePanelProps {
  zone: Zone;
  panelData: ZonePanelData;
  onViewDriverBreakdown?: (zoneId: string) => void;
}

export const ZonePanel: React.FC<ZonePanelProps> = ({ 
  zone, 
  panelData, 
  onViewDriverBreakdown 
}) => {
  const navigate = useNavigate();

  const handleOpenDispatch = () => {
    navigate(`/to-dispatch?market=${encodeURIComponent(zone.market)}&zone=${encodeURIComponent(zone.id)}&shift=${zone.shift}`);
  };

  const handleViewDriverBreakdown = () => {
    if (onViewDriverBreakdown) {
      onViewDriverBreakdown(zone.id);
    } else {
      navigate(`/ops/zones/${zone.id}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Track':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'At Risk':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Behind':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getOverallStatus = () => {
    // Overall status is "Behind" if either KPI is behind, "At Risk" if either is at risk, otherwise "On Track"
    if (panelData.a.status === 'Behind' || panelData.b.status === 'Behind') {
      return 'Behind';
    }
    if (panelData.a.status === 'At Risk' || panelData.b.status === 'At Risk') {
      return 'At Risk';
    }
    return 'On Track';
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="bg-vizla-glass/50 backdrop-blur-xl border border-vizla-glassBorder rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-vizla-text-primary">{zone.name}</h3>
            <Badge className="bg-vizla-glass/50 text-vizla-text-secondary border-vizla-glassBorder">
              {zone.market}
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              {zone.shift}
            </Badge>
          </div>
          <div className="text-sm text-vizla-text-secondary">
            {zone.drivers.length} drivers • {zone.locatedCount} located vehicles
          </div>
        </div>
        <Badge className={getStatusColor(overallStatus)}>
          {overallStatus}
        </Badge>
      </div>

      {/* KPI Rows */}
      <div className="space-y-6">
        <ZoneKPIRow 
          data={panelData.a} 
          type="goal" 
          title="Zone Goal KPIs" 
        />
        <ZoneKPIRow 
          data={panelData.b} 
          type="located" 
          title="Located KPIs (Backlog View)" 
        />
      </div>

      {/* Drivers Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-vizla-text-secondary" />
          <h4 className="text-sm font-medium text-vizla-text-primary">Drivers</h4>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {zone.drivers.slice(0, 3).map(driver => (
            <DriverMiniCard key={driver.id} driver={driver} />
          ))}
          {zone.drivers.length > 3 && (
            <div className="text-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleViewDriverBreakdown}
                className="text-vizla-text-secondary hover:text-vizla-text-primary"
              >
                View all {zone.drivers.length} drivers
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-vizla-glassBorder">
        <Button
          onClick={handleOpenDispatch}
          className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 text-white"
        >
          <Truck className="w-4 h-4 mr-2" />
          Open Dispatch
        </Button>
        <Button
          onClick={handleViewDriverBreakdown}
          variant="outline"
          className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/20"
        >
          View Driver Breakdown
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};




