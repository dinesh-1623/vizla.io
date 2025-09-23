import React from 'react';
import AppShell from '@/components/shell/AppShell';
import { getCarsByQueue } from '@/lib/mockState';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DataTable } from '@/components/ui/DataTable';

const ToDispatch: React.FC = () => {
  const toDispatchCars = getCarsByQueue('to-dispatch');

  return (
    <AppShell title="To Dispatch">
      <div className="space-y-6">
        {/* Header */}
        <SectionHeading
          title="To Dispatch"
          subtitle={`${toDispatchCars.length} vehicles ready for dispatch`}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{toDispatchCars.length}</div>
              <div className="text-sm text-muted mt-1">Ready to Dispatch</div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">8</div>
              <div className="text-sm text-muted mt-1">Available Drivers</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">4</div>
              <div className="text-sm text-muted mt-1">Active Zones</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">2.5h</div>
              <div className="text-sm text-muted mt-1">Avg Dispatch Time</div>
            </div>
          </GlassCard>
        </div>

        {/* Vehicles Table */}
        <GlassCard>
          <SectionHeading title="Vehicles Ready for Dispatch" />
          <DataTable
            columns={[
              { key: 'vehicle', header: 'Vehicle' },
              { key: 'client', header: 'Client' },
              { key: 'zone', header: 'Zone' },
              { key: 'located', header: 'Located' },
              { key: 'priority', header: 'Priority' }
            ]}
            rows={toDispatchCars.map(car => ({
              vehicle: car.yearMakeModel,
              client: car.client,
              zone: car.zone,
              located: car.locatedDate,
              priority: car.daysSinceLocated && car.daysSinceLocated >= 5 ? 'High' : 'Normal'
            }))}
            emptyText="No vehicles ready for dispatch"
          />
        </GlassCard>
      </div>
    </AppShell>
  );
};

export default ToDispatch;
