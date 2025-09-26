import { LatLng } from "./geo";

export type ServiceTimes = {
  hookupMin: number;   // per pickup
  dropLotMin: number;  // per lot drop
  dropStashMin: number;// per stash drop
  cityMph: number;     // fallback speed if no API
};

export type Point = LatLng & { id: string; label: string };

export type TravelFn = (from: LatLng, to: LatLng) => Promise<number> | number; // minutes

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
  let drive = 0;
  for (const c of cars) {
    drive += Number(await travel(lot, c));
    drive += Number(await travel(c, lot));
  }
  const service = cars.length * (svc.hookupMin + svc.dropLotMin);
  return { driveMin: drive, serviceMin: service, totalMin: drive + service };
}

// Stash: lot→first car→stash, then stash↔car for remaining; optional final stash→lot
export async function totalStash(
  cars: Point[], lot: LatLng, stash: LatLng, travel: TravelFn,
  svc: ServiceTimes, finishAtLot = true
) {
  if (!cars.length) return { driveMin: 0, serviceMin: 0, totalMin: 0 };
  const ordered = orderForStash(cars, lot, stash);

  let drive = 0;
  // first cycle: lot -> first car -> stash
  drive += Number(await travel(lot, ordered[0]));
  drive += Number(await travel(ordered[0], stash));

  // remaining cycles: stash -> car -> stash
  for (let i = 1; i < ordered.length; i++) {
    drive += Number(await travel(stash, ordered[i]));
    drive += Number(await travel(ordered[i], stash));
  }

  if (finishAtLot) drive += Number(await travel(stash, lot));

  const service = ordered.length * (svc.hookupMin + svc.dropStashMin);
  return { driveMin: drive, serviceMin: service, totalMin: drive + service, order: ordered };
}
