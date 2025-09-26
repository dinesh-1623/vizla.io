import { useState, useEffect } from 'react';
import { loadTowCars, assignCarsToWeek, getTodayDayName, TowCar, DayAssignment } from '@/lib/data/driverSource';

export function useTowCars() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dayAssignments, setDayAssignments] = useState<DayAssignment[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayAssignment['day']>('Friday');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const cars = await loadTowCars();
      const assignments = assignCarsToWeek(cars);
      
      setDayAssignments(assignments);
      
      // Set today as default selected day
      const today = getTodayDayName();
      setSelectedDay(today);
      
      console.log(`✅ Loaded ${cars.length} cars across ${assignments.length} days`);
    } catch (err) {
      console.error('❌ Error loading tow cars:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const getCarsForDay = (day: DayAssignment['day']): TowCar[] => {
    const assignment = dayAssignments.find(a => a.day === day);
    return assignment?.cars || [];
  };

  const getSelectedDayCars = (): TowCar[] => {
    return getCarsForDay(selectedDay);
  };

  return {
    isLoading,
    error,
    dayAssignments,
    selectedDay,
    setSelectedDay,
    getCarsForDay,
    getSelectedDayCars,
    reload: loadData
  };
}
