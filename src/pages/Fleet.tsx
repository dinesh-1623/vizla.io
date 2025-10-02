import React, { useState, useMemo } from 'react';
import { Truck, Eye, Car, Download } from 'lucide-react';
import AppShell from '@/components/shell/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { FleetVehicleCard } from '@/components/fleet/FleetVehicleCard';
import { FleetFilters } from '@/components/fleet/FleetFilters';
import { 
  FLEET_VEHICLES, 
  getVehiclesByType, 
  getUniqueMarkets, 
  getUniqueZones, 
  getUniqueDrivers,
  getUniqueMaintenanceStatuses 
} from '@/lib/fleet/seed';
import { FleetVehicle, FleetFilters as FleetFiltersType, FleetTab } from '@/lib/fleet/types';

const Fleet: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FleetTab>('Tow Trucks');
  const [filters, setFilters] = useState<FleetFiltersType>({});

  // Get unique values for filters
  const markets = getUniqueMarkets(FLEET_VEHICLES);
  const zones = getUniqueZones(FLEET_VEHICLES);
  const drivers = getUniqueDrivers(FLEET_VEHICLES);
  const maintenanceStatuses = getUniqueMaintenanceStatuses(FLEET_VEHICLES);

  // Log fleet data to console for debugging
  console.log('🚛 Fleet Management Data:', {
    totalVehicles: FLEET_VEHICLES.length,
    towTrucks: FLEET_VEHICLES.filter(v => v.type === 'Tow Truck').length,
    spotters: FLEET_VEHICLES.filter(v => v.type === 'Spotter').length,
    rollbacks: FLEET_VEHICLES.filter(v => v.type === 'Rollback').length,
    markets,
    zones,
    drivers: drivers.length,
    maintenanceStatuses
  });

  // Filter vehicles based on active tab and filters
  const filteredVehicles = useMemo(() => {
    // Start with all vehicles, then filter by type (tab or filter)
    let vehicles = FLEET_VEHICLES;
    
    // Apply vehicle type filter (from tab or filter dropdown)
    if (filters.vehicleType) {
      vehicles = vehicles.filter(vehicle => vehicle.type === filters.vehicleType);
    } else {
      // Map tab names to vehicle types
      const tabToTypeMap: Record<string, string> = {
        'Tow Trucks': 'Tow Truck',
        'Spotters': 'Spotter', 
        'Rollbacks': 'Rollback'
      };
      const vehicleType = tabToTypeMap[activeTab];
      if (vehicleType) {
        vehicles = vehicles.filter(vehicle => vehicle.type === vehicleType);
      }
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      vehicles = vehicles.filter(vehicle =>
        vehicle.vin.toLowerCase().includes(searchLower) ||
        vehicle.model.toLowerCase().includes(searchLower) ||
        vehicle.make.toLowerCase().includes(searchLower) ||
        vehicle.driver?.toLowerCase().includes(searchLower)
      );
    }

    // Apply other filters
    if (filters.status) {
      vehicles = vehicles.filter(vehicle => vehicle.status === filters.status);
    }
    if (filters.market) {
      vehicles = vehicles.filter(vehicle => vehicle.market === filters.market);
    }
    if (filters.zone) {
      vehicles = vehicles.filter(vehicle => vehicle.zone === filters.zone);
    }
    if (filters.driver) {
      vehicles = vehicles.filter(vehicle => vehicle.driver === filters.driver);
    }
    if (filters.shift) {
      vehicles = vehicles.filter(vehicle => vehicle.shift === filters.shift);
    }
    if (filters.maintenanceStatus) {
      vehicles = vehicles.filter(vehicle => vehicle.maintenanceStatus === filters.maintenanceStatus);
    }

    return vehicles;
  }, [activeTab, filters]);

  // Get tab counts
  const tabCounts = useMemo(() => {
    const counts = {
      'Tow Trucks': FLEET_VEHICLES.filter(v => v.type === 'Tow Truck').length,
      'Spotters': FLEET_VEHICLES.filter(v => v.type === 'Spotter').length,
      'Rollbacks': FLEET_VEHICLES.filter(v => v.type === 'Rollback').length
    };
    return counts;
  }, []);

  // Handle actions
  const handleAssignDriver = (vehicle: FleetVehicle) => {
    console.log('Assign driver to:', vehicle.vin);
    // TODO: Implement driver assignment modal
  };

  const handleMarkMaintenance = (vehicle: FleetVehicle) => {
    console.log('Mark maintenance for:', vehicle.vin);
    // TODO: Implement maintenance modal
  };

  const handleEdit = (vehicle: FleetVehicle) => {
    console.log('Edit vehicle:', vehicle.vin);
    // TODO: Implement edit modal
  };

  const handleExportCSV = () => {
    // Generate CSV content
    const headers = [
      'VIN', 'Make', 'Model', 'Year', 'Driver', 'Type', 'Status', 
      'Starting Point', 'Location', 'Storage Lot', 'Zone', 'Market', 
      'Shift', 'Current Goal', 'Total Goal', 'Progress %'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredVehicles.map(vehicle => [
        vehicle.vin,
        vehicle.make,
        vehicle.model,
        vehicle.year,
        vehicle.driver || '',
        vehicle.type,
        vehicle.status,
        vehicle.startingPoint,
        vehicle.location,
        vehicle.storageLot,
        vehicle.zone,
        vehicle.market,
        vehicle.shift,
        vehicle.shiftGoal.current,
        vehicle.shiftGoal.total,
        Math.round((vehicle.shiftGoal.current / vehicle.shiftGoal.total) * 100)
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fleet-${activeTab.toLowerCase().replace(' ', '-')}-export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell title="Fleet Management">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-vizla-text-primary">Fleet Management</h1>
          <p className="text-vizla-text-muted text-lg mt-1">
            Manage your fleet of tow trucks, spotters, and rollbacks
          </p>
        </div>
        
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-vizla-glass text-vizla-text-secondary rounded-xl ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-all duration-200"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <FleetFilters
          filters={filters}
          onFiltersChange={setFilters}
          markets={markets}
          zones={zones}
          drivers={drivers}
          maintenanceStatuses={maintenanceStatuses}
        />
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex bg-vizla-glass rounded-xl p-1 ring-1 ring-vizla-glassBorder">
          <button
            onClick={() => setActiveTab('Tow Trucks')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'Tow Trucks'
                ? 'bg-vizla-brand-primary text-white'
                : 'text-vizla-text-secondary hover:text-vizla-text-primary'
            }`}
          >
            <Truck className="w-4 h-4" />
            Tow Trucks
            <span className="px-2 py-0.5 bg-white/20 text-xs rounded-full">
              {tabCounts['Tow Trucks']}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('Spotters')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'Spotters'
                ? 'bg-vizla-brand-primary text-white'
                : 'text-vizla-text-secondary hover:text-vizla-text-primary'
            }`}
          >
            <Eye className="w-4 h-4" />
            Spotters
            <span className="px-2 py-0.5 bg-white/20 text-xs rounded-full">
              {tabCounts['Spotters']}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('Rollbacks')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'Rollbacks'
                ? 'bg-vizla-brand-primary text-white'
                : 'text-vizla-text-secondary hover:text-vizla-text-primary'
            }`}
          >
            <Car className="w-4 h-4" />
            Rollbacks
            <span className="px-2 py-0.5 bg-white/20 text-xs rounded-full">
              {tabCounts['Rollbacks']}
            </span>
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-vizla-text-muted">
          Showing {filteredVehicles.length} of {tabCounts[activeTab]} {activeTab.toLowerCase()}
        </p>
      </div>

      {/* Vehicles Grid */}
      {filteredVehicles.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-vizla-glass rounded-full flex items-center justify-center">
              <Truck className="w-8 h-8 text-vizla-text-muted" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-vizla-text-primary mb-2">
                No vehicles found
              </h3>
              <p className="text-vizla-text-muted">
                {Object.keys(filters).length > 0 
                  ? 'Try adjusting your filters to see more vehicles.'
                  : `No ${activeTab.toLowerCase()} found in the fleet.`
                }
              </p>
            </div>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <FleetVehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onAssignDriver={handleAssignDriver}
              onMarkMaintenance={handleMarkMaintenance}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
};

export default Fleet;
