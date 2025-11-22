import { Market, Zone, Vehicle, ZoneMetrics, Driver, DashboardFilters, ApiResponse } from '../types/dashboard';
import { calculateZoneMetrics } from '../lib/capacity/calc';
import { generateRecommendations } from '../lib/capacity/recommend';

// Mock data
const mockMarkets: Market[] = [
  {
    id: 'nationwide',
    name: 'Nationwide',
    isActive: true,
    zones: []
  },
  {
    id: 'baltimore',
    name: 'Baltimore',
    isActive: true,
    zones: []
  },
  {
    id: 'chicago',
    name: 'Chicago',
    isActive: true,
    zones: []
  },
  {
    id: 'dallas',
    name: 'Dallas',
    isActive: true,
    zones: []
  },
  {
    id: 'los-angeles',
    name: 'Los Angeles',
    isActive: true,
    zones: []
  },
  {
    id: 'houston',
    name: 'Houston',
    isActive: true,
    zones: []
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    isActive: true,
    zones: []
  }
];

const mockZones: Zone[] = [
  // Baltimore zones
  {
    id: 'baltimore-downtown',
    name: 'Downtown',
    marketId: 'baltimore',
    isActive: true,
    storageLot: { id: 'balt-lot-1', name: 'Main Storage Lot', lat: 39.2847, lng: -76.6204 },
    stash: { id: 'balt-stash-1', name: 'Downtown Stash', lat: 39.2904, lng: -76.6122 },
    shiftLength: 12,
    drivers: []
  },
  {
    id: 'baltimore-harbor',
    name: 'Harbor District',
    marketId: 'baltimore',
    isActive: true,
    storageLot: { id: 'balt-lot-2', name: 'Harbor Storage', lat: 39.2786, lng: -76.6085 },
    stash: { id: 'balt-stash-2', name: 'Harbor Stash', lat: 39.2812, lng: -76.6054 },
    shiftLength: 12,
    drivers: []
  },
  {
    id: 'baltimore-west',
    name: 'West Baltimore',
    marketId: 'baltimore',
    isActive: true,
    storageLot: { id: 'balt-lot-3', name: 'West Storage', lat: 39.2940, lng: -76.6365 },
    stash: { id: 'balt-stash-3', name: 'West Stash', lat: 39.2876, lng: -76.6421 },
    shiftLength: 12,
    drivers: []
  },
  {
    id: 'baltimore-east',
    name: 'East Baltimore',
    marketId: 'baltimore',
    isActive: true,
    storageLot: { id: 'balt-lot-4', name: 'East Storage', lat: 39.2950, lng: -76.5950 },
    stash: { id: 'balt-stash-4', name: 'East Stash', lat: 39.2980, lng: -76.5980 },
    shiftLength: 12,
    drivers: []
  },
  // Chicago zones
  {
    id: 'chicago-loop',
    name: 'Loop',
    marketId: 'chicago',
    isActive: true,
    storageLot: { id: 'chi-lot-1', name: 'Loop Storage', lat: 41.8781, lng: -87.6298 },
    stash: { id: 'chi-stash-1', name: 'Loop Stash', lat: 41.8781, lng: -87.6298 },
    shiftLength: 12,
    drivers: []
  },
  {
    id: 'chicago-north',
    name: 'North Side',
    marketId: 'chicago',
    isActive: true,
    storageLot: { id: 'chi-lot-2', name: 'North Storage', lat: 41.8781, lng: -87.6298 },
    stash: { id: 'chi-stash-2', name: 'North Stash', lat: 41.8781, lng: -87.6298 },
    shiftLength: 12,
    drivers: []
  },
  {
    id: 'chicago-south',
    name: 'South Side',
    marketId: 'chicago',
    isActive: true,
    storageLot: { id: 'chi-lot-3', name: 'South Storage', lat: 41.8781, lng: -87.6298 },
    stash: { id: 'chi-stash-3', name: 'South Stash', lat: 41.8781, lng: -87.6298 },
    shiftLength: 12,
    drivers: []
  },
  {
    id: 'chicago-west',
    name: 'West Side',
    marketId: 'chicago',
    isActive: true,
    storageLot: { id: 'chi-lot-4', name: 'West Storage', lat: 41.8781, lng: -87.6298 },
    stash: { id: 'chi-stash-4', name: 'West Stash', lat: 41.8781, lng: -87.6298 },
    shiftLength: 12,
    drivers: []
  },
  // Dallas zones
  {
    id: 'dallas-downtown',
    name: 'Downtown',
    marketId: 'dallas',
    isActive: true,
    storageLot: { id: 'dal-lot-1', name: 'Downtown Storage', lat: 32.7767, lng: -96.7970 },
    stash: { id: 'dal-stash-1', name: 'Downtown Stash', lat: 32.7767, lng: -96.7970 },
    shiftLength: 12,
    drivers: []
  },
  {
    id: 'dallas-north',
    name: 'North Dallas',
    marketId: 'dallas',
    isActive: true,
    storageLot: { id: 'dal-lot-2', name: 'North Storage', lat: 32.7767, lng: -96.7970 },
    stash: { id: 'dal-stash-2', name: 'North Stash', lat: 32.7767, lng: -96.7970 },
    shiftLength: 12,
    drivers: []
  },
  {
    id: 'dallas-east',
    name: 'East Dallas',
    marketId: 'dallas',
    isActive: true,
    storageLot: { id: 'dal-lot-3', name: 'East Storage', lat: 32.7767, lng: -96.7970 },
    stash: { id: 'dal-stash-3', name: 'East Stash', lat: 32.7767, lng: -96.7970 },
    shiftLength: 12,
    drivers: []
  },
  // Houston zones
  {
    id: 'houston-downtown',
    name: 'Downtown',
    marketId: 'houston',
    isActive: true,
    storageLot: { id: 'hou-lot-1', name: 'Downtown Storage', lat: 29.7604, lng: -95.3698 },
    stash: { id: 'hou-stash-1', name: 'Downtown Stash', lat: 29.7604, lng: -95.3698 },
    shiftLength: 12,
    drivers: []
  },
  {
    id: 'houston-west',
    name: 'West Houston',
    marketId: 'houston',
    isActive: true,
    storageLot: { id: 'hou-lot-2', name: 'West Storage', lat: 29.7604, lng: -95.3698 },
    stash: { id: 'hou-stash-2', name: 'West Stash', lat: 29.7604, lng: -95.3698 },
    shiftLength: 12,
    drivers: []
  },
  {
    id: 'houston-south',
    name: 'South Houston',
    marketId: 'houston',
    isActive: true,
    storageLot: { id: 'hou-lot-3', name: 'South Storage', lat: 29.7604, lng: -95.3698 },
    stash: { id: 'hou-stash-3', name: 'South Stash', lat: 29.7604, lng: -95.3698 },
    shiftLength: 12,
    drivers: []
  },
  // Los Angeles zones
  {
    id: 'la-downtown',
    name: 'Downtown',
    marketId: 'los-angeles',
    isActive: true,
    storageLot: { id: 'la-lot-1', name: 'Downtown Storage', lat: 34.0522, lng: -118.2437 },
    stash: { id: 'la-stash-1', name: 'Downtown Stash', lat: 34.0522, lng: -118.2437 },
    shiftLength: 12,
    drivers: []
  },
  {
    id: 'la-westside',
    name: 'Westside',
    marketId: 'los-angeles',
    isActive: true,
    storageLot: { id: 'la-lot-2', name: 'Westside Storage', lat: 34.0522, lng: -118.2437 },
    stash: { id: 'la-stash-2', name: 'Westside Stash', lat: 34.0522, lng: -118.2437 },
    shiftLength: 12,
    drivers: []
  },
  {
    id: 'la-valley',
    name: 'San Fernando Valley',
    marketId: 'los-angeles',
    isActive: true,
    storageLot: { id: 'la-lot-3', name: 'Valley Storage', lat: 34.0522, lng: -118.2437 },
    stash: { id: 'la-stash-3', name: 'Valley Stash', lat: 34.0522, lng: -118.2437 },
    shiftLength: 12,
    drivers: []
  },
  // Phoenix zones
  {
    id: 'phoenix-downtown',
    name: 'Downtown',
    marketId: 'phoenix',
    isActive: true,
    storageLot: { id: 'phx-lot-1', name: 'Downtown Storage', lat: 33.4484, lng: -112.0740 },
    stash: { id: 'phx-stash-1', name: 'Downtown Stash', lat: 33.4484, lng: -112.0740 },
    shiftLength: 12,
    drivers: []
  },
  {
    id: 'phoenix-north',
    name: 'North Phoenix',
    marketId: 'phoenix',
    isActive: true,
    storageLot: { id: 'phx-lot-2', name: 'North Storage', lat: 33.4484, lng: -112.0740 },
    stash: { id: 'phx-stash-2', name: 'North Stash', lat: 33.4484, lng: -112.0740 },
    shiftLength: 12
  }
];

