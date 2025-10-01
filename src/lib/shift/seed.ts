import { Market, Zone, Driver, Shift } from './types';

// Markets (6 markets)
export const MARKETS: Market[] = [
  { id: 'market-1', name: 'Baltimore Metro' },
  { id: 'market-2', name: 'Washington DC' },
  { id: 'market-3', name: 'Philadelphia' },
  { id: 'market-4', name: 'Richmond' },
  { id: 'market-5', name: 'Norfolk' },
  { id: 'market-6', name: 'Annapolis' }
];

// Zones (3-10 zones per market)
export const ZONES: Zone[] = [
  // Baltimore Metro (8 zones)
  { id: 'zone-1', marketId: 'market-1', name: 'Downtown Baltimore' },
  { id: 'zone-2', marketId: 'market-1', name: 'Inner Harbor' },
  { id: 'zone-3', marketId: 'market-1', name: 'Fells Point' },
  { id: 'zone-4', marketId: 'market-1', name: 'Canton' },
  { id: 'zone-5', marketId: 'market-1', name: 'Federal Hill' },
  { id: 'zone-6', marketId: 'market-1', name: 'Mount Vernon' },
  { id: 'zone-7', marketId: 'market-1', name: 'Charles Village' },
  { id: 'zone-8', marketId: 'market-1', name: 'Hampden' },

  // Washington DC (6 zones)
  { id: 'zone-9', marketId: 'market-2', name: 'Capitol Hill' },
  { id: 'zone-10', marketId: 'market-2', name: 'Georgetown' },
  { id: 'zone-11', marketId: 'market-2', name: 'Dupont Circle' },
  { id: 'zone-12', marketId: 'market-2', name: 'Adams Morgan' },
  { id: 'zone-13', marketId: 'market-2', name: 'Logan Circle' },
  { id: 'zone-14', marketId: 'market-2', name: 'Shaw' },

  // Philadelphia (7 zones)
  { id: 'zone-15', marketId: 'market-3', name: 'Center City' },
  { id: 'zone-16', marketId: 'market-3', name: 'Old City' },
  { id: 'zone-17', marketId: 'market-3', name: 'Society Hill' },
  { id: 'zone-18', marketId: 'market-3', name: 'Rittenhouse Square' },
  { id: 'zone-19', marketId: 'market-3', name: 'University City' },
  { id: 'zone-20', marketId: 'market-3', name: 'Fishtown' },
  { id: 'zone-21', marketId: 'market-3', name: 'Northern Liberties' },

  // Richmond (5 zones)
  { id: 'zone-22', marketId: 'market-4', name: 'Downtown Richmond' },
  { id: 'zone-23', marketId: 'market-4', name: 'Fan District' },
  { id: 'zone-24', marketId: 'market-4', name: 'Shockoe Bottom' },
  { id: 'zone-25', marketId: 'market-4', name: 'Carytown' },
  { id: 'zone-26', marketId: 'market-4', name: 'Church Hill' },

  // Norfolk (4 zones)
  { id: 'zone-27', marketId: 'market-5', name: 'Downtown Norfolk' },
  { id: 'zone-28', marketId: 'market-5', name: 'Ghent' },
  { id: 'zone-29', marketId: 'market-5', name: 'Ocean View' },
  { id: 'zone-30', marketId: 'market-5', name: 'Colonial Place' },

  // Annapolis (3 zones)
  { id: 'zone-31', marketId: 'market-6', name: 'Downtown Annapolis' },
  { id: 'zone-32', marketId: 'market-6', name: 'Eastport' },
  { id: 'zone-33', marketId: 'market-6', name: 'West Annapolis' }
];

// Drivers (10 drivers)
export const DRIVERS: Driver[] = [
  { id: 'driver-1', name: 'Mike Rodriguez', shiftType: 'Day', homeBase: 'Baltimore' },
  { id: 'driver-2', name: 'Sarah Johnson', shiftType: 'Night', homeBase: 'Washington DC' },
  { id: 'driver-3', name: 'David Chen', shiftType: 'Day', homeBase: 'Philadelphia' },
  { id: 'driver-4', name: 'Lisa Thompson', shiftType: 'Night', homeBase: 'Richmond' },
  { id: 'driver-5', name: 'James Williams', shiftType: 'Day', homeBase: 'Norfolk' },
  { id: 'driver-6', name: 'Patricia Davis', shiftType: 'Night', homeBase: 'Annapolis' },
  { id: 'driver-7', name: 'Robert Miller', shiftType: 'Day', homeBase: 'Baltimore' },
  { id: 'driver-8', name: 'Jennifer Wilson', shiftType: 'Night', homeBase: 'Washington DC' },
  { id: 'driver-9', name: 'Michael Brown', shiftType: 'Day', homeBase: 'Philadelphia' },
  { id: 'driver-10', name: 'Amanda Garcia', shiftType: 'Night', homeBase: 'Richmond' }
];

// Storage lots (common across markets)
export const STORAGE_LOTS = [
  '4221 Curtis Ave, Baltimore, MD 21226',
  '751 W Patapsco Ave, Halethorpe, MD 21227',
  '3400 E Lombard St, Baltimore, MD 21224',
  '1500 S Clinton St, Baltimore, MD 21224',
  '2800 S Hanover St, Baltimore, MD 21225'
];

// Helper function to generate mock shifts
export function generateMockShifts(): Shift[] {
  const now = new Date();
  const shifts: Shift[] = [];

  // Generate shifts for the next 7 days
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    
    // Day shift (6 AM - 2 PM)
    const dayStart = new Date(date);
    dayStart.setHours(6, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(14, 0, 0, 0);
    
    shifts.push({
      id: `shift-${dayOffset}-day`,
      marketId: 'market-1', // Baltimore Metro
      zoneId: 'zone-1', // Downtown Baltimore
      startISO: dayStart.toISOString(),
      endISO: dayEnd.toISOString(),
      lengthMin: 480, // 8 hours
      shiftType: 'Day',
      capacity: 3,
      goalTows: 15,
      startingPoint: {
        type: 'Fixed',
        address: '100 E Pratt St, Baltimore, MD 21202'
      },
      storageLot: STORAGE_LOTS[0],
      assignedDriverIds: ['driver-1', 'driver-3', 'driver-5'],
      notes: `Day shift for ${date.toLocaleDateString()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Night shift (6 PM - 2 AM next day)
    const nightStart = new Date(date);
    nightStart.setHours(18, 0, 0, 0);
    const nightEnd = new Date(date);
    nightEnd.setDate(nightEnd.getDate() + 1);
    nightEnd.setHours(2, 0, 0, 0);
    
    shifts.push({
      id: `shift-${dayOffset}-night`,
      marketId: 'market-1', // Baltimore Metro
      zoneId: 'zone-2', // Inner Harbor
      startISO: nightStart.toISOString(),
      endISO: nightEnd.toISOString(),
      lengthMin: 480, // 8 hours
      shiftType: 'Night',
      capacity: 2,
      goalTows: 12,
      startingPoint: {
        type: 'Not Fixed'
      },
      storageLot: STORAGE_LOTS[1],
      assignedDriverIds: ['driver-2', 'driver-4'],
      notes: `Night shift for ${date.toLocaleDateString()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  return shifts;
}

// Get zones by market
export function getZonesByMarket(marketId: string): Zone[] {
  return ZONES.filter(zone => zone.marketId === marketId);
}

// Get drivers by shift type
export function getDriversByShiftType(shiftType: 'Day' | 'Night'): Driver[] {
  return DRIVERS.filter(driver => !driver.shiftType || driver.shiftType === shiftType);
}
