import { haversineMiles, type LatLng } from './geo';
import { TOW_CARDS, type TowCard } from '@/app/tow-driver/data/baltimoreRun';

export interface BatchVehicle {
  id: string;
  address: string;
  lat: number;
  lng: number;
  client: string;
  year: string;
  make: string;
  model: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface RouteBatch {
  id: string;
  vehicles: BatchVehicle[];
  lotTime: number; // minutes to complete this batch (return to lot)
  stashTime: number; // minutes to complete this batch (return to stash)
  stashSavings: number; // minutes saved by using stash vs lot
  estimatedStartTime: Date;
  estimatedEndTime: Date;
}

export interface BatchingOptions {
  strategy: 'lot' | 'stash' | 'optimized';
  shiftLengthHours: number;
  startTime: Date;
  finishStashAtLot: boolean;
  serviceTimes: {
    hookupMin: number;
    dropLotMin: number;
    dropStashMin: number;
    cityMph: number;
  };
}

// Convert TowCard to BatchVehicle
function towCardToBatchVehicle(card: TowCard): BatchVehicle {
  // Generate fake difficulty based on vehicle type/age
  const year = card.year;
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  
  let difficulty: 'easy' | 'medium' | 'hard';
  if (age <= 5) {
    difficulty = 'easy';
  } else if (age <= 10) {
    difficulty = 'medium';
  } else {
    difficulty = 'hard';
  }
  
  // Extract coordinates from address (same logic as TowDriver)
  const coordMatch = card.fullAddress.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
  let lat: number, lng: number;
  
  if (coordMatch) {
    // Use actual coordinates from address
    lat = parseFloat(coordMatch[1]);
    lng = parseFloat(coordMatch[2]);
  } else {
    // Generate deterministic pseudo-coordinates based on card index
    const baseLat = 39.238;
    const baseLng = -76.589;
    const cardIndex = parseInt(card.id);
    const offsetLat = (cardIndex % 10) * 0.001;
    const offsetLng = (cardIndex % 10) * 0.001;
    lat = baseLat + offsetLat;
    lng = baseLng + offsetLng;
  }
  
  return {
    id: card.id,
    address: card.fullAddress,
    lat,
    lng,
    client: card.client,
    year: card.year.toString(),
    make: card.make,
    model: card.model,
    difficulty
  };
}

// Calculate travel time between two points
function calculateTravelTime(from: LatLng, to: LatLng, cityMph: number): number {
  const miles = haversineMiles(from, to);
  return (miles / cityMph) * 60; // minutes
}

// Calculate batch completion time for a specific strategy
function calculateBatchTime(
  vehicles: BatchVehicle[],
  origin: LatLng,
  strategy: 'lot' | 'stash',
  serviceTimes: BatchingOptions['serviceTimes'],
  lot: LatLng,
  stash: LatLng
): number {
  let totalTime = 0;
  let currentPos = origin;
  
  for (const vehicle of vehicles) {
    // Travel to vehicle
    totalTime += calculateTravelTime(currentPos, vehicle, serviceTimes.cityMph);
    
    // Service time (hookup)
    totalTime += serviceTimes.hookupMin;
    
    // Travel to destination (lot or stash)
    const destination = strategy === 'lot' ? lot : stash;
    totalTime += calculateTravelTime(vehicle, destination, serviceTimes.cityMph);
    
    // Service time (drop)
    totalTime += strategy === 'lot' ? serviceTimes.dropLotMin : serviceTimes.dropStashMin;
    
    // Update position for next vehicle
    currentPos = destination;
  }
  
  return Math.round(totalTime);
}

// Find nearest vehicles using greedy nearest neighbor
function findNearestVehicles(
  available: BatchVehicle[],
  origin: LatLng,
  count: number,
  cityMph: number
): BatchVehicle[] {
  if (available.length <= count) {
    return [...available];
  }
  
  const selected: BatchVehicle[] = [];
  const remaining = [...available];
  let currentPos = origin;
  
  for (let i = 0; i < count && remaining.length > 0; i++) {
    // Find nearest vehicle
    let nearestIndex = 0;
    let nearestTime = calculateTravelTime(currentPos, remaining[0], cityMph);
    
    for (let j = 1; j < remaining.length; j++) {
      const time = calculateTravelTime(currentPos, remaining[j], cityMph);
      if (time < nearestTime) {
        nearestTime = time;
        nearestIndex = j;
      }
    }
    
    const nearest = remaining.splice(nearestIndex, 1)[0];
    selected.push(nearest);
    currentPos = nearest;
  }
  
  return selected;
}

// Generate batches of 4 vehicles
export function generateBatches(
  allVehicles: TowCard[],
  options: BatchingOptions,
  lot: LatLng,
  stash: LatLng
): RouteBatch[] {
  const vehicles = allVehicles.map(towCardToBatchVehicle);
  const batches: RouteBatch[] = [];
  const batchSize = 4;
  
  let availableVehicles = [...vehicles];
  let currentOrigin = lot; // Start from lot
  let currentTime = options.startTime;
  
  while (availableVehicles.length > 0) {
    // Get next batch of 4 (or remaining vehicles)
    const batchVehicles = findNearestVehicles(
      availableVehicles,
      currentOrigin,
      Math.min(batchSize, availableVehicles.length),
      options.serviceTimes.cityMph
    );
    
    // Remove selected vehicles from available
    availableVehicles = availableVehicles.filter(
      v => !batchVehicles.some(bv => bv.id === v.id)
    );
    
    // Calculate times for both strategies
    const lotTime = calculateBatchTime(batchVehicles, currentOrigin, 'lot', options.serviceTimes, lot, stash);
    const stashTime = calculateBatchTime(batchVehicles, currentOrigin, 'stash', options.serviceTimes, lot, stash);
    
    const batch: RouteBatch = {
      id: `batch-${batches.length + 1}`,
      vehicles: batchVehicles,
      lotTime,
      stashTime,
      stashSavings: Math.max(0, lotTime - stashTime),
      estimatedStartTime: new Date(currentTime),
      estimatedEndTime: new Date(currentTime.getTime() + Math.min(lotTime, stashTime) * 60000)
    };
    
    batches.push(batch);
    
    // Update origin for next batch based on strategy
    if (options.strategy === 'lot') {
      currentOrigin = lot;
    } else if (options.strategy === 'stash') {
      currentOrigin = stash;
    } else {
      // Optimized: choose the faster destination
      currentOrigin = stashTime < lotTime ? stash : lot;
    }
    
    // Update time for next batch
    currentTime = new Date(currentTime.getTime() + Math.min(lotTime, stashTime) * 60000);
  }
  
  return batches;
}

// Get vehicles by status
export function getVehiclesByStatus(batches: RouteBatch[]): {
  now: RouteBatch[];
  next: RouteBatch[];
  later: RouteBatch[];
  completed: RouteBatch[];
} {
  return {
    now: batches.slice(0, 1),
    next: batches.slice(1, 2),
    later: batches.slice(2),
    completed: [] // Will be populated when batches are marked as done
  };
}

// Calculate capacity metrics
export function calculateCapacityMetrics(
  batches: RouteBatch[],
  shiftLengthHours: number,
  strategy: 'lot' | 'stash' | 'optimized'
): {
  towed: number;
  onTrack: number;
  atRisk: number;
  behind: number;
  shiftProgress: number;
} {
  const shiftLengthMinutes = shiftLengthHours * 60;
  let cumulativeTime = 0;
  let onTrack = 0;
  let atRisk = 0;
  let behind = 0;
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchTime = strategy === 'optimized' 
      ? Math.min(batch.lotTime, batch.stashTime)
      : strategy === 'lot' ? batch.lotTime : batch.stashTime;
    
    cumulativeTime += batchTime;
    
    if (cumulativeTime <= shiftLengthMinutes) {
      onTrack++;
    } else if (cumulativeTime <= shiftLengthMinutes + 60) {
      atRisk++;
    } else {
      behind++;
    }
  }
  
  const shiftProgress = Math.min(100, (cumulativeTime / shiftLengthMinutes) * 100);
  
  return {
    towed: 0, // Will be updated when batches are marked complete
    onTrack,
    atRisk,
    behind,
    shiftProgress
  };
}