const mockVehicles: Vehicle[] = [
  // Baltimore Downtown vehicles
  { id: 'v1', address: '100 E Pratt St', zip: '21202', lat: 39.2904, lng: -76.6122, year: 2020, make: 'Toyota', model: 'Camry', priority: 'High', status: 'Located', eta: 15 },
  { id: 'v2', address: '200 Light St', zip: '21202', lat: 39.2847, lng: -76.6204, year: 2021, make: 'Honda', model: 'Accord', priority: 'Medium', status: 'Located', eta: 25 },
  { id: 'v3', address: '300 Charles St', zip: '21201', lat: 39.2970, lng: -76.6164, year: 2019, make: 'Ford', model: 'F-150', priority: 'Low', status: 'Located', eta: 35 },
  { id: 'v4', address: '400 E Baltimore St', zip: '21202', lat: 39.2898, lng: -76.6105, year: 2022, make: 'Chevrolet', model: 'Malibu', priority: 'High', status: 'Located', eta: 18 },
  { id: 'v5', address: '500 S Broadway', zip: '21231', lat: 39.2865, lng: -76.6118, year: 2020, make: 'Nissan', model: 'Altima', priority: 'Medium', status: 'Located', eta: 28 },
  
  // Baltimore Harbor vehicles
  { id: 'v6', address: '600 Thames St', zip: '21231', lat: 39.2786, lng: -76.6085, year: 2022, make: 'Chevrolet', model: 'Silverado', priority: 'High', status: 'Located', eta: 20 },
  { id: 'v7', address: '700 Fleet St', zip: '21231', lat: 39.2812, lng: -76.6054, year: 2020, make: 'Nissan', model: 'Altima', priority: 'Medium', status: 'Located', eta: 30 },
  { id: 'v8', address: '800 Key Hwy', zip: '21230', lat: 39.2765, lng: -76.6078, year: 2021, make: 'BMW', model: 'X3', priority: 'High', status: 'Located', eta: 22 },
  { id: 'v9', address: '900 E Fort Ave', zip: '21230', lat: 39.2798, lng: -76.6045, year: 2019, make: 'Mercedes', model: 'C-Class', priority: 'Medium', status: 'Located', eta: 32 },
  { id: 'v10', address: '1000 S Hanover St', zip: '21230', lat: 39.2756, lng: -76.6098, year: 2023, make: 'Tesla', model: 'Model Y', priority: 'Low', status: 'Stashed', eta: 40 },
  
  // Baltimore West vehicles
  { id: 'v11', address: '1100 W Baltimore St', zip: '21223', lat: 39.2940, lng: -76.6365, year: 2021, make: 'BMW', model: 'X5', priority: 'High', status: 'Located', eta: 18 },
  { id: 'v12', address: '1200 Pennsylvania Ave', zip: '21217', lat: 39.2876, lng: -76.6421, year: 2019, make: 'Mercedes', model: 'C-Class', priority: 'Medium', status: 'Located', eta: 28 },
  { id: 'v13', address: '1300 N Monroe St', zip: '21217', lat: 39.2987, lng: -76.6389, year: 2020, make: 'Audi', model: 'A4', priority: 'High', status: 'Located', eta: 24 },
  { id: 'v14', address: '1400 W Franklin St', zip: '21223', lat: 39.2956, lng: -76.6412, year: 2022, make: 'Lexus', model: 'RX', priority: 'Medium', status: 'Located', eta: 35 },
  { id: 'v15', address: '1500 Druid Hill Ave', zip: '21217', lat: 39.3012, lng: -76.6345, year: 2021, make: 'Infiniti', model: 'QX60', priority: 'Low', status: 'Blocked', eta: 42 },
  
  // Baltimore East vehicles
  { id: 'v16', address: '1600 E Baltimore St', zip: '21224', lat: 39.2950, lng: -76.5950, year: 2020, make: 'Toyota', model: 'RAV4', priority: 'High', status: 'Located', eta: 16 },
  { id: 'v17', address: '1700 N Patterson Park Ave', zip: '21224', lat: 39.2980, lng: -76.5980, year: 2022, make: 'Honda', model: 'CR-V', priority: 'Medium', status: 'Located', eta: 26 },
  { id: 'v18', address: '1800 E Pratt St', zip: '21224', lat: 39.2923, lng: -76.5967, year: 2021, make: 'Subaru', model: 'Outback', priority: 'High', status: 'Located', eta: 20 },
  { id: 'v19', address: '1900 Fleet St', zip: '21224', lat: 39.2978, lng: -76.5945, year: 2019, make: 'Mazda', model: 'CX-5', priority: 'Medium', status: 'Located', eta: 33 },
  { id: 'v20', address: '2000 E Monument St', zip: '21205', lat: 39.2998, lng: -76.5923, year: 2023, make: 'Hyundai', model: 'Tucson', priority: 'Low', status: 'Located', eta: 38 },
  
  // Chicago Loop vehicles
  { id: 'v21', address: '100 N Michigan Ave', zip: '60601', lat: 41.8781, lng: -87.6298, year: 2022, make: 'Tesla', model: 'Model 3', priority: 'High', status: 'Located', eta: 22 },
  { id: 'v22', address: '200 W Madison St', zip: '60606', lat: 41.8819, lng: -87.6337, year: 2020, make: 'Audi', model: 'A4', priority: 'Medium', status: 'Located', eta: 32 },
  { id: 'v23', address: '300 S State St', zip: '60604', lat: 41.8781, lng: -87.6278, year: 2021, make: 'BMW', model: '3 Series', priority: 'High', status: 'Located', eta: 18 },
  { id: 'v24', address: '400 E Randolph St', zip: '60601', lat: 41.8845, lng: -87.6321, year: 2023, make: 'Mercedes', model: 'E-Class', priority: 'Medium', status: 'Located', eta: 28 },
  { id: 'v25', address: '500 N Wacker Dr', zip: '60606', lat: 41.8823, lng: -87.6356, year: 2020, make: 'Lexus', model: 'ES', priority: 'Low', status: 'Located', eta: 40 },
  
  // Chicago North vehicles
  { id: 'v26', address: '600 N Clark St', zip: '60654', lat: 41.8956, lng: -87.6312, year: 2021, make: 'Volvo', model: 'XC60', priority: 'High', status: 'Located', eta: 25 },
  { id: 'v27', address: '700 N Wells St', zip: '60654', lat: 41.8978, lng: -87.6345, year: 2019, make: 'Acura', model: 'MDX', priority: 'Medium', status: 'Located', eta: 35 },
  { id: 'v28', address: '800 N Dearborn St', zip: '60654', lat: 41.8967, lng: -87.6289, year: 2022, make: 'Genesis', model: 'GV70', priority: 'High', status: 'Located', eta: 20 },
  { id: 'v29', address: '900 N Rush St', zip: '60611', lat: 41.8989, lng: -87.6256, year: 2020, make: 'Lincoln', model: 'Corsair', priority: 'Medium', status: 'Located', eta: 30 },
  { id: 'v30', address: '1000 N Lake Shore Dr', zip: '60611', lat: 41.9001, lng: -87.6223, year: 2023, make: 'Cadillac', model: 'XT5', priority: 'Low', status: 'Stashed', eta: 42 },
  
  // Dallas Downtown vehicles
  { id: 'v31', address: '100 Main St', zip: '75201', lat: 32.7767, lng: -96.7970, year: 2020, make: 'Ford', model: 'Explorer', priority: 'High', status: 'Located', eta: 19 },
  { id: 'v32', address: '200 Commerce St', zip: '75201', lat: 32.7789, lng: -96.7998, year: 2022, make: 'Chevrolet', model: 'Tahoe', priority: 'Medium', status: 'Located', eta: 29 },
  { id: 'v33', address: '300 Elm St', zip: '75201', lat: 32.7756, lng: -96.7945, year: 2021, make: 'GMC', model: 'Yukon', priority: 'High', status: 'Located', eta: 21 },
  { id: 'v34', address: '400 Pearl St', zip: '75201', lat: 32.7778, lng: -96.7912, year: 2019, make: 'Buick', model: 'Enclave', priority: 'Medium', status: 'Located', eta: 31 },
  { id: 'v35', address: '500 Ross Ave', zip: '75202', lat: 32.7790, lng: -96.7889, year: 2023, make: 'Cadillac', model: 'Escalade', priority: 'Low', status: 'Blocked', eta: 43 },
  
  // Houston Downtown vehicles
  { id: 'v36', address: '100 Main St', zip: '77002', lat: 29.7604, lng: -95.3698, year: 2020, make: 'Toyota', model: 'Highlander', priority: 'High', status: 'Located', eta: 17 },
  { id: 'v37', address: '200 Fannin St', zip: '77002', lat: 29.7626, lng: -95.3726, year: 2022, make: 'Honda', model: 'Pilot', priority: 'Medium', status: 'Located', eta: 27 },
  { id: 'v38', address: '300 Travis St', zip: '77002', lat: 29.7592, lng: -95.3673, year: 2021, make: 'Nissan', model: 'Pathfinder', priority: 'High', status: 'Located', eta: 23 },
  { id: 'v39', address: '400 Texas Ave', zip: '77002', lat: 29.7614, lng: -95.3640, year: 2019, make: 'Mazda', model: 'CX-9', priority: 'Medium', status: 'Located', eta: 33 },
  { id: 'v40', address: '500 Louisiana St', zip: '77002', lat: 29.7626, lng: -95.3607, year: 2023, make: 'Subaru', model: 'Ascent', priority: 'Low', status: 'Stashed', eta: 41 },
  
  // Los Angeles Downtown vehicles
  { id: 'v41', address: '100 S Broadway', zip: '90012', lat: 34.0522, lng: -118.2437, year: 2020, make: 'Tesla', model: 'Model X', priority: 'High', status: 'Located', eta: 24 },
  { id: 'v42', address: '200 W 1st St', zip: '90012', lat: 34.0544, lng: -118.2465, year: 2022, make: 'BMW', model: 'iX', priority: 'Medium', status: 'Located', eta: 34 },
  { id: 'v43', address: '300 S Grand Ave', zip: '90071', lat: 34.0510, lng: -118.2412, year: 2021, make: 'Mercedes', model: 'EQS', priority: 'High', status: 'Located', eta: 26 },
  { id: 'v44', address: '400 N Figueroa St', zip: '90012', lat: 34.0532, lng: -118.2379, year: 2019, make: 'Audi', model: 'e-tron', priority: 'Medium', status: 'Located', eta: 36 },
  { id: 'v45', address: '500 E 3rd St', zip: '90013', lat: 34.0544, lng: -118.2346, year: 2023, make: 'Porsche', model: 'Taycan', priority: 'Low', status: 'Blocked', eta: 44 },
  
  // Phoenix Downtown vehicles
  { id: 'v46', address: '100 W Washington St', zip: '85003', lat: 33.4484, lng: -112.0740, year: 2020, make: 'Jeep', model: 'Grand Cherokee', priority: 'High', status: 'Located', eta: 22 },
  { id: 'v47', address: '200 N Central Ave', zip: '85004', lat: 33.4506, lng: -112.0768, year: 2022, make: 'Ram', model: '1500', priority: 'Medium', status: 'Located', eta: 32 },
  { id: 'v48', address: '300 E Jefferson St', zip: '85004', lat: 33.4472, lng: -112.0715, year: 2021, make: 'Dodge', model: 'Durango', priority: 'High', status: 'Located', eta: 24 },
  { id: 'v49', address: '400 S 1st St', zip: '85004', lat: 33.4494, lng: -112.0682, year: 2019, make: 'Chrysler', model: 'Pacifica', priority: 'Medium', status: 'Located', eta: 34 },
  { id: 'v50', address: '500 W Van Buren St', zip: '85003', lat: 33.4506, lng: -112.0649, year: 2023, make: 'Alfa Romeo', model: 'Stelvio', priority: 'Low', status: 'Stashed', eta: 42 }
];

