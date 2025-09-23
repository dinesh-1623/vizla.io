/**
 * Development-only testing hooks and utilities
 * These functions are only called in development mode
 */

import type { LocatedRow, BreakdownItem } from '@/types/dashboard';

/**
 * Assert no duplicate VINs in the dataset
 */
export function assertNoDuplicateVIN(rows: LocatedRow[]): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const vinMap = new Map<string, number>();
  const duplicates: string[] = [];
  
  for (const row of rows) {
    if (row.vin) {
      const count = vinMap.get(row.vin) || 0;
      vinMap.set(row.vin, count + 1);
      
      if (count > 0) {
        duplicates.push(row.vin);
      }
    }
  }
  
  if (duplicates.length > 0) {
    console.warn('🚨 Duplicate VINs found:', duplicates);
    console.warn('This could indicate data quality issues');
  } else {
    console.log('✅ No duplicate VINs found');
  }
}

/**
 * Assert that breakdown percentages sum correctly
 */
export function assertPercentTotals(groups: BreakdownItem[], tolerance = 1.5): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const totalPct = groups.reduce((sum, item) => sum + item.pct, 0);
  const expectedTotal = 100;
  const diff = Math.abs(totalPct - expectedTotal);
  
  if (diff > tolerance) {
    console.warn('🚨 Breakdown percentages do not sum to 100%');
    console.warn(`Total: ${totalPct.toFixed(1)}%, Expected: ${expectedTotal}%, Diff: ${diff.toFixed(1)}%`);
    console.warn('Groups:', groups);
  } else {
    console.log(`✅ Breakdown percentages sum correctly: ${totalPct.toFixed(1)}%`);
  }
}

/**
 * Validate coordinate ranges for US locations
 */
export function assertValidUSCoordinates(rows: LocatedRow[]): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const invalidCoords: LocatedRow[] = [];
  
  for (const row of rows) {
    // US coordinate ranges
    if (row.lat < 25 || row.lat > 50 || row.lon < -130 || row.lon > -65) {
      invalidCoords.push(row);
    }
  }
  
  if (invalidCoords.length > 0) {
    console.warn('🚨 Invalid US coordinates found:', invalidCoords.length, 'rows');
    console.warn('Sample invalid coordinates:', invalidCoords.slice(0, 3));
  } else {
    console.log('✅ All coordinates are within US ranges');
  }
}

/**
 * Check for data consistency issues
 */
export function assertDataConsistency(rows: LocatedRow[]): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const issues: string[] = [];
  
  // Check for missing required fields
  const missingClient = rows.filter(r => !r.client || r.client === 'Unknown').length;
  const missingCoords = rows.filter(r => r.lat === 0 && r.lon === 0).length;
  const missingAddress = rows.filter(r => !r.address || r.address === 'Unknown Location').length;
  
  if (missingClient > 0) issues.push(`${missingClient} rows missing client`);
  if (missingCoords > 0) issues.push(`${missingCoords} rows missing coordinates`);
  if (missingAddress > 0) issues.push(`${missingAddress} rows missing address`);
  
  // Check for unusual data patterns
  const emptyDrivers = rows.filter(r => !r.driver || r.driver.trim() === '').length;
  const gpsOnlyDrivers = rows.filter(r => r.driver === 'GPS').length;
  
  if (emptyDrivers > rows.length * 0.5) {
    issues.push(`High percentage of empty drivers: ${emptyDrivers}/${rows.length}`);
  }
  
  if (gpsOnlyDrivers > rows.length * 0.8) {
    issues.push(`High percentage of GPS-only drivers: ${gpsOnlyDrivers}/${rows.length}`);
  }
  
  if (issues.length > 0) {
    console.warn('🚨 Data consistency issues found:');
    issues.forEach(issue => console.warn(`  - ${issue}`));
  } else {
    console.log('✅ Data consistency checks passed');
  }
}

/**
 * Run all development assertions
 */
export function runDevAssertions(rows: LocatedRow[], groups: {
  clientBreakdown: BreakdownItem[];
  zoneBreakdown: BreakdownItem[];
  driverBreakdown: BreakdownItem[];
}): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.group('🔍 Development Data Validation');
  
  assertNoDuplicateVIN(rows);
  assertValidUSCoordinates(rows);
  assertDataConsistency(rows);
  assertPercentTotals(groups.clientBreakdown);
  assertPercentTotals(groups.zoneBreakdown);
  assertPercentTotals(groups.driverBreakdown);
  
  console.groupEnd();
}
