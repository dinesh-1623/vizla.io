// Multi-shift coordination and predictive analytics types
export type ShiftType = 'day' | 'night' | 'weekend';
export type ShiftStatus = 'active' | 'upcoming' | 'completed';

export type ShiftData = {
  shiftId: string;
  shiftType: ShiftType;
  status: ShiftStatus;
  startTime: string;
  endTime: string;
  driverCount: number;
  capacityUtilization: number;
  vehiclesLocated: number;
  vehiclesPickedUp: number;
  pendingVehicles: number;
  avgResponseTime: number;
  efficiency: number;
  drivers: {
    driverId: string;
    name: string;
    capacity: number;
    currentLoad: number;
    status: 'on-track' | 'at-risk' | 'behind';
  }[];
};

export type VehicleAging = {
  vehicleId: string;
  location: string;
  locatedDate: string;
  daysAging: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed' | 'abandoned';
  clientId: string;
  estimatedValue: number;
  lastAttempt: string;
  attempts: number;
  reasonForDelay?: string;
};

export type PredictiveAnalytics = {
  capacityForecast: {
    today: number;
    tomorrow: number;
    thisWeek: number;
    nextWeek: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    confidence: number; // 0-100
  };
  demandPrediction: {
    peakHours: string[];
    seasonalTrends: number[];
    weatherImpact: number;
    eventImpact: number;
  };
  optimizationRecommendations: {
    action: string;
    impact: 'high' | 'medium' | 'low';
    cost: number;
    roi: number;
    timeline: string;
  }[];
  mlInsights: {
    patternRecognition: string[];
    anomalyDetection: string[];
    predictiveMaintenance: string[];
    riskAssessment: number;
  };
};

export type ZoneStat = {
  zoneId: string;
  zoneLabel: string;
  zoneBadge: number;
  totals: {
    totalAddresses: number;
    newAddresses: number;
    singleCheckins: number;
    notChecked5d: number;
  };
  legend: {
    alerts: number;
    courts: number;
    verifiedPins: number;
    views: number;
    awards: number;
    payments: number;
    photos: number;
  };
  dailyBreakdown: {
    [key: string]: number; // date: count
  };
  clients: {
    clientId: string;
    clientName: string;
    vehicleCount: number;
    revenue: number;
    priority: 'high' | 'medium' | 'low';
    contractType: 'premium' | 'standard' | 'volume';
  }[];
  drivers: {
    driverId: string;
    driverName: string;
    capacity: number;
    status: 'at-risk' | 'on-track' | 'behind';
    currentLoad: number;
    experience: number; // years
    efficiency: number; // percentage
    certification: string[];
    hourlyRate: number;
  }[];
  forecasting: {
    capacityGap: number;
    trucksNeeded: number;
    stashingEfficiency: number;
    trucksEfficiency: number;
    recommendation: 'stashing' | 'trucks' | 'both';
  };
  capacity: {
    goalCapacity: {
      totalVehicles: number;
      driversAssigned: number;
      completed: number;
      percentageOfGoal: number;
      hoursUsed: number; // in minutes for easier calculation
      hoursAvailable: number; // in minutes
      hoursAvailableDisplay: string; // formatted like "43h 20m"
      recommendedAction: {
        status: 'on-track' | 'at-risk' | 'behind';
        message: string;
      };
    };
    fullCapacity: {
      totalVehicles: number;
      remaining: number;
      completed: number;
      percentageComplete: number;
      hoursUsed: number; // in minutes
      hoursAvailable: number; // in minutes
      hoursAvailableDisplay: string; // formatted like "43h 20m"
      recommendedAction: {
        status: 'on-track' | 'at-risk' | 'behind';
        message: string;
      };
    };
  };
  zoneStatus: 'at-risk' | 'on-track' | 'behind';
  // Veteran-level analytics
  businessIntelligence: {
    marketShare: number; // percentage of total market
    growthRate: number; // month-over-month growth
    profitability: number; // profit margin percentage
    customerSatisfaction: number; // score out of 100
    operationalEfficiency: number; // score out of 100
    riskScore: number; // 0-100 risk assessment
    competitivePosition: 'leading' | 'strong' | 'moderate' | 'weak';
    strategicValue: 'critical' | 'high' | 'medium' | 'low';
  };
  performanceMetrics: {
    avgResponseTime: number; // minutes
    completionRate: number; // percentage
    costPerVehicle: number; // dollars
    revenuePerVehicle: number; // dollars
    utilizationRate: number; // percentage
    customerRetention: number; // percentage
    seasonalVariation: number; // percentage
    peakHours: string[];
  };
  strategicInsights: {
    marketOpportunities: string[];
    operationalChallenges: string[];
    recommendedActions: string[];
    longTermTrends: string[];
    competitiveThreats: string[];
    growthPotential: number; // percentage
  };
  // Naz Akel's Requirements - Multi-shift & Predictive Analytics
  shiftManagement: {
    currentShift: ShiftData;
    upcomingShifts: ShiftData[];
    historicalShifts: ShiftData[];
    crossShiftCoordination: {
      dayToNightHandoff: number;
      nightToDayHandoff: number;
      weekendContinuity: number;
      pendingVehicles: VehicleAging[];
    };
  };
  predictiveAnalytics: PredictiveAnalytics;
  vehicleAging: VehicleAging[];
  realTimeAlerts: {
    capacityExceeded: boolean;
    agingVehicles: number;
    driverShortage: boolean;
    equipmentIssues: string[];
    weatherWarnings: string[];
  };
};

