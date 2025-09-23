import { useState, useEffect } from 'react';
import { Assumptions } from '@/components/owner/AssumptionsDrawer';

const DEFAULT_ASSUMPTIONS: Assumptions = {
  hookTimeMin: 15,
  unloadTimeMin: 10,
  averageMph: 25,
  driverCostPerHour: 35,
  revenuePerTow: 150,
  avgMinPerTow: 45,
};

const STORAGE_KEY = 'route-assumptions';

export const useAssumptions = () => {
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load assumptions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate the stored data has all required fields
        if (
          typeof parsed.hookTimeMin === 'number' &&
          typeof parsed.unloadTimeMin === 'number' &&
          typeof parsed.averageMph === 'number' &&
          typeof parsed.driverCostPerHour === 'number' &&
          typeof parsed.revenuePerTow === 'number' &&
          typeof parsed.avgMinPerTow === 'number'
        ) {
          setAssumptions(parsed);
        }
      }
    } catch (error) {
      console.warn('Failed to load assumptions from localStorage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save assumptions to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(assumptions));
      } catch (error) {
        console.warn('Failed to save assumptions to localStorage:', error);
      }
    }
  }, [assumptions, isLoaded]);

  const updateAssumptions = (newAssumptions: Assumptions) => {
    setAssumptions(newAssumptions);
  };

  const resetAssumptions = () => {
    setAssumptions(DEFAULT_ASSUMPTIONS);
  };

  return {
    assumptions,
    updateAssumptions,
    resetAssumptions,
    isLoaded,
  };
};
