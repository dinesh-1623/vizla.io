import React from 'react';
import { Vehicle, Zone, LatLng } from '../../lib/ops-map/types';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { 
  Map, 
  Layers, 
  Zap, 
  Target, 
  Navigation,
  Eye,
  EyeOff
} from 'lucide-react';

interface MapControlsProps {
  settings: {
    showZones: boolean;
    clusterMarkers: boolean;
    estimateMode: boolean;
  };
  onSettingsChange: (settings: any) => void;
  vehicles: Vehicle[];
  zones: Zone[];
  onFitBounds: (bounds: LatLng[]) => void;
  onFlyTo: (position: LatLng, zoom?: number) => void;
}

export function MapControls({
  settings,
  onSettingsChange,
  vehicles,
  zones,
  onFitBounds,
  onFlyTo
}: MapControlsProps) {
  const handleSettingChange = (key: string, value: boolean) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  const fitToNationwide = () => {
    // USA bounds
    const bounds: LatLng[] = [
      { lat: 49.0, lng: -125.0 }, // Northwest
      { lat: 25.0, lng: -66.0 }   // Southeast
    ];
    onFitBounds(bounds);
  };

  const fitToMarket = (market: string) => {
    const marketVehicles = vehicles.filter(v => v.market === market);
    if (marketVehicles.length === 0) return;

    const bounds: LatLng[] = marketVehicles
      .filter(v => v.lat && v.lng)
      .map(v => ({ lat: v.lat!, lng: v.lng! }));
    
    if (bounds.length > 0) {
      onFitBounds(bounds);
    }
  };

  const fitToZone = (zoneName: string) => {
    const zone = zones.find(z => z.name === zoneName);
    if (zone && zone.polygon.length > 0) {
      onFitBounds(zone.polygon);
    }
  };

  // Get unique markets
  const markets = [...new Set(vehicles.map(v => v.market))].sort();
  const zoneNames = [...new Set(zones.map(z => z.name))].sort();

  return (
    <div className="p-4">
      <div className="space-y-3">
        {/* Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-vizla-text-secondary" />
            <span className="text-sm text-vizla-text-primary">Live Mode</span>
            {settings.estimateMode && (
              <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-500 border-orange-500/20">
                Estimate
              </Badge>
            )}
          </div>
          <Switch
            checked={!settings.estimateMode}
            onCheckedChange={(checked) => handleSettingChange('estimateMode', !checked)}
            disabled={!import.meta.env.VITE_GOOGLE_MAPS_KEY}
            aria-label="Toggle live mode"
          />
        </div>

        {/* Zones Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-vizla-text-secondary" />
            <span className="text-sm text-vizla-text-primary">Show Zones</span>
          </div>
          <Switch
            checked={settings.showZones}
            onCheckedChange={(checked) => handleSettingChange('showZones', checked)}
            aria-label="Toggle zone visibility"
          />
        </div>

        {/* Clustering Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-vizla-text-secondary" />
            <span className="text-sm text-vizla-text-primary">Cluster Markers</span>
          </div>
          <Switch
            checked={settings.clusterMarkers}
            onCheckedChange={(checked) => handleSettingChange('clusterMarkers', checked)}
            aria-label="Toggle marker clustering"
          />
        </div>

        {/* Fit Bounds Buttons */}
        <div className="space-y-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fitToNationwide}
            className="w-full justify-start border-vizla-glassBorder hover:bg-vizla-glassElev"
          >
            <Map className="w-4 h-4 mr-2" />
            Nationwide
          </Button>

          {/* Market Buttons */}
          <div className="space-y-1">
            <p className="text-xs text-vizla-text-secondary font-medium">Markets</p>
            {markets.slice(0, 3).map(market => (
              <Button
                key={market}
                size="sm"
                variant="ghost"
                onClick={() => fitToMarket(market)}
                className="w-full justify-start text-xs hover:bg-vizla-glassElev"
              >
                <Navigation className="w-3 h-3 mr-2" />
                {market}
              </Button>
            ))}
            {markets.length > 3 && (
              <p className="text-xs text-vizla-text-secondary text-center">
                +{markets.length - 3} more markets
              </p>
            )}
          </div>

          {/* Zone Buttons */}
          {zoneNames.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-vizla-text-secondary font-medium">Zones</p>
              {zoneNames.slice(0, 2).map(zoneName => (
                <Button
                  key={zoneName}
                  size="sm"
                  variant="ghost"
                  onClick={() => fitToZone(zoneName)}
                  className="w-full justify-start text-xs hover:bg-vizla-glassElev"
                >
                  <Target className="w-3 h-3 mr-2" />
                  {zoneName}
                </Button>
              ))}
              {zoneNames.length > 2 && (
                <p className="text-xs text-vizla-text-secondary text-center">
                  +{zoneNames.length - 2} more zones
                </p>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="pt-2 border-t border-vizla-glassBorder">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center">
              <p className="text-vizla-text-secondary">Vehicles</p>
              <p className="font-medium text-vizla-text-primary">{vehicles.length}</p>
            </div>
            <div className="text-center">
              <p className="text-vizla-text-secondary">Zones</p>
              <p className="font-medium text-vizla-text-primary">{zones.length}</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-vizla-text-secondary text-center">
            Showing filtered results
          </div>
        </div>
      </div>
    </div>
  );
}