export const ZONES: ZoneStat[] = [
  {
    zoneId: 'aa',
    zoneLabel: 'Baltimore Downtown',
    zoneBadge: 497,
    totals: {
      totalAddresses: 767,
      newAddresses: 613,
      singleCheckins: 471,
      notChecked5d: 466
    },
    legend: {
      alerts: 477,
      courts: 11,
      verifiedPins: 0,
      views: 5,
      awards: 79,
      payments: 32,
      photos: 93
    },
    dailyBreakdown: {
      '2025-01-06': 45,
      '2025-01-07': 52,
      '2025-01-08': 38,
      '2025-01-09': 61,
      '2025-01-10': 48,
      '2025-01-11': 55,
      '2025-01-12': 42
    },
    clients: [
      { clientId: 'client1', clientName: 'Metro Insurance', vehicleCount: 234, revenue: 125000, priority: 'high', contractType: 'premium' },
      { clientId: 'client2', clientName: 'City Bank', vehicleCount: 189, revenue: 98000, priority: 'high', contractType: 'standard' },
      { clientId: 'client3', clientName: 'Premier Auto', vehicleCount: 156, revenue: 67000, priority: 'medium', contractType: 'volume' },
      { clientId: 'client4', clientName: 'Elite Recovery', vehicleCount: 188, revenue: 89000, priority: 'medium', contractType: 'standard' }
    ],
    drivers: [
      { driverId: 'driver1', driverName: 'Mike Johnson', capacity: 8, status: 'on-track', currentLoad: 6, experience: 12, efficiency: 94, certification: ['CDL-A', 'Heavy Tow'], hourlyRate: 28 },
      { driverId: 'driver2', driverName: 'Sarah Davis', capacity: 10, status: 'at-risk', currentLoad: 9, experience: 8, efficiency: 87, certification: ['CDL-B', 'Light Tow'], hourlyRate: 26 },
      { driverId: 'driver3', driverName: 'Tom Wilson', capacity: 7, status: 'behind', currentLoad: 8, experience: 15, efficiency: 76, certification: ['CDL-A', 'Heavy Tow', 'Specialized'], hourlyRate: 32 }
    ],
    forecasting: {
      capacityGap: 15,
      trucksNeeded: 2,
      stashingEfficiency: 12,
      trucksEfficiency: 8,
      recommendation: 'stashing'
    },
    capacity: {
      goalCapacity: {
        totalVehicles: 105,
        driversAssigned: 10,
        completed: 58,
        percentageOfGoal: 55,
        hoursUsed: 1410, // 23h 30m in minutes
        hoursAvailable: 2600, // 43h 20m in minutes
        hoursAvailableDisplay: '43h 20m',
        recommendedAction: {
          status: 'on-track',
          message: 'On track - 19h 50m ahead of schedule'
        }
      },
      fullCapacity: {
        totalVehicles: 146,
        remaining: 88,
        completed: 58,
        percentageComplete: 40,
        hoursUsed: 2640, // 44h in minutes
        hoursAvailable: 2600, // 43h 20m in minutes
        hoursAvailableDisplay: '43h 20m',
        recommendedAction: {
          status: 'at-risk',
          message: 'Need 0h 40m more - Add 1 driver or overtime to complete all'
        }
      }
    },
    zoneStatus: 'at-risk',
    businessIntelligence: {
      marketShare: 23.4,
      growthRate: 8.2,
      profitability: 18.7,
      customerSatisfaction: 87,
      operationalEfficiency: 82,
      riskScore: 65,
      competitivePosition: 'strong',
      strategicValue: 'high'
    },
    performanceMetrics: {
      avgResponseTime: 24,
      completionRate: 94,
      costPerVehicle: 45,
      revenuePerVehicle: 78,
      utilizationRate: 88,
      customerRetention: 91,
      seasonalVariation: 15,
      peakHours: ['08:00-10:00', '16:00-18:00', '20:00-22:00']
    },
    strategicInsights: {
      marketOpportunities: ['Expand into premium residential areas', 'Partner with luxury dealerships', 'Develop fleet management contracts'],
      operationalChallenges: ['Driver shortage in peak hours', 'Equipment maintenance costs rising', 'Fuel price volatility impact'],
      recommendedActions: ['Invest in driver retention programs', 'Optimize route algorithms', 'Implement predictive maintenance'],
      longTermTrends: ['Increasing demand for eco-friendly services', 'Technology integration requirements', 'Regulatory compliance changes'],
      competitiveThreats: ['New entrants with lower pricing', 'Uber-style on-demand services', 'Insurance company direct operations'],
      growthPotential: 25
    },
    // Naz Akel's Multi-Shift & Predictive Analytics
    shiftManagement: {
      currentShift: {
        shiftId: 'aa-day-2025-01-13',
        shiftType: 'day',
        status: 'active',
        startTime: '08:00',
        endTime: '20:00',
        driverCount: 3,
        capacityUtilization: 89,
        vehiclesLocated: 45,
        vehiclesPickedUp: 32,
        pendingVehicles: 13,
        avgResponseTime: 28,
        efficiency: 87,
        drivers: [
          { driverId: 'driver1', name: 'Mike Johnson', capacity: 8, currentLoad: 6, status: 'on-track' },
          { driverId: 'driver2', name: 'Sarah Davis', capacity: 10, currentLoad: 9, status: 'at-risk' },
          { driverId: 'driver3', name: 'Tom Wilson', capacity: 7, currentLoad: 8, status: 'behind' }
        ]
      },
      upcomingShifts: [
        {
          shiftId: 'aa-night-2025-01-13',
          shiftType: 'night',
          status: 'upcoming',
          startTime: '20:00',
          endTime: '08:00',
          driverCount: 2,
          capacityUtilization: 0,
          vehiclesLocated: 0,
          vehiclesPickedUp: 0,
          pendingVehicles: 13,
          avgResponseTime: 0,
          efficiency: 0,
          drivers: [
            { driverId: 'driver4', name: 'Night Driver 1', capacity: 6, currentLoad: 0, status: 'on-track' },
            { driverId: 'driver5', name: 'Night Driver 2', capacity: 8, currentLoad: 0, status: 'on-track' }
          ]
        }
      ],
      historicalShifts: [
        {
          shiftId: 'aa-day-2025-01-12',
          shiftType: 'day',
          status: 'completed',
          startTime: '08:00',
          endTime: '20:00',
          driverCount: 3,
          capacityUtilization: 85,
          vehiclesLocated: 42,
          vehiclesPickedUp: 38,
          pendingVehicles: 4,
          avgResponseTime: 24,
          efficiency: 91,
          drivers: []
        }
      ],
      crossShiftCoordination: {
        dayToNightHandoff: 13,
        nightToDayHandoff: 8,
        weekendContinuity: 92,
        pendingVehicles: [
          {
            vehicleId: 'veh-001',
            location: '123 Main St',
            locatedDate: '2025-01-10',
            daysAging: 3,
            priority: 'high',
            status: 'pending',
            clientId: 'client1',
            estimatedValue: 25000,
            lastAttempt: '2025-01-12',
            attempts: 2,
            reasonForDelay: 'Vehicle blocked by construction'
          },
          {
            vehicleId: 'veh-002',
            location: '456 Oak Ave',
            locatedDate: '2025-01-09',
            daysAging: 4,
            priority: 'critical',
            status: 'pending',
            clientId: 'client2',
            estimatedValue: 45000,
            lastAttempt: '2025-01-11',
            attempts: 3,
            reasonForDelay: 'Owner interference'
          }
        ]
      }
    },
    predictiveAnalytics: {
      capacityForecast: {
        today: 45,
        tomorrow: 52,
        thisWeek: 285,
        nextWeek: 312,
        trend: 'increasing',
        confidence: 87
      },
      demandPrediction: {
        peakHours: ['08:00-10:00', '16:00-18:00', '20:00-22:00'],
        seasonalTrends: [85, 92, 78, 88, 95, 91, 87],
        weatherImpact: 15,
        eventImpact: 25
      },
      optimizationRecommendations: [
        {
          action: 'Add 1 night shift driver for Tuesday handoff',
          impact: 'high',
          cost: 240,
          roi: 340,
          timeline: 'immediate'
        },
        {
          action: 'Optimize stashing routes for 12% efficiency gain',
          impact: 'medium',
          cost: 0,
          roi: 1800,
          timeline: '1 week'
        }
      ],
      mlInsights: {
        patternRecognition: [
          'Tuesday shows 23% higher demand pattern',
          'Construction zones cause 15% delay increase',
          'Premium clients prefer morning pickups'
        ],
        anomalyDetection: [
          'Unusual spike in Main St area - investigate',
          'Driver efficiency dropped 8% this week'
        ],
        predictiveMaintenance: [
          'Truck #3 needs brake inspection by Friday',
          'Hydraulic system showing wear patterns'
        ],
        riskAssessment: 65
      }
    },
    vehicleAging: [
      {
        vehicleId: 'veh-001',
        location: '123 Main St',
        locatedDate: '2025-01-10',
        daysAging: 3,
        priority: 'high',
        status: 'pending',
        clientId: 'client1',
        estimatedValue: 25000,
        lastAttempt: '2025-01-12',
        attempts: 2,
        reasonForDelay: 'Vehicle blocked by construction'
      },
      {
        vehicleId: 'veh-002',
        location: '456 Oak Ave',
        locatedDate: '2025-01-09',
        daysAging: 4,
        priority: 'critical',
        status: 'pending',
        clientId: 'client2',
        estimatedValue: 45000,
        lastAttempt: '2025-01-11',
        attempts: 3,
        reasonForDelay: 'Owner interference'
      }
    ],
    realTimeAlerts: {
      capacityExceeded: true,
      agingVehicles: 2,
      driverShortage: false,
      equipmentIssues: ['Truck #2 hydraulic leak'],
      weatherWarnings: ['Heavy rain expected 18:00-22:00']
    }
  },
  {
    zoneId: 'balt-co',
    zoneLabel: 'BALT CO',
    zoneBadge: 347,
    totals: {
      totalAddresses: 514,
      newAddresses: 350,
      singleCheckins: 295,
      notChecked5d: 302
    },
    legend: {
      alerts: 265,
      courts: 20,
      verifiedPins: 1,
      views: 7,
      awards: 81,
      payments: 21,
      photos: 49
    },
    dailyBreakdown: {
      '2025-01-06': 32,
      '2025-01-07': 28,
      '2025-01-08': 41,
      '2025-01-09': 35,
      '2025-01-10': 38,
      '2025-01-11': 33,
      '2025-01-12': 29
    },
    clients: [
      { clientId: 'client5', clientName: 'Baltimore City', vehicleCount: 145, revenue: 78000, priority: 'high', contractType: 'premium' },
      { clientId: 'client6', clientName: 'State Insurance', vehicleCount: 112, revenue: 56000, priority: 'medium', contractType: 'standard' },
      { clientId: 'client7', clientName: 'Harbor Motors', vehicleCount: 98, revenue: 42000, priority: 'medium', contractType: 'volume' },
      { clientId: 'client8', clientName: 'Coastal Recovery', vehicleCount: 159, revenue: 68000, priority: 'high', contractType: 'standard' }
    ],
    drivers: [
      { driverId: 'driver4', driverName: 'Lisa Chen', capacity: 9, status: 'on-track', currentLoad: 7, experience: 10, efficiency: 92, certification: ['CDL-A', 'Light Tow'], hourlyRate: 27 },
      { driverId: 'driver5', driverName: 'James Rodriguez', capacity: 8, status: 'at-risk', currentLoad: 8, experience: 6, efficiency: 85, certification: ['CDL-B'], hourlyRate: 24 },
      { driverId: 'driver6', driverName: 'Emma Thompson', capacity: 6, status: 'behind', currentLoad: 7, experience: 9, efficiency: 78, certification: ['CDL-A', 'Heavy Tow'], hourlyRate: 29 }
    ],
    forecasting: {
      capacityGap: 8,
      trucksNeeded: 1,
      stashingEfficiency: 6,
      trucksEfficiency: 10,
      recommendation: 'trucks'
    },
    capacity: {
      goalCapacity: {
        totalVehicles: 92,
        driversAssigned: 8,
        completed: 68,
        percentageOfGoal: 74,
        hoursUsed: 1320, // 22h in minutes
        hoursAvailable: 2880, // 48h in minutes
        hoursAvailableDisplay: '48h',
        recommendedAction: {
          status: 'on-track',
          message: 'On track - 26h ahead of schedule'
        }
      },
      fullCapacity: {
        totalVehicles: 128,
        remaining: 60,
        completed: 68,
        percentageComplete: 53,
        hoursUsed: 2160, // 36h in minutes
        hoursAvailable: 2880, // 48h in minutes
        hoursAvailableDisplay: '48h',
        recommendedAction: {
          status: 'on-track',
          message: 'On track - 12h buffer available'
        }
      }
    },
    zoneStatus: 'on-track',
    businessIntelligence: {
      marketShare: 18.7,
      growthRate: 5.4,
      profitability: 22.1,
      customerSatisfaction: 91,
      operationalEfficiency: 88,
      riskScore: 35,
      competitivePosition: 'strong',
      strategicValue: 'high'
    },
    performanceMetrics: {
      avgResponseTime: 18,
      completionRate: 96,
      costPerVehicle: 38,
      revenuePerVehicle: 85,
      utilizationRate: 92,
      customerRetention: 94,
      seasonalVariation: 12,
      peakHours: ['07:00-09:00', '17:00-19:00', '21:00-23:00']
    },
    strategicInsights: {
      marketOpportunities: ['Expand commercial contracts', 'Develop residential services', 'Partner with local dealerships'],
      operationalChallenges: ['Peak hour capacity constraints', 'Equipment maintenance scheduling', 'Driver scheduling optimization'],
      recommendedActions: ['Increase peak hour staffing', 'Implement predictive maintenance', 'Optimize route planning'],
      longTermTrends: ['Digital transformation requirements', 'Sustainability initiatives', 'Customer experience focus'],
      competitiveThreats: ['Regional competitors expanding', 'Technology disruption', 'Price pressure from new entrants'],
      growthPotential: 18
    },
    // Naz Akel's Multi-Shift & Predictive Analytics
    shiftManagement: {
      currentShift: {
        shiftId: 'balt-day-2025-01-13',
        shiftType: 'day',
        status: 'active',
        startTime: '08:00',
        endTime: '20:00',
        driverCount: 3,
        capacityUtilization: 92,
        vehiclesLocated: 35,
        vehiclesPickedUp: 28,
        pendingVehicles: 7,
        avgResponseTime: 18,
        efficiency: 94,
        drivers: [
          { driverId: 'driver4', name: 'Lisa Chen', capacity: 9, currentLoad: 7, status: 'on-track' },
          { driverId: 'driver5', name: 'James Rodriguez', capacity: 8, currentLoad: 8, status: 'at-risk' },
          { driverId: 'driver6', name: 'Emma Thompson', capacity: 6, currentLoad: 7, status: 'behind' }
        ]
      },
      upcomingShifts: [
        {
          shiftId: 'balt-night-2025-01-13',
          shiftType: 'night',
          status: 'upcoming',
          startTime: '20:00',
          endTime: '08:00',
          driverCount: 2,
          capacityUtilization: 0,
          vehiclesLocated: 0,
          vehiclesPickedUp: 0,
          pendingVehicles: 7,
          avgResponseTime: 0,
          efficiency: 0,
          drivers: [
            { driverId: 'driver7', name: 'Night Driver 1', capacity: 7, currentLoad: 0, status: 'on-track' },
            { driverId: 'driver8', name: 'Night Driver 2', capacity: 8, currentLoad: 0, status: 'on-track' }
          ]
        }
      ],
      historicalShifts: [
        {
          shiftId: 'balt-day-2025-01-12',
          shiftType: 'day',
          status: 'completed',
          startTime: '08:00',
          endTime: '20:00',
          driverCount: 3,
          capacityUtilization: 88,
          vehiclesLocated: 33,
          vehiclesPickedUp: 31,
          pendingVehicles: 2,
          avgResponseTime: 16,
          efficiency: 96,
          drivers: []
        }
      ],
      crossShiftCoordination: {
        dayToNightHandoff: 7,
        nightToDayHandoff: 3,
        weekendContinuity: 95,
        pendingVehicles: [
          {
            vehicleId: 'veh-003',
            location: '789 Harbor St',
            locatedDate: '2025-01-11',
            daysAging: 2,
            priority: 'medium',
            status: 'pending',
            clientId: 'client5',
            estimatedValue: 18000,
            lastAttempt: '2025-01-12',
            attempts: 1,
            reasonForDelay: 'Access restricted'
          }
        ]
      }
    },
    predictiveAnalytics: {
      capacityForecast: {
        today: 35,
        tomorrow: 38,
        thisWeek: 245,
        nextWeek: 268,
        trend: 'increasing',
        confidence: 92
      },
      demandPrediction: {
        peakHours: ['07:00-09:00', '17:00-19:00', '21:00-23:00'],
        seasonalTrends: [88, 94, 82, 90, 96, 93, 89],
        weatherImpact: 12,
        eventImpact: 18
      },
      optimizationRecommendations: [
        {
          action: 'Add weekend coverage for 8% efficiency gain',
          impact: 'medium',
          cost: 180,
          roi: 420,
          timeline: '2 weeks'
        }
      ],
      mlInsights: {
        patternRecognition: [
          'Harbor area shows 18% higher weekend demand',
          'Commercial zones prefer afternoon pickups',
          'Weather delays increase 12% in winter months'
        ],
        anomalyDetection: [
          'Unusual spike in Harbor St area',
          'Driver efficiency consistent across shifts'
        ],
        predictiveMaintenance: [
          'Truck #4 needs tire rotation by Monday',
          'Hydraulic system performing optimally'
        ],
        riskAssessment: 35
      }
    },
    vehicleAging: [
      {
        vehicleId: 'veh-003',
        location: '789 Harbor St',
        locatedDate: '2025-01-11',
        daysAging: 2,
        priority: 'medium',
        status: 'pending',
        clientId: 'client5',
        estimatedValue: 18000,
        lastAttempt: '2025-01-12',
        attempts: 1,
        reasonForDelay: 'Access restricted'
      }
    ],
    realTimeAlerts: {
      capacityExceeded: false,
      agingVehicles: 1,
      driverShortage: false,
      equipmentIssues: [],
      weatherWarnings: ['Light rain expected 20:00-22:00']
    }
  },
  {
    zoneId: 'cc',
    zoneLabel: 'Chicago Loop',
    zoneBadge: 623,
    totals: {
      totalAddresses: 892,
      newAddresses: 734,
      singleCheckins: 589,
      notChecked5d: 234
    },
    legend: {
      alerts: 189,
      courts: 15,
      verifiedPins: 3,
      views: 12,
      awards: 95,
      payments: 45,
      photos: 67
    },
    dailyBreakdown: {
      '2025-01-06': 67,
      '2025-01-07': 71,
      '2025-01-08': 58,
      '2025-01-09': 82,
      '2025-01-10': 69,
      '2025-01-11': 75,
      '2025-01-12': 61
    },
    clients: [
      { clientId: 'client9', clientName: 'Central Motors', vehicleCount: 278, revenue: 145000, priority: 'high', contractType: 'premium' },
      { clientId: 'client10', clientName: 'Urban Insurance', vehicleCount: 201, revenue: 98000, priority: 'high', contractType: 'standard' },
      { clientId: 'client11', clientName: 'City Recovery', vehicleCount: 165, revenue: 72000, priority: 'medium', contractType: 'volume' },
      { clientId: 'client12', clientName: 'Metro Auto', vehicleCount: 248, revenue: 112000, priority: 'high', contractType: 'premium' }
    ],
    drivers: [
      { driverId: 'driver7', driverName: 'Alex Martinez', capacity: 12, status: 'on-track', currentLoad: 10, experience: 14, efficiency: 95, certification: ['CDL-A', 'Heavy Tow', 'Specialized'], hourlyRate: 31 },
      { driverId: 'driver8', driverName: 'Rachel Green', capacity: 11, status: 'on-track', currentLoad: 9, experience: 11, efficiency: 89, certification: ['CDL-A', 'Light Tow'], hourlyRate: 28 },
      { driverId: 'driver9', driverName: 'David Lee', capacity: 9, status: 'at-risk', currentLoad: 9, experience: 7, efficiency: 82, certification: ['CDL-B'], hourlyRate: 25 }
    ],
    forecasting: {
      capacityGap: 25,
      trucksNeeded: 3,
      stashingEfficiency: 18,
      trucksEfficiency: 15,
      recommendation: 'both'
    },
    capacity: {
      goalCapacity: {
        totalVehicles: 158,
        driversAssigned: 12,
        completed: 89,
        percentageOfGoal: 56,
        hoursUsed: 1680, // 28h in minutes
        hoursAvailable: 2400, // 40h in minutes
        hoursAvailableDisplay: '40h',
        recommendedAction: {
          status: 'at-risk',
          message: 'At risk - 12h behind schedule, add 2 drivers'
        }
      },
      fullCapacity: {
        totalVehicles: 198,
        remaining: 109,
        completed: 89,
        percentageComplete: 45,
        hoursUsed: 2760, // 46h in minutes
        hoursAvailable: 2400, // 40h in minutes
        hoursAvailableDisplay: '40h',
        recommendedAction: {
          status: 'behind',
          message: 'Behind - Need 6h more or add 3 drivers to complete all'
        }
      }
    },
    zoneStatus: 'at-risk',
    businessIntelligence: {
      marketShare: 31.2,
      growthRate: 12.8,
      profitability: 16.3,
      customerSatisfaction: 84,
      operationalEfficiency: 79,
      riskScore: 72,
      competitivePosition: 'moderate',
      strategicValue: 'critical'
    },
    performanceMetrics: {
      avgResponseTime: 28,
      completionRate: 91,
      costPerVehicle: 52,
      revenuePerVehicle: 89,
      utilizationRate: 85,
      customerRetention: 88,
      seasonalVariation: 18,
      peakHours: ['08:00-10:00', '15:00-17:00', '19:00-21:00']
    },
    strategicInsights: {
      marketOpportunities: ['Urban expansion opportunities', 'Corporate fleet contracts', 'Technology integration partnerships'],
      operationalChallenges: ['High demand pressure', 'Traffic congestion impact', 'Equipment utilization optimization'],
      recommendedActions: ['Scale operations capacity', 'Implement dynamic pricing', 'Enhance customer communication'],
      longTermTrends: ['Smart city integration', 'Autonomous vehicle preparation', 'Sustainability requirements'],
      competitiveThreats: ['Major competitors entering market', 'Technology platform disruption', 'Regulatory changes'],
      growthPotential: 35
    },
    // Naz Akel's Multi-Shift & Predictive Analytics
    shiftManagement: {
      currentShift: {
        shiftId: 'cc-day-2025-01-13',
        shiftType: 'day',
        status: 'active',
        startTime: '08:00',
        endTime: '20:00',
        driverCount: 3,
        capacityUtilization: 95,
        vehiclesLocated: 67,
        vehiclesPickedUp: 45,
        pendingVehicles: 22,
        avgResponseTime: 28,
        efficiency: 89,
        drivers: [
          { driverId: 'driver7', name: 'Alex Martinez', capacity: 12, currentLoad: 10, status: 'on-track' },
          { driverId: 'driver8', name: 'Rachel Green', capacity: 11, currentLoad: 9, status: 'on-track' },
          { driverId: 'driver9', name: 'David Lee', capacity: 9, currentLoad: 9, status: 'at-risk' }
        ]
      },
      upcomingShifts: [
        {
          shiftId: 'cc-night-2025-01-13',
          shiftType: 'night',
          status: 'upcoming',
          startTime: '20:00',
          endTime: '08:00',
          driverCount: 2,
          capacityUtilization: 0,
          vehiclesLocated: 0,
          vehiclesPickedUp: 0,
          pendingVehicles: 22,
          avgResponseTime: 0,
          efficiency: 0,
          drivers: [
            { driverId: 'driver10', name: 'Night Driver 1', capacity: 10, currentLoad: 0, status: 'on-track' },
            { driverId: 'driver11', name: 'Night Driver 2', capacity: 12, currentLoad: 0, status: 'on-track' }
          ]
        }
      ],
      historicalShifts: [
        {
          shiftId: 'cc-day-2025-01-12',
          shiftType: 'day',
          status: 'completed',
          startTime: '08:00',
          endTime: '20:00',
          driverCount: 3,
          capacityUtilization: 89,
          vehiclesLocated: 61,
          vehiclesPickedUp: 52,
          pendingVehicles: 9,
          avgResponseTime: 25,
          efficiency: 91,
          drivers: []
        }
      ],
      crossShiftCoordination: {
        dayToNightHandoff: 22,
        nightToDayHandoff: 12,
        weekendContinuity: 87,
        pendingVehicles: [
          {
            vehicleId: 'veh-004',
            location: '123 Central Ave',
            locatedDate: '2025-01-09',
            daysAging: 4,
            priority: 'critical',
            status: 'pending',
            clientId: 'client9',
            estimatedValue: 55000,
            lastAttempt: '2025-01-11',
            attempts: 4,
            reasonForDelay: 'Traffic congestion'
          }
        ]
      }
    },
    predictiveAnalytics: {
      capacityForecast: {
        today: 67,
        tomorrow: 75,
        thisWeek: 485,
        nextWeek: 520,
        trend: 'increasing',
        confidence: 84
      },
      demandPrediction: {
        peakHours: ['08:00-10:00', '15:00-17:00', '19:00-21:00'],
        seasonalTrends: [82, 89, 76, 85, 92, 88, 84],
        weatherImpact: 22,
        eventImpact: 35
      },
      optimizationRecommendations: [
        {
          action: 'Add 2 additional night drivers for capacity',
          impact: 'high',
          cost: 480,
          roi: 1200,
          timeline: 'immediate'
        },
        {
          action: 'Implement traffic-aware routing',
          impact: 'medium',
          cost: 1200,
          roi: 2800,
          timeline: '3 weeks'
        }
      ],
      mlInsights: {
        patternRecognition: [
          'Central Ave shows 35% higher traffic delays',
          'Corporate clients prefer morning pickups',
          'Weekend demand drops 15% in urban areas'
        ],
        anomalyDetection: [
          'Unusual demand spike in Central Ave area',
          'Driver efficiency declining in peak hours'
        ],
        predictiveMaintenance: [
          'Truck #5 needs brake inspection by Thursday',
          'Hydraulic system showing stress patterns'
        ],
        riskAssessment: 72
      }
    },
    vehicleAging: [
      {
        vehicleId: 'veh-004',
        location: '123 Central Ave',
        locatedDate: '2025-01-09',
        daysAging: 4,
        priority: 'critical',
        status: 'pending',
        clientId: 'client9',
        estimatedValue: 55000,
        lastAttempt: '2025-01-11',
        attempts: 4,
        reasonForDelay: 'Traffic congestion'
      }
    ],
    realTimeAlerts: {
      capacityExceeded: true,
      agingVehicles: 1,
      driverShortage: true,
      equipmentIssues: ['Truck #5 brake warning'],
      weatherWarnings: ['Heavy traffic expected 17:00-19:00']
    }
  },
  {
    zoneId: 'dd',
    zoneLabel: 'Dallas Metro',
    zoneBadge: 289,
    totals: {
      totalAddresses: 445,
      newAddresses: 298,
      singleCheckins: 234,
      notChecked5d: 567
    },
    legend: {
      alerts: 445,
      courts: 8,
      verifiedPins: 0,
      views: 3,
      awards: 42,
      payments: 18,
      photos: 34
    },
    dailyBreakdown: {
      '2025-01-06': 28,
      '2025-01-07': 31,
      '2025-01-08': 25,
      '2025-01-09': 33,
      '2025-01-10': 29,
      '2025-01-11': 35,
      '2025-01-12': 27
    },
    clients: [
      { clientId: 'client13', clientName: 'District Auto', vehicleCount: 98, revenue: 42000, priority: 'medium', contractType: 'standard' },
      { clientId: 'client14', clientName: 'Local Insurance', vehicleCount: 76, revenue: 32000, priority: 'low', contractType: 'volume' },
      { clientId: 'client15', clientName: 'Neighborhood Motors', vehicleCount: 63, revenue: 28000, priority: 'low', contractType: 'volume' },
      { clientId: 'client16', clientName: 'Regional Recovery', vehicleCount: 108, revenue: 48000, priority: 'medium', contractType: 'standard' }
    ],
    drivers: [
      { driverId: 'driver10', driverName: 'Kevin Park', capacity: 6, status: 'behind', currentLoad: 7, experience: 4, efficiency: 68, certification: ['CDL-B'], hourlyRate: 22 },
      { driverId: 'driver11', driverName: 'Maria Santos', capacity: 5, status: 'behind', currentLoad: 6, experience: 3, efficiency: 72, certification: ['CDL-B'], hourlyRate: 21 }
    ],
    forecasting: {
      capacityGap: 12,
      trucksNeeded: 2,
      stashingEfficiency: 8,
      trucksEfficiency: 12,
      recommendation: 'trucks'
    },
    capacity: {
      goalCapacity: {
        totalVehicles: 78,
        driversAssigned: 6,
        completed: 42,
        percentageOfGoal: 54,
        hoursUsed: 1500, // 25h in minutes
        hoursAvailable: 2160, // 36h in minutes
        hoursAvailableDisplay: '36h',
        recommendedAction: {
          status: 'at-risk',
          message: 'At risk - 11h behind schedule'
        }
      },
      fullCapacity: {
        totalVehicles: 112,
        remaining: 70,
        completed: 42,
        percentageComplete: 38,
        hoursUsed: 2100, // 35h in minutes
        hoursAvailable: 2160, // 36h in minutes
        hoursAvailableDisplay: '36h',
        recommendedAction: {
          status: 'behind',
          message: 'Behind - Need 1h 40m more - Add 2 drivers or overtime'
        }
      }
    },
    zoneStatus: 'behind',
    businessIntelligence: {
      marketShare: 12.1,
      growthRate: -2.3,
      profitability: 8.9,
      customerSatisfaction: 72,
      operationalEfficiency: 65,
      riskScore: 85,
      competitivePosition: 'weak',
      strategicValue: 'medium'
    },
    performanceMetrics: {
      avgResponseTime: 35,
      completionRate: 78,
      costPerVehicle: 58,
      revenuePerVehicle: 65,
      utilizationRate: 72,
      customerRetention: 76,
      seasonalVariation: 22,
      peakHours: ['09:00-11:00', '18:00-20:00']
    },
    strategicInsights: {
      marketOpportunities: ['Improve service quality', 'Expand local partnerships', 'Develop niche services'],
      operationalChallenges: ['Driver shortage', 'Equipment reliability issues', 'Customer satisfaction problems'],
      recommendedActions: ['Invest in driver training', 'Upgrade equipment fleet', 'Implement quality control'],
      longTermTrends: ['Market consolidation', 'Service quality focus', 'Technology adoption'],
      competitiveThreats: ['Better equipped competitors', 'Customer defection', 'Price pressure'],
      growthPotential: 8
    },
    // Naz Akel's Multi-Shift & Predictive Analytics
    shiftManagement: {
      currentShift: {
        shiftId: 'dd-day-2025-01-13',
        shiftType: 'day',
        status: 'active',
        startTime: '08:00',
        endTime: '20:00',
        driverCount: 2,
        capacityUtilization: 85,
        vehiclesLocated: 28,
        vehiclesPickedUp: 18,
        pendingVehicles: 10,
        avgResponseTime: 35,
        efficiency: 78,
        drivers: [
          { driverId: 'driver10', name: 'Kevin Park', capacity: 6, currentLoad: 7, status: 'behind' },
          { driverId: 'driver11', name: 'Maria Santos', capacity: 5, currentLoad: 6, status: 'behind' }
        ]
      },
      upcomingShifts: [],
      historicalShifts: [],
      crossShiftCoordination: {
        dayToNightHandoff: 10,
        nightToDayHandoff: 8,
        weekendContinuity: 65,
        pendingVehicles: []
      }
    },
    predictiveAnalytics: {
      capacityForecast: {
        today: 28,
        tomorrow: 31,
        thisWeek: 198,
        nextWeek: 215,
        trend: 'increasing',
        confidence: 72
      },
      demandPrediction: {
        peakHours: ['09:00-11:00', '18:00-20:00'],
        seasonalTrends: [72, 78, 65, 70, 82, 76, 74],
        weatherImpact: 25,
        eventImpact: 15
      },
      optimizationRecommendations: [
        {
          action: 'Hire experienced drivers to improve efficiency',
          impact: 'high',
          cost: 800,
          roi: 1500,
          timeline: '2 weeks'
        }
      ],
      mlInsights: {
        patternRecognition: ['District area shows consistent low efficiency', 'Weekend demand minimal'],
        anomalyDetection: ['Driver turnover rate high', 'Equipment reliability issues'],
        predictiveMaintenance: ['Multiple trucks need major service'],
        riskAssessment: 85
      }
    },
    vehicleAging: [],
    realTimeAlerts: {
      capacityExceeded: true,
      agingVehicles: 0,
      driverShortage: true,
      equipmentIssues: ['Multiple trucks down', 'Hydraulic failures'],
      weatherWarnings: []
    }
  },
  {
    zoneId: 'ee',
    zoneLabel: 'Houston West',
    zoneBadge: 156,
    totals: {
      totalAddresses: 298,
      newAddresses: 187,
      singleCheckins: 145,
      notChecked5d: 89
    },
    legend: {
      alerts: 67,
      courts: 5,
      verifiedPins: 2,
      views: 8,
      awards: 23,
      payments: 12,
      photos: 28
    },
    dailyBreakdown: {
      '2025-01-06': 18,
      '2025-01-07': 22,
      '2025-01-08': 16,
      '2025-01-09': 24,
      '2025-01-10': 19,
      '2025-01-11': 21,
      '2025-01-12': 17
    },
    clients: [
      { clientId: 'client17', clientName: 'East End Auto', vehicleCount: 67, revenue: 28000, priority: 'low', contractType: 'volume' },
      { clientId: 'client18', clientName: 'Suburban Insurance', vehicleCount: 52, revenue: 22000, priority: 'low', contractType: 'standard' },
      { clientId: 'client19', clientName: 'Residential Recovery', vehicleCount: 37, revenue: 16000, priority: 'low', contractType: 'volume' }
    ],
    drivers: [
      { driverId: 'driver12', driverName: 'Chris Brown', capacity: 4, status: 'on-track', currentLoad: 3, experience: 5, efficiency: 88, certification: ['CDL-B'], hourlyRate: 23 },
      { driverId: 'driver13', driverName: 'Jessica White', capacity: 5, status: 'on-track', currentLoad: 4, experience: 6, efficiency: 91, certification: ['CDL-B', 'Light Tow'], hourlyRate: 25 }
    ],
    forecasting: {
      capacityGap: 3,
      trucksNeeded: 0,
      stashingEfficiency: 4,
      trucksEfficiency: 2,
      recommendation: 'stashing'
    },
    capacity: {
      goalCapacity: {
        totalVehicles: 65,
        driversAssigned: 5,
        completed: 58,
        percentageOfGoal: 89,
        hoursUsed: 1080, // 18h in minutes
        hoursAvailable: 1800, // 30h in minutes
        hoursAvailableDisplay: '30h',
        recommendedAction: {
          status: 'on-track',
          message: 'On track - 12h ahead of schedule, excellent performance'
        }
      },
      fullCapacity: {
        totalVehicles: 82,
        remaining: 24,
        completed: 58,
        percentageComplete: 71,
        hoursUsed: 1380, // 23h in minutes
        hoursAvailable: 1800, // 30h in minutes
        hoursAvailableDisplay: '30h',
        recommendedAction: {
          status: 'on-track',
          message: 'On track - 7h buffer available'
        }
      }
    },
    zoneStatus: 'on-track',
    businessIntelligence: {
      marketShare: 8.3,
      growthRate: 3.1,
      profitability: 25.4,
      customerSatisfaction: 93,
      operationalEfficiency: 95,
      riskScore: 20,
      competitivePosition: 'leading',
      strategicValue: 'medium'
    },
    performanceMetrics: {
      avgResponseTime: 15,
      completionRate: 98,
      costPerVehicle: 32,
      revenuePerVehicle: 95,
      utilizationRate: 96,
      customerRetention: 97,
      seasonalVariation: 8,
      peakHours: ['10:00-12:00', '19:00-21:00']
    },
    strategicInsights: {
      marketOpportunities: ['Maintain service excellence', 'Expand to adjacent areas', 'Develop premium services'],
      operationalChallenges: ['Maintaining quality standards', 'Managing growth expectations', 'Equipment maintenance'],
      recommendedActions: ['Preserve service quality', 'Plan controlled expansion', 'Invest in efficiency tools'],
      longTermTrends: ['Quality over quantity focus', 'Sustainable growth models', 'Customer loyalty programs'],
      competitiveThreats: ['Market saturation', 'Competitor quality improvements', 'Economic downturns'],
      growthPotential: 12
    },
    // Naz Akel's Multi-Shift & Predictive Analytics
    shiftManagement: {
      currentShift: {
        shiftId: 'ee-day-2025-01-13',
        shiftType: 'day',
        status: 'active',
        startTime: '08:00',
        endTime: '20:00',
        driverCount: 2,
        capacityUtilization: 78,
        vehiclesLocated: 18,
        vehiclesPickedUp: 16,
        pendingVehicles: 2,
        avgResponseTime: 15,
        efficiency: 96,
        drivers: [
          { driverId: 'driver12', name: 'Chris Brown', capacity: 4, currentLoad: 3, status: 'on-track' },
          { driverId: 'driver13', name: 'Jessica White', capacity: 5, currentLoad: 4, status: 'on-track' }
        ]
      },
      upcomingShifts: [],
      historicalShifts: [],
      crossShiftCoordination: {
        dayToNightHandoff: 2,
        nightToDayHandoff: 1,
        weekendContinuity: 98,
        pendingVehicles: []
      }
    },
    predictiveAnalytics: {
      capacityForecast: {
        today: 18,
        tomorrow: 22,
        thisWeek: 142,
        nextWeek: 158,
        trend: 'stable',
        confidence: 95
      },
      demandPrediction: {
        peakHours: ['10:00-12:00', '19:00-21:00'],
        seasonalTrends: [88, 91, 85, 89, 94, 92, 90],
        weatherImpact: 8,
        eventImpact: 5
      },
      optimizationRecommendations: [
        {
          action: 'Maintain current service levels',
          impact: 'low',
          cost: 0,
          roi: 0,
          timeline: 'ongoing'
        }
      ],
      mlInsights: {
        patternRecognition: ['East End shows consistent high efficiency', 'Residential clients prefer evening service'],
        anomalyDetection: ['No significant anomalies detected'],
        predictiveMaintenance: ['All equipment performing optimally'],
        riskAssessment: 20
      }
    },
    vehicleAging: [],
    realTimeAlerts: {
      capacityExceeded: false,
      agingVehicles: 0,
      driverShortage: false,
      equipmentIssues: [],
      weatherWarnings: []
    }
  },
  {
    zoneId: 'ff',
    zoneLabel: 'Phoenix North',
    zoneBadge: 834,
    totals: {
      totalAddresses: 1203,
      newAddresses: 967,
      singleCheckins: 789,
      notChecked5d: 123
    },
    legend: {
      alerts: 98,
      courts: 25,
      verifiedPins: 5,
      views: 15,
      awards: 156,
      payments: 78,
      photos: 134
    },
    dailyBreakdown: {
      '2025-01-06': 89,
      '2025-01-07': 95,
      '2025-01-08': 78,
      '2025-01-09': 102,
      '2025-01-10': 87,
      '2025-01-11': 91,
      '2025-01-12': 82
    },
    clients: [
      { clientId: 'client20', clientName: 'Fleet Management Co', vehicleCount: 345, revenue: 185000, priority: 'high', contractType: 'premium' },
      { clientId: 'client21', clientName: 'Commercial Insurance', vehicleCount: 278, revenue: 142000, priority: 'high', contractType: 'premium' },
      { clientId: 'client22', clientName: 'Industrial Recovery', vehicleCount: 234, revenue: 118000, priority: 'high', contractType: 'standard' },
      { clientId: 'client23', clientName: 'Corporate Auto', vehicleCount: 346, revenue: 192000, priority: 'high', contractType: 'premium' }
    ],
    drivers: [
      { driverId: 'driver14', driverName: 'Robert Taylor', capacity: 15, status: 'on-track', currentLoad: 12, experience: 18, efficiency: 96, certification: ['CDL-A', 'Heavy Tow', 'Specialized', 'Management'], hourlyRate: 35 },
      { driverId: 'driver15', driverName: 'Jennifer Adams', capacity: 14, status: 'at-risk', currentLoad: 13, experience: 16, efficiency: 89, certification: ['CDL-A', 'Heavy Tow', 'Specialized'], hourlyRate: 33 },
      { driverId: 'driver16', driverName: 'Michael Clark', capacity: 13, status: 'on-track', currentLoad: 11, experience: 14, efficiency: 93, certification: ['CDL-A', 'Heavy Tow'], hourlyRate: 31 },
      { driverId: 'driver17', driverName: 'Amanda Lewis', capacity: 12, status: 'at-risk', currentLoad: 12, experience: 12, efficiency: 87, certification: ['CDL-A', 'Heavy Tow'], hourlyRate: 30 }
    ],
    forecasting: {
      capacityGap: 35,
      trucksNeeded: 4,
      stashingEfficiency: 25,
      trucksEfficiency: 20,
      recommendation: 'both'
    },
    capacity: {
      goalCapacity: {
        totalVehicles: 187,
        driversAssigned: 14,
        completed: 112,
        percentageOfGoal: 60,
        hoursUsed: 1980, // 33h in minutes
        hoursAvailable: 3000, // 50h in minutes
        hoursAvailableDisplay: '50h',
        recommendedAction: {
          status: 'at-risk',
          message: 'At risk - 17h behind schedule, add 3 drivers'
        }
      },
      fullCapacity: {
        totalVehicles: 245,
        remaining: 133,
        completed: 112,
        percentageComplete: 46,
        hoursUsed: 3300, // 55h in minutes
        hoursAvailable: 3000, // 50h in minutes
        hoursAvailableDisplay: '50h',
        recommendedAction: {
          status: 'behind',
          message: 'Behind - Need 5h more - Add 4 drivers or overtime to complete all'
        }
      }
    },
    zoneStatus: 'at-risk',
    businessIntelligence: {
      marketShare: 42.8,
      growthRate: 15.6,
      profitability: 14.2,
      customerSatisfaction: 89,
      operationalEfficiency: 76,
      riskScore: 78,
      competitivePosition: 'leading',
      strategicValue: 'critical'
    },
    performanceMetrics: {
      avgResponseTime: 32,
      completionRate: 89,
      costPerVehicle: 68,
      revenuePerVehicle: 125,
      utilizationRate: 82,
      customerRetention: 92,
      seasonalVariation: 25,
      peakHours: ['06:00-08:00', '14:00-16:00', '20:00-22:00']
    },
    strategicInsights: {
      marketOpportunities: ['Major market expansion', 'Enterprise partnerships', 'Technology leadership'],
      operationalChallenges: ['Scale management complexity', 'Resource allocation optimization', 'Quality maintenance at scale'],
      recommendedActions: ['Implement enterprise systems', 'Develop management protocols', 'Invest in automation'],
      longTermTrends: ['Market consolidation leadership', 'Technology platform development', 'Industry standard setting'],
      competitiveThreats: ['National competitors', 'Technology disruption', 'Regulatory changes'],
      growthPotential: 45
    },
    // Naz Akel's Multi-Shift & Predictive Analytics
    shiftManagement: {
      currentShift: {
        shiftId: 'ff-day-2025-01-13',
        shiftType: 'day',
        status: 'active',
        startTime: '08:00',
        endTime: '20:00',
        driverCount: 4,
        capacityUtilization: 89,
        vehiclesLocated: 89,
        vehiclesPickedUp: 67,
        pendingVehicles: 22,
        avgResponseTime: 32,
        efficiency: 89,
        drivers: [
          { driverId: 'driver14', name: 'Robert Taylor', capacity: 15, currentLoad: 12, status: 'on-track' },
          { driverId: 'driver15', name: 'Jennifer Adams', capacity: 14, currentLoad: 13, status: 'at-risk' },
          { driverId: 'driver16', name: 'Michael Clark', capacity: 13, currentLoad: 11, status: 'on-track' },
          { driverId: 'driver17', name: 'Amanda Lewis', capacity: 12, currentLoad: 12, status: 'at-risk' }
        ]
      },
      upcomingShifts: [
        {
          shiftId: 'ff-night-2025-01-13',
          shiftType: 'night',
          status: 'upcoming',
          startTime: '20:00',
          endTime: '08:00',
          driverCount: 3,
          capacityUtilization: 0,
          vehiclesLocated: 0,
          vehiclesPickedUp: 0,
          pendingVehicles: 22,
          avgResponseTime: 0,
          efficiency: 0,
          drivers: [
            { driverId: 'driver18', name: 'Night Driver 1', capacity: 12, currentLoad: 0, status: 'on-track' },
            { driverId: 'driver19', name: 'Night Driver 2', capacity: 14, currentLoad: 0, status: 'on-track' },
            { driverId: 'driver20', name: 'Night Driver 3', capacity: 13, currentLoad: 0, status: 'on-track' }
          ]
        }
      ],
      historicalShifts: [
        {
          shiftId: 'ff-day-2025-01-12',
          shiftType: 'day',
          status: 'completed',
          startTime: '08:00',
          endTime: '20:00',
          driverCount: 4,
          capacityUtilization: 87,
          vehiclesLocated: 82,
          vehiclesPickedUp: 71,
          pendingVehicles: 11,
          avgResponseTime: 28,
          efficiency: 91,
          drivers: []
        }
      ],
      crossShiftCoordination: {
        dayToNightHandoff: 22,
        nightToDayHandoff: 15,
        weekendContinuity: 89,
        pendingVehicles: [
          {
            vehicleId: 'veh-005',
            location: '456 Fleet St',
            locatedDate: '2025-01-08',
            daysAging: 5,
            priority: 'critical',
            status: 'pending',
            clientId: 'client20',
            estimatedValue: 75000,
            lastAttempt: '2025-01-10',
            attempts: 5,
            reasonForDelay: 'Complex recovery required'
          }
        ]
      }
    },
    predictiveAnalytics: {
      capacityForecast: {
        today: 89,
        tomorrow: 95,
        thisWeek: 625,
        nextWeek: 680,
        trend: 'increasing',
        confidence: 89
      },
      demandPrediction: {
        peakHours: ['06:00-08:00', '14:00-16:00', '20:00-22:00'],
        seasonalTrends: [89, 95, 82, 87, 92, 88, 85],
        weatherImpact: 25,
        eventImpact: 45
      },
      optimizationRecommendations: [
        {
          action: 'Scale operations with 3 additional drivers',
          impact: 'high',
          cost: 1200,
          roi: 3500,
          timeline: '1 week'
        },
        {
          action: 'Implement enterprise fleet management',
          impact: 'medium',
          cost: 5000,
          roi: 12000,
          timeline: '1 month'
        }
      ],
      mlInsights: {
        patternRecognition: [
          'Fleet operations show 45% higher complexity',
          'Enterprise clients require specialized handling',
          'Industrial areas have 25% longer recovery times'
        ],
        anomalyDetection: [
          'Unusual demand surge in Fleet St area',
          'Driver efficiency varying significantly'
        ],
        predictiveMaintenance: [
          'Truck #6 needs hydraulic overhaul by Friday',
          'Multiple trucks showing wear patterns'
        ],
        riskAssessment: 78
      }
    },
    vehicleAging: [
      {
        vehicleId: 'veh-005',
        location: '456 Fleet St',
        locatedDate: '2025-01-08',
        daysAging: 5,
        priority: 'critical',
        status: 'pending',
        clientId: 'client20',
        estimatedValue: 75000,
        lastAttempt: '2025-01-10',
        attempts: 5,
        reasonForDelay: 'Complex recovery required'
      }
    ],
    realTimeAlerts: {
      capacityExceeded: true,
      agingVehicles: 1,
      driverShortage: false,
      equipmentIssues: ['Truck #6 hydraulic system', 'Multiple equipment checks needed'],
      weatherWarnings: ['Severe weather expected weekend']
    }
  }
];

