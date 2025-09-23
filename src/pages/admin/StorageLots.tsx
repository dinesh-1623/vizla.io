import React from 'react';
import AppShell from '@/components/shell/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DataTable } from '@/components/ui/DataTable';

const StorageLots: React.FC = () => {
  const storageLotsData = [
    { lot: 'Lot A', location: 'Dallas-North', capacity: 50, currentVehicles: 12, utilization: '24%' },
    { lot: 'Lot B', location: 'Dallas-East', capacity: 40, currentVehicles: 8, utilization: '20%' },
    { lot: 'Lot C', location: 'Dallas-South', capacity: 60, currentVehicles: 15, utilization: '25%' },
    { lot: 'Lot D', location: 'Dallas-West', capacity: 30, currentVehicles: 5, utilization: '17%' }
  ];

  return (
    <AppShell title="Storage Lots">
      <div className="space-y-6">
        {/* Header */}
        <SectionHeading
          title="Storage Lots"
          subtitle="Vehicle storage facilities and capacity management"
        />

        {/* Storage Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">4</div>
              <div className="text-sm text-muted mt-1">Total Lots</div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">180</div>
              <div className="text-sm text-muted mt-1">Total Capacity</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">40</div>
              <div className="text-sm text-muted mt-1">Current Vehicles</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">22%</div>
              <div className="text-sm text-muted mt-1">Avg Utilization</div>
            </div>
          </GlassCard>
        </div>

        {/* Storage Lots Table */}
        <GlassCard>
          <SectionHeading title="Storage Facilities" />
          <DataTable
            columns={[
              { key: 'lot', header: 'Lot' },
              { key: 'location', header: 'Location' },
              { key: 'capacity', header: 'Capacity' },
              { key: 'currentVehicles', header: 'Current Vehicles' },
              { key: 'utilization', header: 'Utilization' }
            ]}
            rows={storageLotsData.map(lot => ({
              lot: lot.lot,
              location: lot.location,
              capacity: lot.capacity,
              currentVehicles: lot.currentVehicles,
              utilization: lot.utilization
            }))}
            emptyText="No storage lots found"
          />
        </GlassCard>
      </div>
    </AppShell>
  );
};

export default StorageLots;
