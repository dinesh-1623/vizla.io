import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAvailableDates, getTodayDate, getMostRecentDate } from '@/data/dateTabMap';

interface DatePickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onDateChange,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedDate, setFocusedDate] = useState(selectedDate);
  const containerRef = useRef<HTMLDivElement>(null);
  const availableDates = getAvailableDates();
  const today = getTodayDate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        navigateDate(-1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        navigateDate(1);
        break;
      case 'Enter':
        event.preventDefault();
        onDateChange(focusedDate);
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const navigateDate = (direction: number) => {
    const currentIndex = availableDates.indexOf(focusedDate);
    if (currentIndex !== -1) {
      const newIndex = Math.max(0, Math.min(availableDates.length - 1, currentIndex + direction));
      setFocusedDate(availableDates[newIndex]);
    }
  };

  const formatDisplayDate = (date: string) => {
    try {
      const dateObj = new Date(date + 'T00:00:00');
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return date;
    }
  };

  const formatFullDate = (date: string) => {
    try {
      const dateObj = new Date(date + 'T00:00:00');
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return date;
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Date Picker Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder",
          "hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors",
          "text-left w-full"
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Selected date: ${formatFullDate(selectedDate)}`}
      >
        <Calendar className="w-4 h-4 text-vizla-text-muted flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-vizla-text-primary">
            {formatDisplayDate(selectedDate)}
          </div>
          <div className="text-xs text-vizla-text-muted">
            {selectedDate === today ? 'Today' : availableDates.indexOf(selectedDate) === 0 ? 'Most Recent' : ''}
          </div>
        </div>
        <ChevronLeft className="w-3 h-3 text-vizla-text-muted" />
        <ChevronRight className="w-3 h-3 text-vizla-text-muted" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          <div className="bg-vizla-elev1 backdrop-blur-md ring-1 ring-vizla-glassBorder rounded-xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-vizla-borderSubtle">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-vizla-text-primary">
                  Select Date
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-vizla-text-muted hover:text-vizla-text-secondary transition-colors"
                  aria-label="Close date picker"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Date List */}
            <div className="max-h-64 overflow-y-auto">
              {availableDates.map((date) => {
                const isSelected = date === selectedDate;
                const isFocused = date === focusedDate;
                const isToday = date === today;

                return (
                  <button
                    key={date}
                    onClick={() => {
                      onDateChange(date);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setFocusedDate(date)}
                    className={cn(
                      "w-full px-4 py-3 text-left transition-colors",
                      "hover:bg-vizla-glassElev focus-visible:bg-vizla-glassElev",
                      "focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none",
                      isSelected && "bg-vizla-brand-primary/20",
                      isFocused && !isSelected && "bg-vizla-glassElev"
                    )}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-vizla-text-primary">
                          {formatDisplayDate(date)}
                        </div>
                        <div className="text-xs text-vizla-text-muted">
                          {formatFullDate(date)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isToday && (
                          <span className="text-xs px-2 py-1 rounded-full bg-vizla-brand-primary/20 text-vizla-brand-primary">
                            Today
                          </span>
                        )}
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-vizla-brand-primary" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-vizla-borderSubtle">
              <div className="text-xs text-vizla-text-muted text-center">
                Use ← → arrows to navigate, Enter to select
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