const mockDrivers: Driver[] = [
  // Baltimore Downtown drivers
  {
    id: 'd1',
    name: 'John Smith',
    zoneId: 'baltimore-downtown',
    shift: 'Day',
    shiftGoal: 18,
    status: 'On Track',
    groups: [
      {
        id: 'g1',
        name: 'Group A',
        driverId: 'd1',
        vehicles: mockVehicles.slice(0, 3),
        lotTime: 240,
        stashTime: 200,
        timeSaved: 40
      }
    ]
  },
  {
    id: 'd2',
    name: 'Sarah Johnson',
    zoneId: 'baltimore-downtown',
    shift: 'Day',
    shiftGoal: 20,
    status: 'At Risk',
    groups: [
      {
        id: 'g2',
        name: 'Group B',
        driverId: 'd2',
        vehicles: mockVehicles.slice(3, 5),
        lotTime: 180,
        stashTime: 150,
        timeSaved: 30
      }
    ]
  },
  {
    id: 'd3',
    name: 'Mike Davis',
    zoneId: 'baltimore-downtown',
    shift: 'Night',
    shiftGoal: 16,
    status: 'On Track',
    groups: [
      {
        id: 'g3',
        name: 'Group C',
        driverId: 'd3',
        vehicles: mockVehicles.slice(0, 2),
        lotTime: 120,
        stashTime: 100,
        timeSaved: 20
      }
    ]
  },
  
  // Baltimore Harbor drivers
  {
    id: 'd4',
    name: 'Emily Rodriguez',
    zoneId: 'baltimore-harbor',
    shift: 'Day',
    shiftGoal: 16,
    status: 'Behind',
    groups: [
      {
        id: 'g4',
        name: 'Group D',
        driverId: 'd4',
        vehicles: mockVehicles.slice(5, 8),
        lotTime: 300,
        stashTime: 250,
        timeSaved: 50
      }
    ]
  },
  {
    id: 'd5',
    name: 'David Wilson',
    zoneId: 'baltimore-harbor',
    shift: 'Day',
    shiftGoal: 18,
    status: 'At Risk',
    groups: [
      {
        id: 'g5',
        name: 'Group E',
        driverId: 'd5',
        vehicles: mockVehicles.slice(8, 10),
        lotTime: 220,
        stashTime: 180,
        timeSaved: 40
      }
    ]
  },
  {
    id: 'd6',
    name: 'Lisa Chen',
    zoneId: 'baltimore-harbor',
    shift: 'Night',
    shiftGoal: 14,
    status: 'On Track',
    groups: [
      {
        id: 'g6',
        name: 'Group F',
        driverId: 'd6',
        vehicles: mockVehicles.slice(5, 7),
        lotTime: 140,
        stashTime: 120,
        timeSaved: 20
      }
    ]
  },
  
  // Baltimore West drivers
  {
    id: 'd7',
    name: 'Robert Taylor',
    zoneId: 'baltimore-west',
    shift: 'Day',
    shiftGoal: 20,
    status: 'On Track',
    groups: [
      {
        id: 'g7',
        name: 'Group G',
        driverId: 'd7',
        vehicles: mockVehicles.slice(10, 13),
        lotTime: 200,
        stashTime: 160,
        timeSaved: 40
      }
    ]
  },
  {
    id: 'd8',
    name: 'Jennifer Brown',
    zoneId: 'baltimore-west',
    shift: 'Day',
    shiftGoal: 18,
    status: 'At Risk',
    groups: [
      {
        id: 'g8',
        name: 'Group H',
        driverId: 'd8',
        vehicles: mockVehicles.slice(13, 15),
        lotTime: 280,
        stashTime: 230,
        timeSaved: 50
      }
    ]
  },
  
  // Baltimore East drivers
  {
    id: 'd9',
    name: 'Michael Garcia',
    zoneId: 'baltimore-east',
    shift: 'Day',
    shiftGoal: 16,
    status: 'On Track',
    groups: [
      {
        id: 'g9',
        name: 'Group I',
        driverId: 'd9',
        vehicles: mockVehicles.slice(15, 18),
        lotTime: 180,
        stashTime: 150,
        timeSaved: 30
      }
    ]
  },
  {
    id: 'd10',
    name: 'Amanda Martinez',
    zoneId: 'baltimore-east',
    shift: 'Day',
    shiftGoal: 18,
    status: 'Behind',
    groups: [
      {
        id: 'g10',
        name: 'Group J',
        driverId: 'd10',
        vehicles: mockVehicles.slice(18, 20),
        lotTime: 320,
        stashTime: 270,
        timeSaved: 50
      }
    ]
  },
  
  // Chicago Loop drivers
  {
    id: 'd11',
    name: 'Christopher Anderson',
    zoneId: 'chicago-loop',
    shift: 'Day',
    shiftGoal: 20,
    status: 'On Track',
    groups: [
      {
        id: 'g11',
        name: 'Group K',
        driverId: 'd11',
        vehicles: mockVehicles.slice(20, 23),
        lotTime: 190,
        stashTime: 160,
        timeSaved: 30
      }
    ]
  },
  {
    id: 'd12',
    name: 'Jessica Thompson',
    zoneId: 'chicago-loop',
    shift: 'Day',
    shiftGoal: 18,
    status: 'At Risk',
    groups: [
      {
        id: 'g12',
        name: 'Group L',
        driverId: 'd12',
        vehicles: mockVehicles.slice(23, 25),
        lotTime: 260,
        stashTime: 220,
        timeSaved: 40
      }
    ]
  },
  
  // Chicago North drivers
  {
    id: 'd13',
    name: 'Daniel White',
    zoneId: 'chicago-north',
    shift: 'Day',
    shiftGoal: 16,
    status: 'On Track',
    groups: [
      {
        id: 'g13',
        name: 'Group M',
        driverId: 'd13',
        vehicles: mockVehicles.slice(25, 28),
        lotTime: 170,
        stashTime: 140,
        timeSaved: 30
      }
    ]
  },
  {
    id: 'd14',
    name: 'Ashley Jackson',
    zoneId: 'chicago-north',
    shift: 'Day',
    shiftGoal: 18,
    status: 'Behind',
    groups: [
      {
        id: 'g14',
        name: 'Group N',
        driverId: 'd14',
        vehicles: mockVehicles.slice(28, 30),
        lotTime: 310,
        stashTime: 260,
        timeSaved: 50
      }
    ]
  },
  
  // Dallas Downtown drivers
  {
    id: 'd15',
    name: 'James Harris',
    zoneId: 'dallas-downtown',
    shift: 'Day',
    shiftGoal: 18,
    status: 'On Track',
    groups: [
      {
        id: 'g15',
        name: 'Group O',
        driverId: 'd15',
        vehicles: mockVehicles.slice(30, 33),
        lotTime: 200,
        stashTime: 170,
        timeSaved: 30
      }
    ]
  },
  {
    id: 'd16',
    name: 'Michelle Clark',
    zoneId: 'dallas-downtown',
    shift: 'Day',
    shiftGoal: 16,
    status: 'At Risk',
    groups: [
      {
        id: 'g16',
        name: 'Group P',
        driverId: 'd16',
        vehicles: mockVehicles.slice(33, 35),
        lotTime: 240,
        stashTime: 200,
        timeSaved: 40
      }
    ]
  },
  
  // Houston Downtown drivers
  {
    id: 'd17',
    name: 'Kevin Lewis',
    zoneId: 'houston-downtown',
    shift: 'Day',
    shiftGoal: 18,
    status: 'On Track',
    groups: [
      {
        id: 'g17',
        name: 'Group Q',
        driverId: 'd17',
        vehicles: mockVehicles.slice(35, 38),
        lotTime: 180,
        stashTime: 150,
        timeSaved: 30
      }
    ]
  },
  {
    id: 'd18',
    name: 'Nicole Walker',
    zoneId: 'houston-downtown',
    shift: 'Day',
    shiftGoal: 16,
    status: 'Behind',
    groups: [
      {
        id: 'g18',
        name: 'Group R',
        driverId: 'd18',
        vehicles: mockVehicles.slice(38, 40),
        lotTime: 300,
        stashTime: 250,
        timeSaved: 50
      }
    ]
  },
  
  // Los Angeles Downtown drivers
  {
    id: 'd19',
    name: 'Steven Hall',
    zoneId: 'la-downtown',
    shift: 'Day',
    shiftGoal: 20,
    status: 'On Track',
    groups: [
      {
        id: 'g19',
        name: 'Group S',
        driverId: 'd19',
        vehicles: mockVehicles.slice(40, 43),
        lotTime: 190,
        stashTime: 160,
        timeSaved: 30
      }
    ]
  },
  {
    id: 'd20',
    name: 'Rachel Allen',
    zoneId: 'la-downtown',
    shift: 'Day',
    shiftGoal: 18,
    status: 'At Risk',
    groups: [
      {
        id: 'g20',
        name: 'Group T',
        driverId: 'd20',
        vehicles: mockVehicles.slice(43, 45),
        lotTime: 270,
        stashTime: 230,
        timeSaved: 40
      }
    ]
  },
  
  // Phoenix Downtown drivers
  {
    id: 'd21',
    name: 'Mark Young',
    zoneId: 'phoenix-downtown',
    shift: 'Day',
    shiftGoal: 16,
    status: 'On Track',
    groups: [
      {
        id: 'g21',
        name: 'Group U',
        driverId: 'd21',
        vehicles: mockVehicles.slice(45, 48),
        lotTime: 170,
        stashTime: 140,
        timeSaved: 30
      }
    ]
  },
  {
    id: 'd22',
    name: 'Stephanie King',
    zoneId: 'phoenix-downtown',
    shift: 'Day',
    shiftGoal: 18,
    status: 'Behind',
    groups: [
      {
        id: 'g22',
        name: 'Group V',
        driverId: 'd22',
        vehicles: mockVehicles.slice(48, 50),
        lotTime: 320,
        stashTime: 270,
        timeSaved: 50
      }
    ]
  }
];

