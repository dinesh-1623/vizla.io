import { mockCars } from '@/data/mockCars';
import { DRIVERS } from '@/data/mockCars';

export type QueueState = 'to-dispatch' | 'dispatched' | 'stashed';

// Assignment map for cars - half unassigned (to-dispatch), quarter dispatched, quarter stashed
// This is a mutable module singleton that will be updated via UI interactions
export const ASSIGNMENTS: Record<string, QueueState> = {
  '1': 'to-dispatch',
  '2': 'dispatched',
  '3': 'stashed',
  '4': 'to-dispatch',
  '5': 'dispatched',
  '6': 'stashed',
  '7': 'to-dispatch',
  '8': 'dispatched',
  '9': 'stashed',
  '10': 'to-dispatch',
  '11': 'dispatched',
  '12': 'stashed',
  '13': 'to-dispatch',
  '14': 'dispatched',
  '15': 'stashed',
  '16': 'to-dispatch',
};

// Simple state versioning for React dependency tracking
let assignmentVersion = 0;

// Helper function to update assignments (for future UI mutations)
export const updateAssignment = (carId: string, newState: QueueState) => {
  ASSIGNMENTS[carId] = newState;
  assignmentVersion++;
  // Return version for components that need to track changes
  return assignmentVersion;
};

// Export version for components that need to track assignment changes
export const getAssignmentVersion = () => assignmentVersion;

// Test function to simulate UI mutations (for development/testing)
export const simulateAssignmentChange = () => {
  // Example: Move car '1' from 'to-dispatch' to 'dispatched'
  if (ASSIGNMENTS['1'] === 'to-dispatch') {
    ASSIGNMENTS['1'] = 'dispatched';
  } else {
    ASSIGNMENTS['1'] = 'to-dispatch';
  }
  assignmentVersion++;
  return assignmentVersion;
};

// Mock orders data
export const ORDERS = [
  { client: 'Client A', hasActiveOrder: true },
  { client: 'Client B', hasActiveOrder: false }, // Missing active order
  { client: 'Client C', hasActiveOrder: true },
  { client: 'Capital One', hasActiveOrder: false }, // Missing active order
  { client: 'Wells Fargo', hasActiveOrder: false }, // Missing active order
];

// Selector functions (pure functions, memo-friendly)
export const getCounts = () => {
  const assignments = Object.values(ASSIGNMENTS);
  return {
    toDispatch: assignments.filter(state => state === 'to-dispatch').length,
    dispatched: assignments.filter(state => state === 'dispatched').length,
    stashed: assignments.filter(state => state === 'stashed').length,
  };
};

export const getOrderConfirmationCount = () => {
  return ORDERS.filter(order => !order.hasActiveOrder).length;
};

export const getUniqueClients = () => {
  const clients = new Set(mockCars.map(car => car.client));
  return Array.from(clients).sort();
};

export const getUniqueZones = () => {
  const zones = new Set(mockCars.map(car => car.zone));
  return Array.from(zones).sort();
};

export const getCarsByQueue = (state: QueueState) => {
  return mockCars.filter(car => ASSIGNMENTS[car.id] === state);
};

export const getPendingOrderCount = () => {
  return mockCars.filter(car => car.pendingOrder).length;
};
