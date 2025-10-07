import { Driver, Vehicle, Assignment, AssignmentResult, AssignmentCriteria } from './types';
import { calculateDistance, estimateTravelTime } from './distance';

/**
 * Automated Driver Assignment Engine
 * 
 * Assignment Priority Logic:
 * 1. Zone Match (same zone as vehicle)
 * 2. Capacity Availability (least utilized drivers first)
 * 3. Distance Proximity (closest available driver)
 * 4. Vehicle Priority (high priority vehicles get preference)
 */
export class AssignmentEngine {
  private criteria: AssignmentCriteria;
  private startTime: number = 0;

  constructor(criteria?: Partial<AssignmentCriteria>) {
    this.criteria = {
      maxDistanceKm: 50,
      maxCrossZoneAssignments: 10,
      priorityWeights: {
        zoneMatch: 100,
        capacity: 50,
        distance: 25,
        priority: 75
      },
      ...criteria
    };
  }

  /**
   * Main assignment function - assigns vehicles to drivers
   */
  assignVehiclesToDrivers(vehicles: Vehicle[], drivers: Driver[]): AssignmentResult {
    this.startTime = performance.now();
    
    // Filter active drivers with capacity
    const availableDrivers = drivers.filter(driver => 
      driver.status === 'active' && driver.currentLoad < driver.capacity
    );

    if (availableDrivers.length === 0) {
      return this.createEmptyResult(vehicles, 0);
    }

    // Sort vehicles by priority (high -> medium -> low)
    const sortedVehicles = this.sortVehiclesByPriority(vehicles);
    
    const assignments: Assignment[] = [];
    const unassignedVehicles: Vehicle[] = [];
    const driverLoads = new Map(drivers.map(d => [d.id, d.currentLoad]));

    console.log(`🚀 Starting assignment: ${vehicles.length} vehicles, ${availableDrivers.length} drivers`);

    for (const vehicle of sortedVehicles) {
      const assignment = this.findBestDriver(vehicle, availableDrivers, driverLoads);
      
      if (assignment) {
        assignments.push(assignment);
        const currentLoad = driverLoads.get(assignment.driverId) || 0;
        driverLoads.set(assignment.driverId, currentLoad + 1);
        
        console.log(`✅ Assigned ${vehicle.id} to ${assignment.driverId} (${assignment.assignmentReason})`);
      } else {
        unassignedVehicles.push(vehicle);
        console.log(`❌ No driver found for vehicle ${vehicle.id}`);
      }
    }

    const processingTime = performance.now() - this.startTime;
    
    return this.buildResult(assignments, unassignedVehicles, drivers, processingTime);
  }

  /**
   * Find the best driver for a specific vehicle using scoring algorithm
   */
  private findBestDriver(
    vehicle: Vehicle, 
    drivers: Driver[], 
    driverLoads: Map<string, number>
  ): Assignment | null {
    const candidates: Array<{ driver: Driver; score: number; distance: number }> = [];

    for (const driver of drivers) {
      const currentLoad = driverLoads.get(driver.id) || 0;
      
      // Skip if driver is at capacity
      if (currentLoad >= driver.capacity) continue;

      // Calculate distance
      const distance = driver.location ? 
        calculateDistance(
          vehicle.location.lat, 
          vehicle.location.lng,
          driver.location.lat,
          driver.location.lng
        ) : 0;

      // Skip if too far
      if (distance > this.criteria.maxDistanceKm) continue;

      // Calculate assignment score
      const score = this.calculateAssignmentScore(vehicle, driver, distance, currentLoad);
      
      candidates.push({ driver, score, distance });
    }

    if (candidates.length === 0) return null;

    // Sort by score (highest first)
    candidates.sort((a, b) => b.score - a.score);
    
    const best = candidates[0];
    const zoneMatch = best.driver.zone === vehicle.zone;
    const capacityUtilization = (driverLoads.get(best.driver.id) || 0) / best.driver.capacity;

    return {
      vehicleId: vehicle.id,
      driverId: best.driver.id,
      assignmentReason: this.getAssignmentReason(best.driver, vehicle, zoneMatch, best.distance),
      estimatedTime: estimateTravelTime(best.distance),
      zoneMatch,
      capacityUtilization,
      distanceKm: best.distance,
      assignedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate assignment score based on multiple criteria
   */
  private calculateAssignmentScore(
    vehicle: Vehicle,
    driver: Driver,
    distance: number,
    currentLoad: number
  ): number {
    let score = 0;

    // Zone match bonus
    if (driver.zone === vehicle.zone) {
      score += this.criteria.priorityWeights.zoneMatch;
    }

    // Capacity utilization (prefer less loaded drivers)
    const utilization = currentLoad / driver.capacity;
    score += this.criteria.priorityWeights.capacity * (1 - utilization);

    // Distance penalty (closer is better)
    const distanceScore = Math.max(0, (this.criteria.maxDistanceKm - distance) / this.criteria.maxDistanceKm);
    score += this.criteria.priorityWeights.distance * distanceScore;

    // Vehicle priority bonus
    const priorityMultiplier = vehicle.priority === 'high' ? 1.0 : vehicle.priority === 'medium' ? 0.7 : 0.4;
    score += this.criteria.priorityWeights.priority * priorityMultiplier;

    return score;
  }

  /**
   * Sort vehicles by priority for assignment order
   */
  private sortVehiclesByPriority(vehicles: Vehicle[]): Vehicle[] {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    return [...vehicles].sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Secondary sort by estimated pickup time
      return a.estimatedPickupTime - b.estimatedPickupTime;
    });
  }