/**
 * Generate mock metrics for zones
 */
function generateMockMetrics(zones: Zone[], drivers: Driver[], vehicles: Vehicle[]): ZoneMetrics[] {
  return zones.map(zone => {
    const zoneDrivers = drivers.filter(d => d.zoneId === zone.id);
    
    // Update zone with its drivers
    zone.drivers = zoneDrivers;
    
    const baseMetrics = calculateZoneMetrics(zone, zoneDrivers);
    
    // Add some randomness to make it realistic
    const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
    const shiftUtilization = Math.min(baseMetrics.shiftUtilization * randomFactor, 120);
    
    const metrics: ZoneMetrics = {
      ...baseMetrics,
      shiftUtilization,
      usedHours: (shiftUtilization / 100) * baseMetrics.totalHours,
      status: shiftUtilization <= 80 ? 'On Track' : shiftUtilization <= 95 ? 'At Risk' : 'Behind',
      capacityFit: shiftUtilization <= 100,
      deficitHours: Math.max(0, shiftUtilization - 100) * baseMetrics.totalHours / 100,
      deficitVehicles: Math.ceil(Math.max(0, shiftUtilization - 100) * baseMetrics.totalHours / 100 / 0.5)
    };
    
    // Generate recommendations
    metrics.recommendations = generateRecommendations(metrics).map(rec => rec.text);
    
    return metrics;
  });
}

