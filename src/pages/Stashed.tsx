import React from 'react';
import AppShell from '@/components/shell/AppShell';
import { getCarsByQueue } from '@/lib/mockState';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DataTable } from '@/components/ui/DataTable';

const Stashed: React.FC = () => {
  const stashedCars = getCarsByQueue('stashed');

  return (
    <AppShell title="Stashed">
      <div className="space-y-6">
        {/* Header */}
        <SectionHeading
          title="Stashed"
          subtitle={`${stashedCars.length} vehicles in storage`}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{stashedCars.length}</div>
              <div className="text-sm text-muted mt-1">Vehicles in Storage</div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">3</div>
              <div className="text-sm text-muted mt-1">Storage Lots</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">$1,650</div>
              <div className="text-sm text-muted mt-1">Daily Storage Cost</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">2.3d</div>
              <div className="text-sm text-muted mt-1">Avg Storage Time</div>
            </div>
          </GlassCard>
        </div>

        {/* Vehicles Table */}
        <GlassCard>
          <SectionHeading title="Vehicles in Storage" />
          <DataTable
            columns={[
              { key: 'vehicle', header: 'Vehicle' },
              { key: 'client', header: 'Client' },
              { key: 'zone', header: 'Zone' },
              { key: 'stored', header: 'Stored Since' },
              { key: 'storage', header: 'Storage Lot' }
            ]}
            rows={stashedCars.map(car => ({
              vehicle: car.yearMakeModel,
              client: car.client,
              zone: car.zone,
              stored: car.locatedDate,
              storage: 'Lot A'
            }))}
            emptyText="No vehicles in storage"
          />
        </GlassCard>
      </div>
    </AppShell>
  );
};

export default Stashed;
