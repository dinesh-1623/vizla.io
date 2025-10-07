import { assignVehiclesToDrivers } from './engine';
import { generateTestVehicles, mockDrivers } from './mockData';

/**
 * Performance test for the Assignment Engine
 * Tests with 200 vehicles to ensure <200ms processing time
 */
export function runPerformanceTest(): Promise<{
  success: boolean;
  processingTimeMs: number;
  vehicleCount: number;
  driverCount: number;
  assignedCount: number;
  unassignedCount: number;
}> {
  return new Promise((resolve) => {
    console.log('🧪 Running Assignment Engine Performance Test...');
    
    const testVehicles = generateTestVehicles(200);
    const testDrivers = mockDrivers;
    
    console.log(`📊 Test Setup: ${testVehicles.length} vehicles, ${testDrivers.length} drivers`);
    
    const startTime = performance.now();
    
    try {
      const result = assignVehiclesToDrivers(testVehicles, testDrivers);
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      const success = processingTime < 200;
      
      console.log(`⏱️ Performance Test Results:`);
      console.log(`   Processing Time: ${processingTime.toFixed(2)}ms`);
      console.log(`   Target: <200ms`);
      console.log(`   Status: ${success ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   Vehicles: ${result.assignmentSummary.totalVehicles}`);
      console.log(`   Assigned: ${result.assignmentSummary.assignedCount}`);
      console.log(`   Unassigned: ${result.assignmentSummary.unassignedCount}`);
      console.log(`   Zone Matches: ${result.assignmentSummary.zoneMatches}`);
      console.log(`   Average Distance: ${result.assignmentSummary.averageDistanceKm.toFixed(2)}km`);
      
      resolve({
        success,
        processingTimeMs: Math.round(processingTime),
        vehicleCount: testVehicles.length,
        driverCount: testDrivers.length,
        assignedCount: result.assignmentSummary.assignedCount,
        unassignedCount: result.assignmentSummary.unassignedCount
      });
      
    } catch (error) {
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      console.error('❌ Performance test failed:', error);
      
      resolve({
        success: false,
        processingTimeMs: Math.round(processingTime),
        vehicleCount: testVehicles.length,
        driverCount: testDrivers.length,
        assignedCount: 0,
        unassignedCount: testVehicles.length
      });
    }
  });
}

/**
 * Run multiple performance tests to ensure consistency
 */
export async function runConsistencyTest(iterations: number = 5): Promise<{
  averageTimeMs: number;
  maxTimeMs: number;
  minTimeMs: number;
  allPassed: boolean;
  results: Array<{ processingTimeMs: number; success: boolean }>;
}> {
  console.log(`🔄 Running ${iterations} consistency tests...`);
  
  const results: Array<{ processingTimeMs: number; success: boolean }> = [];
  
  for (let i = 0; i < iterations; i++) {
    console.log(`   Test ${i + 1}/${iterations}...`);
    const result = await runPerformanceTest();
    results.push({
      processingTimeMs: result.processingTimeMs,
      success: result.success
    });
  }
  
  const times = results.map(r => r.processingTimeMs);
  const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);
  const allPassed = results.every(r => r.success);
  
  console.log(`📈 Consistency Test Results:`);
  console.log(`   Average Time: ${averageTime.toFixed(2)}ms`);
  console.log(`   Max Time: ${maxTime}ms`);
  console.log(`   Min Time: ${minTime}ms`);
  console.log(`   All Tests Passed: ${allPassed ? '✅ YES' : '❌ NO'}`);
  
  return {
    averageTimeMs: Math.round(averageTime),
    maxTimeMs: maxTime,
    minTimeMs: minTime,
    allPassed,
    results
  };
}
