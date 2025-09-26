import { useMemo } from 'react';
import { TowCar } from '@/lib/data/driverSource';
import { createRouteGroups, RouteGroup, getCarStepNumber } from '@/lib/data/routeGroups';

export function useRouteGroups(cars: TowCar[]) {
  const routeGroups = useMemo(() => {
    return createRouteGroups(cars);
  }, [cars]);

  const getCarStepNumber = (car: TowCar): number => {
    const group = routeGroups.find(g => g.cars.some(c => c.vin === car.vin));
    if (!group) return 0;
    return getCarStepNumber(car, group);
  };

  const getGroupForCar = (car: TowCar): RouteGroup | null => {
    return routeGroups.find(g => g.cars.some(c => c.vin === car.vin)) || null;
  };

  return {
    routeGroups,
    getCarStepNumber,
    getGroupForCar
  };
}
