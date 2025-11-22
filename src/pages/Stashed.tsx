import React, { useMemo } from 'react';
import AppShell from '@/components/shell/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DataTable } from '@/components/ui/DataTable';
import { useVehicles } from '@/hooks/useVehicles';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const Stashed: React.FC = () => {
  // Load vehicles from unified data source
  const { data: vehicles, isLoading, error, refetch } = useVehicles({ status: 'Stashed' });

  // Transform vehicles to table format
  const stashedCars = useMemo(() => {
    if (!vehicles) return [];
    return vehicles.map(vehicle => ({
      id: vehicle.id,
      yearMakeModel: `${vehicle.year || 'N/A'} ${vehicle.make || ''} ${vehicle.model || ''}`.trim(),
      client: vehicle.client || 'Unknown',
      zone: vehicle.zone || 'Unknown',
      locatedDate: vehicle.locatedAt ? new Date(vehicle.locatedAt).toISOString().split('T')[0] : 'N/A',
    }));
  }, [vehicles]);

  // Show loading state
  if (isLoading) {
    return (
      <AppShell title="Stashed">
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </AppShell>
    );
  }

  // Show error state
  if (error) {
    return (
      <AppShell title="Stashed">
        <div className="space-y-6">
          <GlassCard>
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">Error loading vehicles: {error instanceof Error ? error.message : 'Unknown error'}</p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </div>
          </GlassCard>
        </div>
      </AppShell>
    );
  }

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
              storage: 'Lot A' // TODO: Get from vehicle data when available
            }))}
            emptyText="No vehicles in storage"
          />
        </GlassCard>
      </div>
    </AppShell>
  );
};

export default Stashed;
