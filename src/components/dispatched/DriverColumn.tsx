/**
 * Driver Column
 * Complete driver column with card and contextual vehicle list
 */

import React, { useState, useMemo } from 'react';
import { DriverCard } from './DriverCard';
import { VehicleList } from './VehicleList';
import type { DriverSummary, DispatchedVehicle, Status } from '@/lib/data/dispatchedMock';

interface DriverColumnProps {
  driver: DriverSummary;
  onVehicleClick: (vehicle: DispatchedVehicle) => void;
}

export const DriverColumn: React.FC<DriverColumnProps> = ({
  driver,
  onVehicleClick
}) => {
  const [activeStatus, setActiveStatus] = useState<Status>('located');

  // Filter vehicles by active status
  const filteredVehicles = useMemo(() => {
    return driver.vehicles.filter(v => v.status === activeStatus);
  }, [driver.vehicles, activeStatus]);

  return (
    <div className="space-y-4">
      {/* Driver Card */}
      <DriverCard
        driver={driver}
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
      />

      {/* Vehicle List (contextual to selected status) */}
      <VehicleList
        vehicles={filteredVehicles}
        status={activeStatus}
        driverName={driver.name}
        onVehicleClick={onVehicleClick}
      />
    </div>
  );
};








