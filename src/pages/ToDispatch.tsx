import React, { useMemo, useState, useEffect } from 'react';
import AppShell from '@/components/shell/AppShell';
import { getCombinedTowCards } from '@/lib/integration/spotterToDriver';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DataTable } from '@/components/ui/DataTable';
import { TOW_CARDS } from '@/app/tow-driver/data/baltimoreRun';

const ToDispatch: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  // Get spotter submissions as TowCards
  const spotterCards = useMemo(() => {
    const cards = getCombinedTowCards(TOW_CARDS);
    console.log('ToDispatch: Loaded spotter cards:', {
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
      console.log('ToDispatch: Storage changed, refreshing data...');
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
    const uniqueZones = new Set(spotterCards.map(card => card.city)).size;
    
    // Calculate average dispatch time (mock calculation based on vehicle count)
    const avgDispatchTime = totalVehicles > 0 ? (totalVehicles * 0.5).toFixed(1) : '0.0';
    
    return {
      totalVehicles,
      uniqueClients,
      uniqueZones,
      avgDispatchTime
    };
  }, [spotterCards]);

  // Calculate priority based on days since located (mock calculation)
  const getPriority = (card: any) => {
    // Mock priority calculation - in real app, this would be based on actual located date
    const randomDays = Math.floor(Math.random() * 10);
    return randomDays >= 5 ? 'High' : 'Normal';
  };

  // Format located date (mock)
  const getLocatedDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 7));
    return date.toISOString().split('T')[0];
  };

  return (
    <AppShell title="To Dispatch">
      <div className="space-y-6">
        {/* Header */}
        <SectionHeading
          title="To Dispatch"
          subtitle={`${metrics.totalVehicles} vehicles ready for dispatch`}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{metrics.totalVehicles}</div>
              <div className="text-sm text-muted mt-1">Ready to Dispatch</div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{metrics.uniqueClients}</div>
              <div className="text-sm text-muted mt-1">Active Clients</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{metrics.uniqueZones}</div>
              <div className="text-sm text-muted mt-1">Active Zones</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{metrics.avgDispatchTime}h</div>
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
            rows={spotterCards.map(card => ({
              vehicle: `${card.year} ${card.make} ${card.model}, ${card.color}`,
              client: card.client,
              zone: card.city,
              located: getLocatedDate(),
              priority: getPriority(card)
            }))}
            emptyText="No vehicles ready for dispatch"
          />
        </GlassCard>
      </div>
    </AppShell>
  );
};

export default ToDispatch;
