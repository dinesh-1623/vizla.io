import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  toISODateInTZ,
  parseISODate,
  isWithinRange,
  getTodayISODate,
  getMonthName,
  getYear,
  addDays,
  addMonths,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  isSameDay,
  getDaysInMonth,
  getWeekdayLabels,
  getDateRange,
  getTodayInTZ
} from '@/lib/date';

interface CalendarPopoverProps {
  selectedDate: string | null;
  onDateSelect: (date: string | null) => void;
  dataCounts?: Record<string, number>; // ISO date -> count mapping
  className?: string;
}

export const CalendarPopover: React.FC<CalendarPopoverProps> = ({
  selectedDate,
  onDateSelect,
  dataCounts = {},
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (selectedDate) {
      return parseISODate(selectedDate);
    }
    return getTodayInTZ();
  });
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  const { min, max } = getDateRange();
  const minDate = parseISODate(min);
  const maxDate = parseISODate(max);
  const today = getTodayInTZ();
  const todayISO = getTodayISODate();

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'Escape':
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (focusedDate) {
          const newDate = addDays(focusedDate, -1);
          if (isWithinRange(newDate)) {
            setFocusedDate(newDate);
          }
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (focusedDate) {
          const newDate = addDays(focusedDate, 1);
          if (isWithinRange(newDate)) {
            setFocusedDate(newDate);
          }
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (focusedDate) {
          const newDate = addDays(focusedDate, -7);
          if (isWithinRange(newDate)) {
            setFocusedDate(newDate);
          }
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (focusedDate) {
          const newDate = addDays(focusedDate, 7);
          if (isWithinRange(newDate)) {
            setFocusedDate(newDate);
          }
        }
        break;
      case 'PageUp':
        event.preventDefault();
        const prevMonth = addMonths(currentMonth, -1);
        if (prevMonth >= minDate) {
          setCurrentMonth(prevMonth);
        }
        break;
      case 'PageDown':
        event.preventDefault();
        const nextMonth = addMonths(currentMonth, 1);
        if (nextMonth <= maxDate) {
          setCurrentMonth(nextMonth);
        }
        break;
      case 'Home':
        event.preventDefault();
        if (focusedDate) {
          const startOfWeek = new Date(focusedDate);
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday
          if (isWithinRange(startOfWeek)) {
            setFocusedDate(startOfWeek);
          }
        }
        break;
      case 'End':
        event.preventDefault();
        if (focusedDate) {
          const endOfWeek = new Date(focusedDate);
          endOfWeek.setDate(endOfWeek.getDate() - endOfWeek.getDay() + 7); // Sunday
          if (isWithinRange(endOfWeek)) {
            setFocusedDate(endOfWeek);
          }
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedDate) {
          const dateISO = toISODateInTZ(focusedDate);
          onDateSelect(dateISO);
          setIsOpen(false);
          buttonRef.current?.focus();
        }
        break;
    }
  };

  const handleDateClick = (date: Date) => {
    const dateISO = toISODateInTZ(date);
    onDateSelect(dateISO);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const handlePrevMonth = () => {
    const prevMonth = addMonths(currentMonth, -1);
    if (prevMonth >= minDate) {
      setCurrentMonth(prevMonth);
    }
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1);
    if (nextMonth <= maxDate) {
      setCurrentMonth(nextMonth);
    }
  };

  const getCalendarDays = () => {
    const firstDay = getFirstDayOfMonth(currentMonth);
    const lastDay = getLastDayOfMonth(currentMonth);
    
    // Start from Monday of the week containing the first day
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday = 1
    startDate.setDate(firstDay.getDate() + mondayOffset);
    
    const days: Date[] = [];
    const currentDate = new Date(startDate);
    
    // Generate 42 days (6 weeks) to fill the calendar grid
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = getCalendarDays();
  const weekdayLabels = getWeekdayLabels();

  return (
    <div className={cn("relative", className)}>
      {/* Calendar Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-2 h-9 px-3 rounded-full",
          "bg-white/5 backdrop-blur-md ring-1 ring-white/10",
          "text-sm font-medium text-vizla-text-secondary",
          "hover:bg-white/10 hover:text-vizla-text-primary",
          "focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none",
          "transition-all duration-200"
        )}
        aria-label="Choose date"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Calendar className="w-4 h-4" />
        <span>Calendar</span>
      </button>

      {/* Calendar Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Choose date"
          className={cn(
            "absolute top-full right-0 mt-2 z-50",
            "bg-slate-900/95 backdrop-blur-md ring-1 ring-slate-700/50 rounded-2xl p-4",
            "min-w-[300px] shadow-2xl border border-slate-800/50"
          )}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handlePrevMonth}
              disabled={addMonths(currentMonth, -1) < minDate}
              className={cn(
                "p-2 rounded-lg transition-colors",
                "hover:bg-slate-700/50 focus-visible:ring-2 focus-visible:ring-cyan-400",
                "disabled:opacity-30 disabled:cursor-not-allowed"
              )}
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5 text-slate-300" />
            </button>

            <h3 className="text-lg font-bold text-white">
              {getMonthName(currentMonth)} {getYear(currentMonth)}
            </h3>

            <button
              onClick={handleNextMonth}
              disabled={addMonths(currentMonth, 1) > maxDate}
              className={cn(
                "p-2 rounded-lg transition-colors",
                "hover:bg-slate-700/50 focus-visible:ring-2 focus-visible:ring-cyan-400",
                "disabled:opacity-30 disabled:cursor-not-allowed"
              )}
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {weekdayLabels.map((day) => (
              <div
                key={day}
                className="text-sm font-semibold text-slate-300 text-center py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              const dateISO = toISODateInTZ(date);
              const isInRange = isWithinRange(date);
              const isSelected = selectedDate === dateISO;
              const isToday = dateISO === todayISO;
              const hasData = dataCounts[dateISO] > 0;
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
              const isFocused = focusedDate && isSameDay(date, focusedDate);

              return (
                <button
                  key={index}
                  onClick={() => isInRange && handleDateClick(date)}
                  onFocus={() => setFocusedDate(date)}
                  className={cn(
                    "relative w-10 h-10 rounded-lg text-sm font-semibold transition-all",
                    "focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none",
                    {
                      // Default state
                      "text-slate-500": !isCurrentMonth || !isInRange,
                      "text-slate-200": isCurrentMonth && isInRange && !isSelected,
                      "cursor-not-allowed": !isInRange,
                      "cursor-pointer": isInRange,
                      
                      // Hover state
                      "hover:bg-slate-700/50": isInRange && !isSelected,
                      
                      // Selected state
                      "bg-cyan-500 text-white ring-2 ring-cyan-400": isSelected,
                      
                      // Today state
                      "ring-2 ring-dashed ring-cyan-300 bg-slate-800/50": isToday && !isSelected,
                      
                      // Focused state
                      "bg-slate-700/50": isFocused && !isSelected,
                    }
                  )}
                  disabled={!isInRange}
                  aria-pressed={isSelected}
                  aria-label={`${dateISO}${hasData ? `, ${dataCounts[dateISO]} items` : ''}`}
                >
                  {date.getDate()}
                  
                  {/* Data indicator dot */}
                  {hasData && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-sm" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