export const ZONE_OPTIONS = ZONES.map(zone => ({
  value: zone.zoneId,
  label: zone.zoneLabel
}));

export type SortOption = 
  | 'zone-asc' 
  | 'zone-desc' 
  | 'total-asc' 
  | 'total-desc' 
  | 'new-asc' 
  | 'new-desc' 
  | 'checkins-asc' 
  | 'checkins-desc' 
  | 'notchecked-asc' 
  | 'notchecked-desc';

export const SORT_OPTIONS = [
  { value: 'zone-asc', label: 'Zone Name (A-Z)' },
  { value: 'zone-desc', label: 'Zone Name (Z-A)' },
  { value: 'total-asc', label: 'Total Addresses (Low-High)' },
  { value: 'total-desc', label: 'Total Addresses (High-Low)' },
  { value: 'new-asc', label: 'New Addresses (Low-High)' },
  { value: 'new-desc', label: 'New Addresses (High-Low)' },
  { value: 'checkins-asc', label: 'Single Check-ins (Low-High)' },
  { value: 'checkins-desc', label: 'Single Check-ins (High-Low)' },
  { value: 'notchecked-asc', label: 'Not Checked 5D (Low-High)' },
  { value: 'notchecked-desc', label: 'Not Checked 5D (High-Low)' }
];
