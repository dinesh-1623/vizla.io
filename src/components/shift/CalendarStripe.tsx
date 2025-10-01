import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Shift } from '@/lib/shift/types';
import { formatDate, getShiftTypeColorClass } from '@/lib/shift/utils';

interface CalendarStripeProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  shifts: Shift[];
}

export const CalendarStripe: React.FC<CalendarStripeProps> = ({
  selectedDate,
  onDateSelect,
  shifts
}) => {
  const today = new Date();
  
  // Get the current month
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  
  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Get days to show (including some from previous/next month for full weeks)
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay()); // Start from Sunday
  
  const endDate = new Date(lastDayOfMonth);
  endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay())); // End on Saturday
  
  // Generate array of dates to display
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Navigate to previous month
  const handlePreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(currentMonth - 1);
    onDateSelect(newDate);
  };
  
  // Navigate to next month
  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(currentMonth + 1);
    onDateSelect(newDate);
  };
  
  // Get shifts for a specific date
  const getShiftsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.startISO).toISOString().split('T')[0];
      return shiftDate === dateStr;
    });
  };
  
  // Check if date is today
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };
  
  // Check if date is selected
  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };
  
  // Check if date is in current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth;
  };
  
  return (
    <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
      <div className="p-4">
        {/* Month Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePreviousMonth}
            className="p-2 rounded-lg bg-vizla-glass text-vizla-text-secondary hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <h2 className="text-lg font-semibold text-vizla-text-primary">
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg bg-vizla-glass text-vizla-text-secondary hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-vizla-text-muted py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {dates.map((date, index) => {
            const dateShifts = getShiftsForDate(date);
            const dayOfMonth = date.getDate();
            
            return (
              <button
                key={index}
                onClick={() => onDateSelect(date)}
                className={`
                  relative p-2 rounded-lg text-sm transition-colors focus-visible:ring-2 focus-visible:ring-vizla-ring-focus
                  ${isCurrentMonth(date) ? 'text-vizla-text-primary' : 'text-vizla-text-muted'}
                  ${isToday(date) ? 'bg-vizla-brand-primary/20 ring-1 ring-vizla-brand-primary/30' : ''}
                  ${isSelected(date) ? 'bg-vizla-glassElev ring-1 ring-vizla-glassBorder' : 'hover:bg-vizla-glass'}
                `}
              >
                <div className="text-center">
                  <div className="font-medium">{dayOfMonth}</div>
                  
                  {/* Shift indicators */}
                  {dateShifts.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {dateShifts.slice(0, 3).map((shift, shiftIndex) => (
                        <div
                          key={shiftIndex}
                          className={`w-full h-1 rounded-full ${getShiftTypeColorClass(shift.shiftType)}`}
                          title={`${shift.shiftType} shift: ${formatDate(shift.startISO)}`}
                        />
                      ))}
                      {dateShifts.length > 3 && (
                        <div className="text-xs text-vizla-text-muted">
                          +{dateShifts.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-vizla-glassBorder">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-1 bg-yellow-500/20 rounded-full" />
            <span className="text-vizla-text-muted">Day</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-1 bg-blue-500/20 rounded-full" />
            <span className="text-vizla-text-muted">Night</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
