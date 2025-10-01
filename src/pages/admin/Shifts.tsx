import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Plus, Download, Filter, Search, Clock, MapPin, Users, Target } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import AppShell from '@/components/shell/AppShell';
import { ShiftManagementDrawer } from '@/components/shift/ShiftManagementDrawer';
import { ShiftCard } from '@/components/shift/ShiftCard';
import { CalendarStripe } from '@/components/shift/CalendarStripe';
import { ShiftFilters } from '@/components/shift/ShiftFilters';
import { 
  getShifts, 
  filterShifts, 
  getShiftsForDate 
} from '@/lib/shift/store';
import { 
  generateShiftCSV, 
  downloadCSV 
} from '@/lib/shift/utils';
import { MARKETS, ZONES, DRIVERS, generateMockShifts } from '@/lib/shift/seed';
import { getZonesByMarket } from '@/lib/shift/seed';
import { Shift, ShiftFilters as ShiftFiltersType } from '@/lib/shift/types';
import { calculateShiftProgress, formatDate } from '@/lib/shift/utils';

const Shifts: React.FC = () => {
  // State
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [filters, setFilters] = useState<ShiftFiltersType>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load shifts on mount
  useEffect(() => {
    const loadShifts = () => {
      setIsLoading(true);
      try {
        let loadedShifts = getShifts();
        
        // If no shifts exist, generate mock data
        if (loadedShifts.length === 0) {
          const mockShifts = generateMockShifts();
          mockShifts.forEach(shift => {
            // Save each mock shift to localStorage
            const { saveShift } = require('@/lib/shift/store');
            saveShift(shift);
          });
          loadedShifts = getShifts();
        }
        
        setShifts(loadedShifts);
      } catch (error) {
        console.error('Error loading shifts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadShifts();
  }, []);

  // Filter shifts based on current filters
  const filteredShifts = useMemo(() => {
    return filterShifts(shifts, filters);
  }, [shifts, filters]);

  // Get shifts for selected date
  const shiftsForSelectedDate = useMemo(() => {
    return getShiftsForDate(selectedDate);
  }, [selectedDate, shifts]);

  // Handle create new shift
  const handleCreateShift = () => {
    setEditingShift(null);
    setIsDrawerOpen(true);
  };

  // Handle edit shift
  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setIsDrawerOpen(true);
  };

  // Handle duplicate shift
  const handleDuplicateShift = (shift: Shift) => {
    const { duplicateShift } = require('@/lib/shift/store');
    try {
      const newShift = duplicateShift(shift.id);
      setShifts(getShifts());
    } catch (error) {
      console.error('Error duplicating shift:', error);
    }
  };

  // Handle delete shift
  const handleDeleteShift = (shiftId: string) => {
    const { removeShift } = require('@/lib/shift/store');
    if (confirm('Are you sure you want to delete this shift?')) {
      try {
        removeShift(shiftId);
        setShifts(getShifts());
      } catch (error) {
        console.error('Error deleting shift:', error);
      }
    }
  };

  // Handle drawer close
  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setEditingShift(null);
    setShifts(getShifts()); // Refresh shifts
  };

  // Handle CSV export
  const handleExportCSV = () => {
    try {
      // Replace IDs with names for better CSV readability
      const shiftsWithNames = filteredShifts.map(shift => {
        const market = MARKETS.find(m => m.id === shift.marketId);
        const zone = ZONES.find(z => z.id === shift.zoneId);
        const assignedDrivers = shift.assignedDriverIds
          .map(id => DRIVERS.find(d => d.id === id)?.name)
          .filter(Boolean)
          .join('; ');

        return {
          ...shift,
          marketName: market?.name || shift.marketId,
          zoneName: zone?.name || shift.zoneId,
          assignedDriverNames: assignedDrivers
        };
      });

      const csvContent = generateShiftCSV(shiftsWithNames);
      const filename = `shifts-export-${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csvContent, filename);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  // Handle today filter
  const handleTodayFilter = () => {
    const today = new Date();
    setFilters({
      startDate: today.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
  };

  // Handle calendar date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setFilters({
      startDate: date.toISOString().split('T')[0],
      endDate: date.toISOString().split('T')[0]
    });
  };

  if (isLoading) {
    return (
      <AppShell title="Shift Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-vizla-text-muted">Loading shifts...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Shift Management">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-vizla-text-primary">Shift Management</h1>
          <p className="text-sm text-vizla-text-muted mt-1">
            {filteredShifts.length} shift{filteredShifts.length !== 1 ? 's' : ''} found
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleTodayFilter}
            className="flex items-center gap-2 px-3 py-2 bg-vizla-glass text-vizla-text-secondary rounded-lg ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Today
          </button>
          
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-vizla-glass text-vizla-text-secondary rounded-lg ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          
          <button
            onClick={handleCreateShift}
            className="flex items-center gap-2 px-4 py-2 bg-vizla-brand-primary text-white rounded-lg hover:bg-vizla-brand-primary/80 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Shift
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <ShiftFilters
          filters={filters}
          onFiltersChange={setFilters}
          markets={MARKETS}
          zones={ZONES}
          drivers={DRIVERS}
        />
      </div>

      {/* Calendar Stripe */}
      <div className="mb-8">
        <CalendarStripe
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          shifts={shiftsForSelectedDate}
        />
      </div>

      {/* Shifts List */}
      {filteredShifts.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-vizla-glass rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-vizla-text-muted" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-vizla-text-primary mb-2">
                No shifts found
              </h3>
              <p className="text-vizla-text-muted mb-4">
                {Object.keys(filters).length > 0 
                  ? 'Try adjusting your filters to see more shifts.'
                  : 'Create your first shift to get started.'
                }
              </p>
              <button
                onClick={handleCreateShift}
                className="flex items-center gap-2 px-4 py-2 bg-vizla-brand-primary text-white rounded-lg hover:bg-vizla-brand-primary/80 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create Shift
              </button>
            </div>
          </div>
        </GlassCard>
      ) : (
        <div className="grid gap-4">
          {filteredShifts.map((shift) => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              onEdit={handleEditShift}
              onDuplicate={handleDuplicateShift}
              onDelete={handleDeleteShift}
              markets={MARKETS}
              zones={ZONES}
              drivers={DRIVERS}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Drawer */}
      {isDrawerOpen && (
        <ShiftManagementDrawer
          shift={editingShift}
          onClose={handleDrawerClose}
          markets={MARKETS}
          zones={ZONES}
          drivers={DRIVERS}
        />
      )}
    </AppShell>
  );
};

export default Shifts;