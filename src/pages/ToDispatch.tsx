import React, { useMemo, useState } from 'react';
import AppShell from '@/components/shell/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DataTable } from '@/components/ui/DataTable';
import { SmartDispatchPanel } from '@/components/dispatch/SmartDispatchPanel';
import { smartDispatchAssign } from '@/lib/services/smartDispatch';
import type { SmartDispatchResult, SmartDispatchInput } from '@/lib/ai/services/SmartDispatchService';
import type { Vehicle, Driver } from '@/lib/assignment/types';
import { mockDrivers } from '@/lib/assignment/mockData';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useVehicles } from '@/hooks/useVehicles';
import { transformToTowCard } from '@/lib/data/transformers';
import { Skeleton } from '@/components/ui/skeleton';

const ToDispatch: React.FC = () => {
  const [isSmartDispatching, setIsSmartDispatching] = useState(false);
  const [smartDispatchResult, setSmartDispatchResult] = useState<SmartDispatchResult | null>(null);
  const [showSmartDispatch, setShowSmartDispatch] = useState(false);

  // Load vehicles from unified data source
  const { data: vehicles, isLoading, error, refetch } = useVehicles({ status: 'to_dispatch' });

  // Transform vehicles to TowCard format
  const spotterCards = useMemo(() => {
    if (!vehicles) return [];
    return vehicles.map(transformToTowCard);
  }, [vehicles]);

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

  // Calculate priority based on days since located
  const getPriority = (vehicle: typeof vehicles[0] | undefined) => {
    if (!vehicle?.locatedAt) return 'Normal';
    const locatedDate = new Date(vehicle.locatedAt);
    const daysSinceLocated = Math.floor((Date.now() - locatedDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceLocated >= 5 ? 'High' : 'Normal';
  };

  // Format located date
  const getLocatedDate = (vehicle: typeof vehicles[0] | undefined) => {
    if (!vehicle?.locatedAt) return 'N/A';
    return new Date(vehicle.locatedAt).toISOString().split('T')[0];
  };

  // Convert TowCard to Vehicle for Smart Dispatch
  const vehiclesForDispatch = useMemo((): Vehicle[] => {
    return spotterCards
      .filter(card => card.lat && card.lng)
      .map(card => {
        // Calculate priority based on vehicle data
        const randomDays = Math.floor(Math.random() * 10);
        const priority = randomDays >= 5 ? 'high' : 'medium';
        
        return {
          id: card.id,
          client: card.client,
          zone: card.city,
          address: card.fullAddress || `${card.street}, ${card.city} ${card.zip}`,
          location: {
            lat: card.lat || 39.2904, // Default to Baltimore if missing
            lng: card.lng || -76.6122,
          },
          priority: priority as 'high' | 'medium' | 'low',
          estimatedPickupTime: 15, // Default 15 minutes
          specialRequirements: card.notes ? [card.notes.join(', ')] : undefined,
        };
      });
  }, [spotterCards]);

  // Get available drivers
  const availableDrivers = useMemo((): Driver[] => {
    return mockDrivers.filter(d => d.status === 'active');
  }, []);

  // Handle Smart Dispatch
  const handleSmartDispatch = async () => {
    if (vehiclesForDispatch.length === 0) {
      toast.error('No vehicles available for dispatch');
      return;
    }

    if (availableDrivers.length === 0) {
      toast.error('No active drivers available');
      return;
    }

    setIsSmartDispatching(true);
    setShowSmartDispatch(true);
    setSmartDispatchResult(null);

    try {
      const input: SmartDispatchInput = {
        vehicles: vehiclesForDispatch,
        drivers: availableDrivers,
        assignmentCriteria: {
          maxDistanceKm: 50,
          maxCrossZoneAssignments: 10,
          priorityWeights: {
            zoneMatch: 100,
            capacity: 50,
            distance: 25,
            priority: 75,
          },
        },
      };

      const result = await smartDispatchAssign(input);
      setSmartDispatchResult(result);

      if (result.success) {
        toast.success(
          `Successfully assigned ${result.assignmentSummary.assignedCount} of ${result.assignmentSummary.totalVehicles} vehicles`,
          { duration: 3000 }
        );
      } else {
        toast.error(result.error || 'Smart dispatch failed');
      }
    } catch (error: any) {
      console.error('Error in smart dispatch:', error);
      toast.error(error.message || 'Failed to perform smart dispatch');
    } finally {
      setIsSmartDispatching(false);
    }
  };

  // Handle applying assignments
  const handleApplyAssignments = () => {
    if (!smartDispatchResult?.success) return;

    toast.info('Applying assignments...', { duration: 2000 });
    // TODO: Implement actual assignment logic
    // This would typically update the database with driver assignments
    console.log('Applying assignments:', smartDispatchResult.assignments);
    
    setShowSmartDispatch(false);
    refetch(); // Refresh the data
  };

  // Show loading state
  if (isLoading) {
    return (
      <AppShell title="To Dispatch">
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
      <AppShell title="To Dispatch">
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
    <AppShell title="To Dispatch">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <SectionHeading
            title="To Dispatch"
            subtitle={`${metrics.totalVehicles} vehicles ready for dispatch`}
          />
          <Button
            onClick={handleSmartDispatch}
            disabled={isSmartDispatching || vehiclesForDispatch.length === 0 || availableDrivers.length === 0}
            className="flex items-center gap-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30"
          >
            {isSmartDispatching ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                AI Smart Dispatch
              </>
            )}
          </Button>
        </div>

        {/* Smart Dispatch Panel */}
        {showSmartDispatch && smartDispatchResult && (
          <SmartDispatchPanel
            result={smartDispatchResult}
            isLoading={isSmartDispatching}
            onClose={() => setShowSmartDispatch(false)}
            onApply={handleApplyAssignments}
          />
        )}

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
            rows={spotterCards.map((card, index) => {
              const vehicle = vehicles?.[index];
              return {
                vehicle: `${card.year} ${card.make} ${card.model}, ${card.color}`,
                client: card.client,
                zone: card.city,
                located: getLocatedDate(vehicle),
                priority: getPriority(vehicle)
              };
            })}
            emptyText="No vehicles ready for dispatch"
          />
        </GlassCard>
      </div>
    </AppShell>
  );
};

export default ToDispatch;