/**
 * Check if API is available
 */
function isApiAvailable(): boolean {
  return !!import.meta.env.VITE_API_BASE;
}

/**
 * Fetch dashboard data from API or mock
 */
export async function fetchDashboardData(filters: DashboardFilters): Promise<{
  markets: Market[];
  zones: Zone[];
  vehicles: Vehicle[];
  metrics: ZoneMetrics[];
}> {
  const startTime = Date.now();
  
  try {
    if (isApiAvailable()) {
      // Real API call would go here
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/dashboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } else {
      // Mock data fallback
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200)); // Simulate network delay
      
      const filteredZones = mockZones.filter(zone => {
        if (filters.market && zone.marketId !== filters.market) return false;
        if (filters.zones.length > 0 && !filters.zones.includes(zone.id)) return false;
        return true;
      });
      
      const filteredDrivers = mockDrivers.filter(driver => {
        if (!filteredZones.find(z => z.id === driver.zoneId)) return false;
        if (driver.shift !== filters.shift) return false;
        return true;
      });
      
      const filteredVehicles = mockVehicles.filter(vehicle => {
        return filteredZones.some(zone => 
          filteredDrivers.some(driver => 
            driver.zoneId === zone.id && 
            driver.groups.some(group => 
              group.vehicles.some(v => v.id === vehicle.id)
            )
          )
        );
      });
      
      const metrics = generateMockMetrics(filteredZones, filteredDrivers, filteredVehicles);
      
      return {
        markets: mockMarkets,
        zones: filteredZones,
        vehicles: filteredVehicles,
        metrics
      };
    }
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    
    // Return empty data structure on error
    return {
      markets: [],
      zones: [],
      vehicles: [],
      metrics: []
    };
  } finally {
    const duration = Date.now() - startTime;
    console.log(`Dashboard data fetch completed in ${duration}ms`);
  }
}

/**
 * Fetch specific zone data
 */
export async function fetchZoneData(zoneId: string, filters: DashboardFilters): Promise<ZoneMetrics | null> {
  try {
    const data = await fetchDashboardData(filters);
    return data.metrics.find(m => m.zoneId === zoneId) || null;
  } catch (error) {
    console.error(`Failed to fetch zone data for ${zoneId}:`, error);
    return null;
  }
}

/**
 * Staggered refresh for zones to avoid API spikes
 */
export function scheduleStaggeredRefresh(
  zoneIds: string[], 
  refreshFn: (zoneId: string) => Promise<void>,
  intervalMs: number = 5000
): () => void {
  const timeouts: NodeJS.Timeout[] = [];
  
  zoneIds.forEach((zoneId, index) => {
    const delay = index * intervalMs;
    const timeout = setTimeout(() => {
      refreshFn(zoneId).catch(console.error);
    }, delay);
    timeouts.push(timeout);
  });
  
  return () => {
    timeouts.forEach(clearTimeout);
  };
}
