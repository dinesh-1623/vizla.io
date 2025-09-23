import React, { useState } from 'react';
import AppShell from '@/components/shell/AppShell';
import { getCarsByQueue } from '@/lib/mockState';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DataTable } from '@/components/ui/DataTable';
import { VehicleCard } from '@/components/driver/VehicleCard';

const TowTrucks: React.FC = () => {
  const [selectedDriver, setSelectedDriver] = useState('Naz');
  const dispatchedCars = getCarsByQueue('dispatched');
  const driverCars = dispatchedCars.filter(car => car.assignedDriver === selectedDriver);

  const drivers = ['Naz', 'Roger', 'Carla V', 'Dana M'];

  return (
    <AppShell title="Tow Trucks">
      <div className="space-y-6">
        {/* Header */}
        <SectionHeading
          title="Tow Trucks"
          subtitle="Driver assignments and active dispatch queues"
        />

        {/* Driver Selector */}
        <GlassCard>
          <SectionHeading title="Select Driver" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {drivers.map((driver) => (
              <button
                key={driver}
                onClick={() => setSelectedDriver(driver)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${selectedDriver === driver
                    ? 'bg-white text-slate-900'
                    : 'bg-white/10 text-neutral-200 hover:bg-white/20'
                  }
                `}
              >
                {driver}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Driver Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{driverCars.length}</div>
              <div className="text-sm text-muted mt-1">Active Dispatches</div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">2.1h</div>
              <div className="text-sm text-muted mt-1">Avg Response Time</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">97%</div>
              <div className="text-sm text-muted mt-1">Success Rate</div>
            </div>
          </GlassCard>
        </div>

        {/* Driver's Assigned Vehicles */}
        <GlassCard>
          <SectionHeading title={`${selectedDriver}'s Assigned Vehicles`} />
          {driverCars.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {driverCars.map((car) => (
                <VehicleCard key={car.id} car={car} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-secondary">No vehicles assigned to {selectedDriver}</p>
            </div>
          )}
        </GlassCard>
      </div>
    </AppShell>
  );
};

export default TowTrucks;
