import React from 'react';
import AppShell from '@/components/shell/AppShell';
import { getOrderConfirmationCount, getCarsByQueue } from '@/lib/mockState';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DataTable } from '@/components/ui/DataTable';

const OrderConfirmation: React.FC = () => {
  const orderCount = getOrderConfirmationCount();
  const pendingCars = getCarsByQueue('to-dispatch');

  return (
    <AppShell title="Order Confirmation">
      <div className="space-y-6">
        {/* Header */}
        <SectionHeading
          title="Order Confirmation"
          subtitle={`${orderCount} clients need order confirmation`}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{orderCount}</div>
              <div className="text-sm text-muted mt-1">Pending Orders</div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{pendingCars.length}</div>
              <div className="text-sm text-muted mt-1">Vehicles Awaiting</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">3</div>
              <div className="text-sm text-muted mt-1">Clients Missing Orders</div>
            </div>
          </GlassCard>
        </div>

        {/* Vehicles Table */}
        <GlassCard>
          <SectionHeading title="Vehicles Awaiting Dispatch" />
          <DataTable
            columns={[
              { key: 'vehicle', header: 'Vehicle' },
              { key: 'client', header: 'Client' },
              { key: 'zone', header: 'Zone' },
              { key: 'status', header: 'Status' }
            ]}
            rows={pendingCars.map(car => ({
              vehicle: car.yearMakeModel,
              client: car.client,
              zone: car.zone,
              status: 'Awaiting Order'
            }))}
            emptyText="No vehicles awaiting order confirmation"
          />
        </GlassCard>
      </div>
    </AppShell>
  );
};

export default OrderConfirmation;
