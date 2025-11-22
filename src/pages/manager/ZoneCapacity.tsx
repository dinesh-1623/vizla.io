/**
 * Zone Capacity Page
 * Manager view for capacity planning and resource allocation
 */

import React from 'react';
import AppShell from '@/components/shell/AppShell';
import { ZoneCapacityPanel } from '@/components/zone/ZoneCapacityPanel';

const ZoneCapacity: React.FC = () => {
  return (
    <AppShell title="Zone Capacity Planning">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-vizla-text-primary">Zone Capacity Planning</h1>
          <p className="text-vizla-text-secondary mt-1">
            Monitor driver capacity, track progress against goals, and optimize resource allocation
          </p>
        </div>

        <ZoneCapacityPanel />
      </div>
    </AppShell>
  );
};

export default ZoneCapacity;

