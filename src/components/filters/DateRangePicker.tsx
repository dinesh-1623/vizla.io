import React, { useState, useRef, useEffect } from 'react';
import { Calendar, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRange, DatePreset, getPresetOptions, normalizeRange, formatRange, getRangePreset } from '@/lib/date/range';
import { useGlobalFilters } from '@/lib/hooks/useGlobalFilters';

interface DateRangePickerProps {
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ className }) => {
  const { dateRange, includeMissingDates, setDateRange, setIncludeMissingDates } = useGlobalFilters();
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange>(dateRange);
  const [tempIncludeMissing, setTempIncludeMissing] = useState(includeMissingDates);
  const [selectedPreset, setSelectedPreset] = useState<DatePreset | null>(null);
  
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Update temp values when props change
  useEffect(() => {
    setTempRange(dateRange);
    setTempIncludeMissing(includeMissingDates);
    
    // Detect current preset
    const preset = getRangePreset(dateRange);
    setSelectedPreset(preset);
  }, [dateRange, includeMissingDates]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handlePresetClick = (preset: DatePreset) => {
    if (preset === 'custom') {
      setSelectedPreset('custom');
      return;
    }

    const presets = getPresetOptions();
    const presetOption = presets.find(p => p.key === preset);
    if (presetOption) {
      setTempRange(presetOption.range);
      setSelectedPreset(preset);
    }
  };

  const handleApply = () => {
    setDateRange(normalizeRange(tempRange));
    setIncludeMissingDates(tempIncludeMissing);
    setIsOpen(false);
  };

  const handleClear = () => {
    const today = new Date();
    const todayRange = {
      from: today.toISOString(),
      to: today.toISOString(),
    };
    setTempRange(normalizeRange(todayRange));
    setTempIncludeMissing(true);
    setSelectedPreset('today');
  };

  const handleFromDateChange = (value: string) => {
    const fromDate = value ? new Date(value) : new Date();
    setTempRange(prev => ({
      ...prev,
      from: fromDate.toISOString(),
    }));
    setSelectedPreset('custom');
  };

  const handleToDateChange = (value: string) => {
    const toDate = value ? new Date(value) : new Date();
    setTempRange(prev => ({
      ...prev,
      to: toDate.toISOString(),
    }));
    setSelectedPreset('custom');
  };

  const presets = getPresetOptions();
  const displayLabel = selectedPreset && selectedPreset !== 'custom' 
    ? presets.find(p => p.key === selectedPreset)?.label || 'Custom Range'
    : formatRange(tempRange);

  return (
    <div className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder',
          'hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors',
          'text-sm font-medium text-vizla-text-secondary'
        )}
        aria-label="Select date range"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Calendar className="w-4 h-4" />
        <span>Date: {displayLabel}</span>
        <X className="w-3 h-3" />
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Date range picker"
          className={cn(
            'absolute top-full left-0 mt-2 w-96 z-50',
            'bg-vizla-elev1 backdrop-blur-md rounded-xl shadow-2xl',
            'ring-1 ring-vizla-glassBorder border border-vizla-borderSubtle',
            'p-4 space-y-4'
          )}
        >
          {/* Presets */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-vizla-text-primary">Quick Presets</h3>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => handlePresetClick(preset.key)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    'focus-visible:ring-2 focus-visible:ring-vizla-ring-focus',
                    selectedPreset === preset.key
                      ? 'bg-vizla-brand-primary text-vizla-text-primary'
                      : 'bg-vizla-glass hover:bg-vizla-glassElev text-vizla-text-secondary'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Inputs */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-vizla-text-primary">Custom Range</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="from-date" className="block text-xs font-medium text-vizla-text-muted uppercase tracking-wider mb-1">
                  From
                </label>
                <input
                  id="from-date"
                  type="date"
                  value={tempRange.from ? new Date(tempRange.from).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFromDateChange(e.target.value)}
                  className={cn(
                    'w-full bg-vizla-glass text-vizla-text-primary ring-1 ring-vizla-glassBorder rounded-lg px-3 py-2 text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-vizla-ring-focus transition-all'
                  )}
                />
              </div>
              
              <div>
                <label htmlFor="to-date" className="block text-xs font-medium text-vizla-text-muted uppercase tracking-wider mb-1">
                  To
                </label>
                <input
                  id="to-date"
                  type="date"
                  value={tempRange.to ? new Date(tempRange.to).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleToDateChange(e.target.value)}
                  className={cn(
                    'w-full bg-vizla-glass text-vizla-text-primary ring-1 ring-vizla-glassBorder rounded-lg px-3 py-2 text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-vizla-ring-focus transition-all'
                  )}
                />
              </div>
            </div>
          </div>

          {/* Include Missing Dates */}
          <div className="flex items-center gap-3">
            <input
              id="include-missing"
              type="checkbox"
              checked={tempIncludeMissing}
              onChange={(e) => setTempIncludeMissing(e.target.checked)}
              className={cn(
                'w-4 h-4 rounded border-vizla-glassBorder text-vizla-brand-primary',
                'focus:ring-2 focus:ring-vizla-ring-focus'
              )}
            />
            <label htmlFor="include-missing" className="text-sm text-vizla-text-secondary">
              Include items with missing dates
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-vizla-borderSubtle">
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-sm font-medium text-vizla-text-muted hover:text-vizla-text-secondary transition-colors"
            >
              Clear
            </button>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium text-vizla-text-secondary hover:bg-vizla-glassElev transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-vizla-brand-primary text-vizla-text-primary text-sm font-medium hover:bg-vizla-brand-primary/80 transition-colors"
              >
                <Check className="w-4 h-4" />
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
