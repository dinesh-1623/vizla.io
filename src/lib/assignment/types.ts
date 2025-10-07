export interface Driver {
  id: string;
  name: string;
  zone: string;
  shiftStart: string; // "08:00"
  shiftEnd: string;   // "16:00"
  capacity: number;   // max vehicles
  currentLoad: number; // currently assigned vehicles
  location?: {
    lat: number;
    lng: number;
  };
  status: 'active' | 'inactive' | 'on_break';
}

export interface Vehicle {
  id: string;
  client: string;
  zone: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  priority: 'high' | 'medium' | 'low';
  estimatedPickupTime: number; // minutes
  specialRequirements?: string[];
}

export interface Assignment {
  vehicleId: string;
  driverId: string;
  assignmentReason: string;
  estimatedTime: number; // minutes to reach vehicle
  zoneMatch: boolean;
  capacityUtilization: number; // 0-1
  distanceKm: number;
  assignedAt: string; // ISO timestamp
}

export interface AssignmentResult {
  assignments: Assignment[];
  unassignedVehicles: Vehicle[];
  assignmentSummary: {
    totalVehicles: number;
    assignedCount: number;
    unassignedCount: number;
    zoneMatches: number;
    crossZoneAssignments: number;
    averageDistanceKm: number;
    processingTimeMs: number;
  };
  driverUtilization: Array<{
    driverId: string;
    driverName: string;
    assignedCount: number;
    capacityUtilization: number;
    zones: string[];
  }>;
}

export interface AssignmentCriteria {
  maxDistanceKm: number; // 50
  maxCrossZoneAssignments: number; // 10% of total
  priorityWeights: {
    zoneMatch: number; // 100
    capacity: number;  // 50
    distance: number;  // 25
    priority: number;  // 75
  };
}
