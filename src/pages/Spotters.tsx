import React from 'react';
import AppShell from '@/components/shell/AppShell';
import { getCarsByQueue } from '@/lib/mockState';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DataTable } from '@/components/ui/DataTable';
import { StatTile } from '@/components/ui/StatTile';

const Spotters: React.FC = () => {
  const allCars = getCarsByQueue('dispatched');
  const nazCars = allCars.filter(car => car.assignedDriver === 'Naz');
  const rogerCars = allCars.filter(car => car.assignedDriver === 'Roger');

  return (
    <AppShell title="Spotters">
      <div className="space-y-6">
        {/* Header */}
        <SectionHeading
          title="Spotters"
          subtitle="Active spotter performance and assigned vehicles"
        />

        {/* Spotter Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard>
            <StatTile
              label="Naz - Active"
              value={nazCars.length}
              delta={{ dir: 'up', text: '+2' }}
            />
          </GlassCard>
          
          <GlassCard>
            <StatTile
              label="Roger - Active"
              value={rogerCars.length}
              delta={{ dir: 'down', text: '-1' }}
            />
          </GlassCard>

          <GlassCard>
            <StatTile
              label="Total Spotters"
              value="4"
              delta={{ dir: null, text: '' }}
            />
          </GlassCard>

          <GlassCard>
            <StatTile
              label="Success Rate"
              value="94%"
              delta={{ dir: 'up', text: '+2%' }}
            />
          </GlassCard>
        </div>

        {/* Naz's Vehicles */}
        <GlassCard>
          <SectionHeading title="Naz's Assigned Vehicles" />
          <DataTable
            columns={[
              { key: 'vehicle', header: 'Vehicle' },
              { key: 'client', header: 'Client' },
              { key: 'zone', header: 'Zone' },
              { key: 'status', header: 'Status' }
            ]}
            rows={nazCars.map(car => ({
              vehicle: car.yearMakeModel,
              client: car.client,
              zone: car.zone,
              status: 'In Progress'
            }))}
            emptyText="No vehicles assigned to Naz"
          />
        </GlassCard>

        {/* Roger's Vehicles */}
        <GlassCard>
          <SectionHeading title="Roger's Assigned Vehicles" />
          <DataTable
            columns={[
              { key: 'vehicle', header: 'Vehicle' },
              { key: 'client', header: 'Client' },
              { key: 'zone', header: 'Zone' },
              { key: 'status', header: 'Status' }
            ]}
            rows={rogerCars.map(car => ({
              vehicle: car.yearMakeModel,
              client: car.client,
              zone: car.zone,
              status: 'In Progress'
            }))}
            emptyText="No vehicles assigned to Roger"
          />
        </GlassCard>
      </div>
    </AppShell>
  );
};

export default Spotters;
