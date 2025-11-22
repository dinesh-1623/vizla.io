import { Zone, Driver, ShiftType } from './types';

export const mockDrivers: Driver[] = [
  // Baltimore Drivers
  { id: 'd1', name: 'John Smith', shiftHours: 12, goal: 8, usedHours: 6, towed: 5 },
  { id: 'd2', name: 'Sarah Johnson', shiftHours: 12, goal: 8, usedHours: 4, towed: 3 },
  { id: 'd3', name: 'Mike Wilson', shiftHours: 12, goal: 7, usedHours: 8, towed: 6 },
  { id: 'd4', name: 'Lisa Brown', shiftHours: 12, goal: 6, usedHours: 3, towed: 2 },
  { id: 'd5', name: 'David Lee', shiftHours: 12, goal: 8, usedHours: 7, towed: 5 },
  { id: 'd6', name: 'Amy Davis', shiftHours: 12, goal: 7, usedHours: 5, towed: 4 },
  
  // Chicago Drivers
  { id: 'd7', name: 'Robert Taylor', shiftHours: 12, goal: 9, usedHours: 6, towed: 7 },
  { id: 'd8', name: 'Jennifer Martinez', shiftHours: 12, goal: 8, usedHours: 4, towed: 3 },
  { id: 'd9', name: 'Chris Anderson', shiftHours: 12, goal: 7, usedHours: 9, towed: 6 },
  { id: 'd10', name: 'Michelle Garcia', shiftHours: 12, goal: 6, usedHours: 2, towed: 1 },
  { id: 'd11', name: 'Kevin Rodriguez', shiftHours: 12, goal: 8, usedHours: 7, towed: 5 },
  { id: 'd12', name: 'Stephanie Miller', shiftHours: 12, goal: 7, usedHours: 5, towed: 4 },
  
  // Dallas Drivers
  { id: 'd13', name: 'James Thompson', shiftHours: 12, goal: 8, usedHours: 6, towed: 5 },
  { id: 'd14', name: 'Angela White', shiftHours: 12, goal: 7, usedHours: 4, towed: 3 },
  { id: 'd15', name: 'Brian Harris', shiftHours: 12, goal: 6, usedHours: 8, towed: 5 },
  { id: 'd16', name: 'Nicole Clark', shiftHours: 12, goal: 8, usedHours: 3, towed: 2 },
  { id: 'd17', name: 'Daniel Lewis', shiftHours: 12, goal: 7, usedHours: 7, towed: 4 },
  { id: 'd18', name: 'Rebecca Walker', shiftHours: 12, goal: 6, usedHours: 5, towed: 3 },
  
  // Night Shift Drivers
  { id: 'd19', name: 'Tony Martinez', shiftHours: 12, goal: 6, usedHours: 4, towed: 3 },
  { id: 'd20', name: 'Karen Jackson', shiftHours: 12, goal: 5, usedHours: 3, towed: 2 },
  { id: 'd21', name: 'Steve Wright', shiftHours: 12, goal: 7, usedHours: 6, towed: 4 },
  { id: 'd22', name: 'Maria Lopez', shiftHours: 12, goal: 6, usedHours: 2, towed: 1 },
  { id: 'd23', name: 'Paul Hill', shiftHours: 12, goal: 5, usedHours: 5, towed: 3 },
  { id: 'd24', name: 'Sandra Young', shiftHours: 12, goal: 6, usedHours: 4, towed: 2 },
];

export const mockZones: Zone[] = [
  // Baltimore Zones
  {
    id: 'baltimore-downtown',
    name: 'Baltimore Downtown',
    market: 'Baltimore',
    shift: 'Day',
    drivers: mockDrivers.filter(d => ['d1', 'd2', 'd3'].includes(d.id)),
    locatedCount: 45,
    stashingBenefitMin: 15
  },
  {
    id: 'baltimore-harbor',
    name: 'Baltimore Harbor',
    market: 'Baltimore',
    shift: 'Day',
    drivers: mockDrivers.filter(d => ['d4', 'd5', 'd6'].includes(d.id)),
    locatedCount: 38,
    stashingBenefitMin: 12
  },
  {
    id: 'baltimore-west',
    name: 'Baltimore West',
    market: 'Baltimore',
    shift: 'Day',
    drivers: mockDrivers.filter(d => ['d1', 'd4'].includes(d.id)),
    locatedCount: 28,
    stashingBenefitMin: 8
  },
  
  // Chicago Zones
  {
    id: 'chicago-loop',
    name: 'Chicago Loop',
    market: 'Chicago',
    shift: 'Day',
    drivers: mockDrivers.filter(d => ['d7', 'd8', 'd9'].includes(d.id)),
    locatedCount: 52,
    stashingBenefitMin: 18
  },
  {
    id: 'chicago-north',
    name: 'Chicago North',
    market: 'Chicago',
    shift: 'Day',
    drivers: mockDrivers.filter(d => ['d10', 'd11', 'd12'].includes(d.id)),
    locatedCount: 41,
    stashingBenefitMin: 14
  },
  
  // Dallas Zones
  {
    id: 'dallas-downtown',
    name: 'Dallas Downtown',
    market: 'Dallas',
    shift: 'Day',
    drivers: mockDrivers.filter(d => ['d13', 'd14', 'd15'].includes(d.id)),
    locatedCount: 39,
    stashingBenefitMin: 11
  },
  {
    id: 'dallas-north',
    name: 'Dallas North',
    market: 'Dallas',
    shift: 'Day',
    drivers: mockDrivers.filter(d => ['d16', 'd17', 'd18'].includes(d.id)),
    locatedCount: 35,
    stashingBenefitMin: 9
  },
  
  // Night Shift Zones
  {
    id: 'baltimore-night',
    name: 'Baltimore Night',
    market: 'Baltimore',
    shift: 'Night',
    drivers: mockDrivers.filter(d => ['d19', 'd20'].includes(d.id)),
    locatedCount: 22,
    stashingBenefitMin: 6
  },
  {
    id: 'chicago-night',
    name: 'Chicago Night',
    market: 'Chicago',
    shift: 'Night',
    drivers: mockDrivers.filter(d => ['d21', 'd22'].includes(d.id)),
    locatedCount: 18,
    stashingBenefitMin: 5
  },
  {
    id: 'dallas-night',
    name: 'Dallas Night',
    market: 'Dallas',
    shift: 'Night',
    drivers: mockDrivers.filter(d => ['d23', 'd24'].includes(d.id)),
    locatedCount: 16,
    stashingBenefitMin: 4
  }
];

export const mockMarkets = [
  { id: 'all', name: 'All Markets' },
  { id: 'Baltimore', name: 'Baltimore' },
  { id: 'Chicago', name: 'Chicago' },
  { id: 'Dallas', name: 'Dallas' }
];

export const mockZoneOptions = mockZones.map(zone => ({
  id: zone.id,
  name: zone.name,
  market: zone.market,
  shift: zone.shift
}));