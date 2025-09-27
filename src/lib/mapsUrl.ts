import { type LatLng } from './geo';
import { type Point, type HybridStep } from './routing';

export type Location = LatLng | string;

export function asWaypoint(p: Location): string {
  return typeof p === 'string' ? p : `${p.lat},${p.lng}`;
}

export function toGoogleUrl({
  origin,
  destination,
  waypoints,
  optimize = false
}: {
  origin: Location;
  destination: Location;
  waypoints: Location[];
  optimize?: boolean;
}): string {
  const base = "https://www.google.com/maps/dir/?api=1";
  const wp = waypoints.length
    ? `&waypoints=${optimize ? 'optimize:true|' : ''}${waypoints.map(asWaypoint).join('|')}`
    : "";
  return `${base}&origin=${encodeURIComponent(asWaypoint(origin))}` +
         `&destination=${encodeURIComponent(asWaypoint(destination))}${wp}`;
}

// Split waypoints into segments that fit Google's 10-location limit
export function splitForGoogleLimit(points: Location[], max = 10): Location[][] {
  if (points.length <= max) return [points];
  
  const segments: Location[][] = [];
  for (let i = 0; i < points.length; i += max - 1) {
    segments.push(points.slice(i, i + max - 1));
  }
  
  return segments;
}

// Build Return-to-Lot routes (individual round trips)
export function buildRoundTripLot(
  dayCars: Point[],
  lot: LatLng
): Array<{ label: string; url: string }> {
  return dayCars.map(car => ({
    label: `Pickup ${car.label}`,
    url: toGoogleUrl({
      origin: lot,
      destination: lot,
      waypoints: [car],
      optimize: false
    })
  }));
}

// Build Stash chain route
export function buildStashChain(
  dayCars: Point[],
  lot: LatLng,
  stash: LatLng,
  finishAtLot = true
): Array<{ label: string; url: string }> {
  const waypoints: Location[] = [];
  
  // Build chain: lot → car1 → stash → car2 → stash → ...
  dayCars.forEach(car => {
    waypoints.push(car);
    waypoints.push(stash);
  });
  
  const destination = finishAtLot ? lot : stash;
  const allPoints = [lot, ...waypoints, destination];
  
  if (allPoints.length <= 10) {
    return [{
      label: 'Stash Route',
      url: toGoogleUrl({
        origin: lot,
        destination,
        waypoints,
        optimize: true
      })
    }];
  }
  
  // Split into segments
  const segments = splitForGoogleLimit(allPoints.slice(1, -1), 8); // Reserve space for origin/dest
  return segments.map((segment, index) => ({
    label: `Stash Route - Segment ${index + 1}`,
    url: toGoogleUrl({
      origin: index === 0 ? lot : segment[0],
      destination: index === segments.length - 1 ? destination : segment[segment.length - 1],
      waypoints: segment.slice(1, -1),
      optimize: true
    })
  }));
}

// Build Hybrid chain route
export function buildHybridChain(
  hybridSteps: HybridStep[],
  lot: LatLng,
  stash: LatLng,
  finishAtLot = true
): Array<{ label: string; url: string }> {
  const waypoints: Location[] = [];
  
  // Build chain based on hybrid decisions
  hybridSteps.forEach(step => {
    waypoints.push(`${step.carId}`); // Will be replaced with actual coordinates
    waypoints.push(step.drop === 'lot' ? lot : stash);
  });
  
  const lastStep = hybridSteps[hybridSteps.length - 1];
  const destination = finishAtLot ? lot : (lastStep?.drop === 'stash' ? stash : lot);
  const allPoints = [lot, ...waypoints, destination];
  
  if (allPoints.length <= 10) {
    return [{
      label: 'Optimized Route',
      url: toGoogleUrl({
        origin: lot,
        destination,
        waypoints,
        optimize: true
      })
    }];
  }
  
  // Split into segments
  const segments = splitForGoogleLimit(allPoints.slice(1, -1), 8);
  return segments.map((segment, index) => ({
    label: `Optimized Route - Segment ${index + 1}`,
    url: toGoogleUrl({
      origin: index === 0 ? lot : segment[0],
      destination: index === segments.length - 1 ? destination : segment[segment.length - 1],
      waypoints: segment.slice(1, -1),
      optimize: true
    })
  }));
}

// Build Hybrid chain with actual coordinates
export function buildHybridChainWithCoords(
  hybridSteps: HybridStep[],
  points: Point[],
  lot: LatLng,
  stash: LatLng,
  finishAtLot = true
): Array<{ label: string; url: string }> {
  const waypoints: Location[] = [];
  
  // Build chain with actual coordinates
  hybridSteps.forEach(step => {
    const car = points.find(p => p.id === step.carId);
    if (car) {
      waypoints.push(car);
      waypoints.push(step.drop === 'lot' ? lot : stash);
    }
  });
  
  const lastStep = hybridSteps[hybridSteps.length - 1];
  const destination = finishAtLot ? lot : (lastStep?.drop === 'stash' ? stash : lot);
  const allPoints = [lot, ...waypoints, destination];
  
  if (allPoints.length <= 10) {
    return [{
      label: 'Optimized Route',
      url: toGoogleUrl({
        origin: lot,
        destination,
        waypoints,
        optimize: true
      })
    }];
  }
  
  // Split into segments
  const segments = splitForGoogleLimit(allPoints.slice(1, -1), 8);
  return segments.map((segment, index) => ({
    label: `Optimized Route - Segment ${index + 1}`,
    url: toGoogleUrl({
      origin: index === 0 ? lot : segment[0],
      destination: index === segments.length - 1 ? destination : segment[segment.length - 1],
      waypoints: segment.slice(1, -1),
      optimize: true
    })
  }));
}
