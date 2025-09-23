import React from 'react';
import AppShell from '@/components/shell/AppShell';
import { getCarsByQueue } from '@/lib/mockState';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DataTable } from '@/components/ui/DataTable';

const Dispatched: React.FC = () => {
  const dispatchedCars = getCarsByQueue('dispatched');

  return (
    <AppShell title="Dispatched">
      <div className="space-y-6">
        {/* Header */}
        <SectionHeading
          title="Dispatched"
          subtitle={`${dispatchedCars.length} vehicles currently dispatched`}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{dispatchedCars.length}</div>
              <div className="text-sm text-muted mt-1">Active Dispatches</div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">4</div>
              <div className="text-sm text-muted mt-1">Active Drivers</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">1.2h</div>
              <div className="text-sm text-muted mt-1">Avg Recovery Time</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">95%</div>
              <div className="text-sm text-muted mt-1">Success Rate</div>
            </div>
          </GlassCard>
        </div>

        {/* Vehicles Table */}
        <GlassCard>
          <SectionHeading title="Active Dispatches" />
          <DataTable
            columns={[
              { key: 'vehicle', header: 'Vehicle' },
              { key: 'driver', header: 'Driver' },
              { key: 'client', header: 'Client' },
              { key: 'zone', header: 'Zone' },
              { key: 'status', header: 'Status' }
            ]}
            rows={dispatchedCars.map(car => ({
              vehicle: car.yearMakeModel,
              driver: car.assignedDriver || 'Unassigned',
              client: car.client,
              zone: car.zone,
              status: 'In Progress'
            }))}
            emptyText="No active dispatches"
          />
        </GlassCard>
      </div>
    </AppShell>
  );
};

export default Dispatched;
