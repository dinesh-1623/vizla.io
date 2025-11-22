/**
 * Premium Date Range Picker
 * 
 * Clean, minimal date range selection component
 */

import React from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  value?: { from: Date; to: Date };
  onChange?: (range: { from: Date; to: Date } | undefined) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
}) => {
  const [open, setOpen] = React.useState(false);

  const formatDateRange = () => {
    if (!value?.from) return 'Select date range';
    if (value.from && !value.to) return format(value.from, 'MMM d, yyyy');
    return `${format(value.from, 'MMM d')} - ${format(value.to, 'MMM d, yyyy')}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full h-10 justify-start text-left font-normal bg-vizla-elev2 border-vizla-glassBorder hover:border-vizla-glassElev',
            !value && 'text-vizla-text-muted'
          )}
        >
          <Calendar className="mr-2 h-4 w-4 text-vizla-text-muted" />
          <span className="text-vizla-text-secondary">{formatDateRange()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarComponent
          initialFocus
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={(range) => {
            if (range?.from && range?.to) {
              onChange?.(range as { from: Date; to: Date });
              setOpen(false);
            } else if (range?.from) {
              onChange?.({ from: range.from, to: range.from });
            }
          }}
          numberOfMonths={2}
          className="bg-vizla-elev2"
        />
      </PopoverContent>
    </Popover>
  );
};




