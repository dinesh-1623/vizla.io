/**
 * Recurring Shift Form
 * Create shifts with day-of-week selection and duplication for multiple weeks
 */

import React, { useState, useMemo } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Calendar, Clock, Repeat, Trash2 } from 'lucide-react';
import type { ShiftFormData, ShiftType } from '@/lib/shift/types';
import { saveShift } from '@/lib/shift/store';
import { cn } from '@/lib/utils';

const DAYS_OF_WEEK = [
  { id: 0, label: 'Sun', full: 'Sunday' },
  { id: 1, label: 'Mon', full: 'Monday' },
  { id: 2, label: 'Tue', full: 'Tuesday' },
  { id: 3, label: 'Wed', full: 'Wednesday' },
  { id: 4, label: 'Thu', full: 'Thursday' },
  { id: 5, label: 'Fri', full: 'Friday' },
  { id: 6, label: 'Sat', full: 'Saturday' }
] as const;

const REPEAT_OPTIONS = [
  { value: 1, label: '1 Week' },
  { value: 4, label: '4 Weeks' },
  { value: 12, label: '12 Weeks' }
] as const;

interface RecurringShiftFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface PreviewShift {
  id: string;
  date: string; // ISO date string
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export const RecurringShiftForm: React.FC<RecurringShiftFormProps> = ({
  onSuccess,
  onCancel
}) => {
  // Form state
  const [driver, setDriver] = useState('');
  const [market, setMarket] = useState('Baltimore');
  const [zone, setZone] = useState('Downtown');
  const [shiftType, setShiftType] = useState<ShiftType>('Day');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('21:00');
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5])); // Mon-Fri default
  const [repeatWeeks, setRepeatWeeks] = useState(1);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Preview state
  const [excludedShiftIds, setExcludedShiftIds] = useState<Set<string>>(new Set());

  // Toggle day selection
  const toggleDay = (dayId: number) => {
    const newSelected = new Set(selectedDays);
    if (newSelected.has(dayId)) {
      newSelected.delete(dayId);
    } else {
      newSelected.add(dayId);
    }
    setSelectedDays(newSelected);
  };

  // Generate preview shifts
  const previewShifts = useMemo(() => {
    if (selectedDays.size === 0) return [];

    const shifts: PreviewShift[] = [];
    const start = new Date(startDate);
    
    // Generate shifts for each week
    for (let week = 0; week < repeatWeeks; week++) {
      // Generate shifts for each selected day of the week
      selectedDays.forEach(dayOfWeek => {
        // Find the next occurrence of this day
        const shiftDate = new Date(start);
        shiftDate.setDate(start.getDate() + (week * 7) + ((dayOfWeek - start.getDay() + 7) % 7));
        
        const dateStr = shiftDate.toISOString().split('T')[0];
        const id = `preview-${dateStr}-${dayOfWeek}`;

        shifts.push({
          id,
          date: dateStr,
          dayOfWeek: DAYS_OF_WEEK[dayOfWeek].full,
          startTime,
          endTime
        });
      });
    }

    return shifts.sort((a, b) => a.date.localeCompare(b.date));
  }, [startDate, selectedDays, repeatWeeks, startTime, endTime]);

  // Active (not excluded) shifts
  const activeShifts = previewShifts.filter(s => !excludedShiftIds.has(s.id));

  // Toggle shift exclusion
  const toggleShiftExclusion = (shiftId: string) => {
    const newExcluded = new Set(excludedShiftIds);
    if (newExcluded.has(shiftId)) {
      newExcluded.delete(shiftId);
    } else {
      newExcluded.add(shiftId);
    }
    setExcludedShiftIds(newExcluded);
  };

  // Save all shifts
  const handleSave = () => {
    try {
      // Save each active shift
      activeShifts.forEach(preview => {
        const shiftData: ShiftFormData = {
          marketId: market,
          zoneId: zone,
          startDateTime: `${preview.date}T${startTime}`,
          endDateTime: `${preview.date}T${endTime}`,
          shiftType,
          capacity: 1,
          goalTows: 10,
          startingPoint: {
            type: 'Not Fixed'
          },
          storageLot: 'Main Lot',
          assignedDriverIds: driver ? [driver] : [],
          notes: `Recurring shift - ${preview.dayOfWeek}`
        };

        // Calculate shift length
        const start = new Date(shiftData.startDateTime);
        const end = new Date(shiftData.endDateTime);
        const lengthMin = Math.round((end.getTime() - start.getTime()) / 60000);

        const shift = {
          id: `shift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          marketId: shiftData.marketId,
          zoneId: shiftData.zoneId,
          startISO: shiftData.startDateTime,
          endISO: shiftData.endDateTime,
          lengthMin,
          shiftType: shiftData.shiftType,
          capacity: shiftData.capacity,
          goalTows: shiftData.goalTows,
          startingPoint: shiftData.startingPoint,
          storageLot: shiftData.storageLot,
          assignedDriverIds: shiftData.assignedDriverIds,
          notes: shiftData.notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        saveShift(shift);
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error saving recurring shifts:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-vizla-text-primary mb-4">
          Recurring Shift Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Driver */}
          <div>
            <Label htmlFor="driver">Driver (Optional)</Label>
            <Input
              id="driver"
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
              placeholder="Driver name"
            />
          </div>

          {/* Market */}
          <div>
            <Label htmlFor="market">Market</Label>
            <select
              id="market"
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              className="w-full px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:outline-none focus:ring-2 focus:ring-vizla-brand-primary/50"
            >
              <option value="Baltimore">Baltimore</option>
              <option value="Dallas">Dallas</option>
              <option value="Phoenix">Phoenix</option>
            </select>
          </div>

          {/* Zone */}
          <div>
            <Label htmlFor="zone">Zone</Label>
            <select
              id="zone"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:outline-none focus:ring-2 focus:ring-vizla-brand-primary/50"
            >
              <option value="Downtown">Downtown</option>
              <option value="North">North</option>
              <option value="East">East</option>
              <option value="West">West</option>
            </select>
          </div>

          {/* Shift Type */}
          <div>
            <Label htmlFor="shift-type">Shift Type</Label>
            <select
              id="shift-type"
              value={shiftType}
              onChange={(e) => setShiftType(e.target.value as ShiftType)}
              className="w-full px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:outline-none focus:ring-2 focus:ring-vizla-brand-primary/50"
            >
              <option value="Day">Day</option>
              <option value="Night">Night</option>
            </select>
          </div>

          {/* Start Time */}
          <div>
            <Label htmlFor="start-time">Start Time</Label>
            <Input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          {/* End Time */}
          <div>
            <Label htmlFor="end-time">End Time</Label>
            <Input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        {/* Days of Week */}
        <div className="mt-6">
          <Label className="mb-3 block">Days of Week</Label>
          <div className="flex gap-2 flex-wrap">
            {DAYS_OF_WEEK.map(day => (
              <button
                key={day.id}
                onClick={() => toggleDay(day.id)}
                className={cn(
                  'px-4 py-2 rounded-lg border transition-colors',
                  selectedDays.has(day.id)
                    ? 'bg-vizla-brand-primary/20 border-vizla-brand-primary text-vizla-brand-primary'
                    : 'bg-vizla-glass border-vizla-glassBorder text-vizla-text-secondary hover:border-vizla-text-muted'
                )}
                aria-pressed={selectedDays.has(day.id)}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        {/* Repeat Duration */}
        <div className="mt-6">
          <Label className="mb-3 block">Repeat For</Label>
          <div className="flex gap-2">
            {REPEAT_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => setRepeatWeeks(option.value)}
                className={cn(
                  'px-4 py-2 rounded-lg border transition-colors',
                  repeatWeeks === option.value
                    ? 'bg-vizla-brand-primary/20 border-vizla-brand-primary text-vizla-brand-primary'
                    : 'bg-vizla-glass border-vizla-glassBorder text-vizla-text-secondary hover:border-vizla-text-muted'
                )}
                aria-pressed={repeatWeeks === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Start Date */}
        <div className="mt-6">
          <Label htmlFor="start-date">Start Date</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
      </GlassCard>

      {/* Preview */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-vizla-text-primary">
            Preview ({activeShifts.length} shifts)
          </h3>
          <Badge variant="outline">
            {selectedDays.size} days × {repeatWeeks} weeks = {selectedDays.size * repeatWeeks} total
          </Badge>
        </div>

        {previewShifts.length === 0 ? (
          <p className="text-vizla-text-secondary text-center py-8">
            Select days of the week to preview shifts
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {previewShifts.map(shift => {
              const isExcluded = excludedShiftIds.has(shift.id);
              return (
                <div
                  key={shift.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border transition-all',
                    isExcluded
                      ? 'bg-vizla-glass/30 border-vizla-glassBorder opacity-50'
                      : 'bg-vizla-glass border-vizla-glassBorder'
                  )}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      checked={!isExcluded}
                      onCheckedChange={() => toggleShiftExclusion(shift.id)}
                      aria-label={`Include shift on ${shift.date}`}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-vizla-text-primary">
                        {shift.dayOfWeek}, {new Date(shift.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-vizla-text-secondary">
                        {shift.startTime} - {shift.endTime} · {shiftType}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleShiftExclusion(shift.id)}
                    className="text-vizla-text-muted hover:text-red-400"
                  >
                    {isExcluded ? (
                      <span className="text-xs">Restore</span>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={activeShifts.length === 0}
        >
          Create {activeShifts.length} Shift{activeShifts.length !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  );
};








