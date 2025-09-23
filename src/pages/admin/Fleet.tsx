import React from 'react';
import AppShell from '@/components/shell/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DataTable } from '@/components/ui/DataTable';

const Fleet: React.FC = () => {
  const fleetData = [
    { id: 'T001', make: 'Ford F-450', year: '2023', status: 'Active', location: 'Dallas-North' },
    { id: 'T002', make: 'Chevrolet 5500', year: '2022', status: 'Active', location: 'Dallas-East' },
    { id: 'T003', make: 'Ford F-450', year: '2023', status: 'Maintenance', location: 'Dallas-South' },
    { id: 'T004', make: 'Chevrolet 5500', year: '2021', status: 'Active', location: 'Dallas-West' },
    { id: 'T005', make: 'Ford F-450', year: '2023', status: 'Active', location: 'Dallas-North' }
  ];

  return (
    <AppShell title="Fleet">
      <div className="space-y-6">
        {/* Header */}
        <SectionHeading
          title="Fleet Management"
          subtitle="Vehicle fleet overview and maintenance status"
        />

        {/* Fleet Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">5</div>
              <div className="text-sm text-muted mt-1">Total Vehicles</div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">4</div>
              <div className="text-sm text-muted mt-1">Active</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">1</div>
              <div className="text-sm text-muted mt-1">Maintenance</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">$2,400</div>
              <div className="text-sm text-muted mt-1">Monthly Fuel</div>
            </div>
          </GlassCard>
        </div>

        {/* Fleet Table */}
        <GlassCard>
          <SectionHeading title="Fleet Vehicles" />
          <DataTable
            columns={[
              { key: 'id', header: 'Vehicle ID' },
              { key: 'make', header: 'Make/Model' },
              { key: 'year', header: 'Year' },
              { key: 'status', header: 'Status' },
              { key: 'location', header: 'Location' }
            ]}
            rows={fleetData.map(vehicle => ({
              id: vehicle.id,
              make: vehicle.make,
              year: vehicle.year,
              status: vehicle.status,
              location: vehicle.location
            }))}
            emptyText="No fleet vehicles found"
          />
        </GlassCard>
      </div>
    </AppShell>
  );
};

export default Fleet;