  /**
   * Generate human-readable assignment reason
   */
  private getAssignmentReason(
    driver: Driver,
    vehicle: Vehicle,
    zoneMatch: boolean,
    distance: number
  ): string {
    const reasons: string[] = [];
    
    if (zoneMatch) {
      reasons.push('Zone Match');
    }
    
    if (driver.currentLoad === 0) {
      reasons.push('Available Driver');
    } else {
      reasons.push(`Light Load (${driver.currentLoad}/${driver.capacity})`);
    }
    
    if (distance < 5) {
      reasons.push('Very Close');
    } else if (distance < 15) {
      reasons.push('Close');
    }
    
    return reasons.join(', ');
  }

  /**
   * Build final assignment result with statistics
   */
  private buildResult(
    assignments: Assignment[],
    unassignedVehicles: Vehicle[],
    drivers: Driver[],
    processingTime: number
  ): AssignmentResult {
    const zoneMatches = assignments.filter(a => a.zoneMatch).length;
    const totalDistance = assignments.reduce((sum, a) => sum + a.distanceKm, 0);
    
    const driverUtilization = drivers.map(driver => {
      const assignedCount = assignments.filter(a => a.driverId === driver.id).length;
      return {
        driverId: driver.id,
        driverName: driver.name,
        assignedCount,
        capacityUtilization: (driver.currentLoad + assignedCount) / driver.capacity,
        zones: [driver.zone]
      };
    });

    const summary = {
      totalVehicles: assignments.length + unassignedVehicles.length,
      assignedCount: assignments.length,
      unassignedCount: unassignedVehicles.length,
      zoneMatches,
      crossZoneAssignments: assignments.length - zoneMatches,
      averageDistanceKm: assignments.length > 0 ? totalDistance / assignments.length : 0,
      processingTimeMs: Math.round(processingTime)
    };

    console.log(`📊 Assignment Summary:`, summary);
    console.log(`⏱️ Processing time: ${summary.processingTimeMs}ms`);

    return {
      assignments,
      unassignedVehicles,
      assignmentSummary: summary,
      driverUtilization
    };
  }

  /**
   * Create empty result when no drivers available
   */
  private createEmptyResult(vehicles: Vehicle[], processingTime: number): AssignmentResult {
    return {
      assignments: [],
      unassignedVehicles: vehicles,
      assignmentSummary: {
        totalVehicles: vehicles.length,
        assignedCount: 0,
        unassignedCount: vehicles.length,
        zoneMatches: 0,
        crossZoneAssignments: 0,
        averageDistanceKm: 0,
        processingTimeMs: processingTime
      },
      driverUtilization: []
    };
  }
}

/**
 * Convenience function for direct assignment
 */
export function assignVehiclesToDrivers(
  vehicles: Vehicle[], 
  drivers: Driver[],
  criteria?: Partial<AssignmentCriteria>
): AssignmentResult {
  const engine = new AssignmentEngine(criteria);
  return engine.assignVehiclesToDrivers(vehicles, drivers);
}
