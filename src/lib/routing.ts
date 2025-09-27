import { LatLng } from "./geo";

export type ServiceTimes = {
  hookupMin: number;   // per pickup
  dropLotMin: number;  // per lot drop
  dropStashMin: number;// per stash drop
  cityMph: number;     // fallback speed if no API
};

export type Point = LatLng & { id: string; label: string };

export type TravelFn = (from: LatLng, to: LatLng) => Promise<number> | number; // minutes

export type HybridStep = {
  carId: string;
  drop: "lot" | "stash";
  legMin: number;          // drive minutes for this pickup (from current position -> car -> chosen drop)
  driveBreakdown: { toCar: number; toDrop: number };
  serviceMin: number;      // hookup + chosen drop service
};

export function minutesFromMiles(mi: number, mph: number) {
  return (mi / mph) * 60;
}

// Choose first car nearest to lot, rest sorted by distance to stash (tightest loop)
export function orderForStash(cars: Point[], lot: LatLng, stash: LatLng): Point[] {
  if (!cars.length) return [];
  const nearestToLot = [...cars].sort(
    (a, b) =>
      (a.lat - lot.lat) ** 2 + (a.lng - lot.lng) ** 2 -
      ((b.lat - lot.lat) ** 2 + (b.lng - lot.lng) ** 2)
  )[0];
  const rest = cars.filter(c => c.id !== nearestToLot.id)
    .sort((a, b) =>
      (a.lat - stash.lat) ** 2 + (a.lng - stash.lng) ** 2 -
      ((b.lat - stash.lat) ** 2 + (b.lng - stash.lng) ** 2)
    );
  return [nearestToLot, ...rest];
}

// Return-to-Lot: sum per-vehicle cycles; order doesn't change total
export async function totalReturnToLot(
  cars: Point[], lot: LatLng, travel: TravelFn, svc: ServiceTimes
) {
  if (!cars.length) {
    return { driveMin: 0, serviceMin: 0, totalMin: 0 };
  }

  let drive = 0;
  for (const c of cars) {
    try {
      const toCar = Number(await travel(lot, c));
      const toLot = Number(await travel(c, lot));
      
      if (isNaN(toCar) || isNaN(toLot)) {
        console.warn(`Invalid travel time for car ${c.id}: toCar=${toCar}, toLot=${toLot}`);
        continue;
      }
      
      drive += toCar + toLot;
    } catch (error) {
      console.error(`Travel calculation failed for car ${c.id}:`, error);
    }
  }
  
  const service = cars.length * (svc.hookupMin + svc.dropLotMin);
  const total = drive + service;
  
  console.log(`Return-to-Lot calculation: ${cars.length} cars, drive=${drive}min, service=${service}min, total=${total}min`);
  
  return { driveMin: drive, serviceMin: service, totalMin: total };
}

// Stash: lot→first car→stash, then stash↔car for remaining; optional final stash→lot
export async function totalStash(
  cars: Point[], lot: LatLng, stash: LatLng, travel: TravelFn,
  svc: ServiceTimes, finishAtLot = true
) {
  if (!cars.length) return { driveMin: 0, serviceMin: 0, totalMin: 0 };
  
  const ordered = orderForStash(cars, lot, stash);
  let drive = 0;

  try {
    // first cycle: lot -> first car -> stash
    const toFirstCar = Number(await travel(lot, ordered[0]));
    const firstCarToStash = Number(await travel(ordered[0], stash));
    
    if (!isNaN(toFirstCar) && !isNaN(firstCarToStash)) {
      drive += toFirstCar + firstCarToStash;
    }

    // remaining cycles: stash -> car -> stash
    for (let i = 1; i < ordered.length; i++) {
      const toCar = Number(await travel(stash, ordered[i]));
      const carToStash = Number(await travel(ordered[i], stash));
      
      if (!isNaN(toCar) && !isNaN(carToStash)) {
        drive += toCar + carToStash;
      }
    }

    if (finishAtLot) {
      const stashToLot = Number(await travel(stash, lot));
      if (!isNaN(stashToLot)) {
        drive += stashToLot;
      }
    }
  } catch (error) {
    console.error('Stash calculation failed:', error);
  }

  const service = ordered.length * (svc.hookupMin + svc.dropStashMin);
  const total = drive + service;
  
  console.log(`Stash calculation: ${cars.length} cars, drive=${drive}min, service=${service}min, total=${total}min`);
  
  return { driveMin: drive, serviceMin: service, totalMin: total, order: ordered };
}

// Hybrid: after each pickup, choose lot or stash based on which yields less total time
export async function totalHybridPerStop(
  cars: Point[],           // 20 vehicles with lat/lng
  lot: LatLng,
  stash: LatLng,
  travel: TravelFn,
  svc: ServiceTimes,
  finishAtLot = true
) {
  if (!cars.length) {
    return { steps: [], driveMin: 0, serviceMin: 0, totalMin: 0 };
  }

  // Start at lot. For ordering pickups, use nearest-neighbor from current position
  let current = lot;
  const steps: HybridStep[] = [];
  let drive = 0, service = 0;
  const remaining = [...cars];

  try {
    while (remaining.length > 0) {
      // Find nearest car to current position
      const nearestIndex = remaining.reduce((minIndex, car, index) => {
        const currentDist = (car.lat - current.lat) ** 2 + (car.lng - current.lng) ** 2;
        const minDist = (remaining[minIndex].lat - current.lat) ** 2 + (remaining[minIndex].lng - current.lng) ** 2;
        return currentDist < minDist ? index : minIndex;
      }, 0);
      
      const car = remaining.splice(nearestIndex, 1)[0];

      const toCar = Number(await travel(current, car));
      const toLot = Number(await travel(car, lot));
      const toStash = Number(await travel(car, stash));

      // Skip if any travel time is invalid
      if (isNaN(toCar) || isNaN(toLot) || isNaN(toStash)) {
        console.warn(`Invalid travel times for car ${car.id}: toCar=${toCar}, toLot=${toLot}, toStash=${toStash}`);
        continue;
      }

      const lotCost   = toCar + toLot   + svc.hookupMin + svc.dropLotMin;
      const stashCost = toCar + toStash + svc.hookupMin + svc.dropStashMin;

      const drop: "lot" | "stash" = lotCost <= stashCost ? "lot" : "stash";
      const legMin = drop === "lot" ? toCar + toLot : toCar + toStash;
      const serviceMin = svc.hookupMin + (drop === "lot" ? svc.dropLotMin : svc.dropStashMin);

      drive += legMin;
      service += serviceMin;

      steps.push({
        carId: car.id,
        drop,
        legMin,
        driveBreakdown: { toCar, toDrop: drop === "lot" ? toLot : toStash },
        serviceMin
      });

      current = drop === "lot" ? lot : stash;
    }

    if (finishAtLot && (current !== lot)) {
      const back = Number(await travel(current, lot));
      if (!isNaN(back)) {
        drive += back;
      }
    }
  } catch (error) {
    console.error('Hybrid calculation failed:', error);
  }

  const total = drive + service;
  
  console.log(`Hybrid calculation: ${cars.length} cars, drive=${drive}min, service=${service}min, total=${total}min, steps=${steps.length}`);
  
  return { steps, driveMin: drive, serviceMin: service, totalMin: total };
}
