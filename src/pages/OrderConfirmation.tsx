import React, { useMemo, useState, useEffect } from 'react';
import AppShell from '@/components/shell/AppShell';
import { getCombinedTowCards } from '@/lib/integration/spotterToDriver';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DataTable } from '@/components/ui/DataTable';
import { TOW_CARDS } from '@/app/tow-driver/data/baltimoreRun';

const OrderConfirmation: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  // Get spotter submissions as TowCards
  const spotterCards = useMemo(() => {
    const cards = getCombinedTowCards(TOW_CARDS);
    console.log('OrderConfirmation: Loaded spotter cards:', {
      count: cards.length,
      cards: cards.map(card => ({
        id: card.id,
        client: card.client,
        address: card.street,
        year: card.year,
        make: card.make,
        model: card.model
      }))
    });
    return cards;
  }, [refreshKey]);

  // Refresh data when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('OrderConfirmation: Storage changed, refreshing data...');
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('spotterSubmissionAdded', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('spotterSubmissionAdded', handleStorageChange);
    };
  }, []);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalVehicles = spotterCards.length;
    const uniqueClients = new Set(spotterCards.map(card => card.client)).size;
    
    // Calculate pending orders (mock calculation - in real app, this would be based on actual order status)
    const pendingOrders = Math.max(1, Math.floor(uniqueClients * 0.7)); // 70% of clients need order confirmation
    
    return {
      totalVehicles,
      uniqueClients,
      pendingOrders
    };
  }, [spotterCards]);

  return (
    <AppShell title="Order Confirmation">
      <div className="space-y-6">
        {/* Header */}
        <SectionHeading
          title="Order Confirmation"
          subtitle={`${metrics.pendingOrders} clients need order confirmation`}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{metrics.pendingOrders}</div>
              <div className="text-sm text-muted mt-1">Pending Orders</div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{metrics.totalVehicles}</div>
              <div className="text-sm text-muted mt-1">Vehicles Awaiting</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{metrics.pendingOrders}</div>
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
            rows={spotterCards.map(card => ({
              vehicle: `${card.year} ${card.make} ${card.model}, ${card.color}`,
              client: card.client,
              zone: card.city,
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
