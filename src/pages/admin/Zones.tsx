import React from 'react';
import AppShell from '@/components/shell/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DataTable } from '@/components/ui/DataTable';

const Zones: React.FC = () => {
  const zonesData = [
    { zone: 'Dallas-North', activeVehicles: 4, avgResponseTime: '1.8h', coverage: '95%' },
    { zone: 'Dallas-East', activeVehicles: 3, avgResponseTime: '2.1h', coverage: '88%' },
    { zone: 'Dallas-South', activeVehicles: 5, avgResponseTime: '1.5h', coverage: '92%' },
    { zone: 'Dallas-West', activeVehicles: 2, avgResponseTime: '2.4h', coverage: '85%' }
  ];

  return (
    <AppShell title="Zones">
      <div className="space-y-6">
        {/* Header */}
        <SectionHeading
          title="Zone Management"
          subtitle="Service zones and coverage areas"
        />

        {/* Zone Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">4</div>
              <div className="text-sm text-muted mt-1">Active Zones</div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">14</div>
              <div className="text-sm text-muted mt-1">Total Vehicles</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">1.9h</div>
              <div className="text-sm text-muted mt-1">Avg Response</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">90%</div>
              <div className="text-sm text-muted mt-1">Avg Coverage</div>
            </div>
          </GlassCard>
        </div>

        {/* Zones Table */}
        <GlassCard>
          <SectionHeading title="Zone Coverage" />
          <DataTable
            columns={[
              { key: 'zone', header: 'Zone' },
              { key: 'activeVehicles', header: 'Active Vehicles' },
              { key: 'avgResponseTime', header: 'Avg Response Time' },
              { key: 'coverage', header: 'Coverage' }
            ]}
            rows={zonesData.map(zone => ({
              zone: zone.zone,
              activeVehicles: zone.activeVehicles,
              avgResponseTime: zone.avgResponseTime,
              coverage: zone.coverage
            }))}
            emptyText="No zones found"
          />
        </GlassCard>
      </div>
    </AppShell>
  );
};

export default Zones;
