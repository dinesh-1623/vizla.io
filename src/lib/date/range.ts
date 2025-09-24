import { 
  startOfDay, 
  endOfDay, 
  subDays, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  format,
  parseISO,
  isValid,
  differenceInDays
} from 'date-fns';

/**
 * Date range type with ISO string boundaries
 */
export type DateRange = {
  from: string;  // ISO string, midnight boundary
  to: string;    // ISO string, end of day boundary
};

/**
 * Date range preset options
 */
export type DatePreset = 'today' | 'yesterday' | 'last7' | 'thisWeek' | 'last30' | 'thisMonth' | 'custom';

/**
 * Date range preset definition
 */
export type DatePresetOption = {
  key: DatePreset;
  label: string;
  range: DateRange;
};

/**
 * Generate date range presets based on current date
 */
export function getDatePresets(now: Date = new Date()): Record<DatePreset, DateRange> {
  return {
    today: {
      from: startOfDay(now).toISOString(),
      to: endOfDay(now).toISOString(),
    },
    yesterday: {
      from: startOfDay(subDays(now, 1)).toISOString(),
      to: endOfDay(subDays(now, 1)).toISOString(),
    },
    last7: {
      from: startOfDay(subDays(now, 6)).toISOString(),
      to: endOfDay(now).toISOString(),
    },
    thisWeek: {
      from: startOfWeek(now, { weekStartsOn: 1 }).toISOString(), // Monday start
      to: endOfWeek(now, { weekStartsOn: 1 }).toISOString(),
    },
    last30: {
      from: startOfDay(subDays(now, 29)).toISOString(),
      to: endOfDay(now).toISOString(),
    },
    thisMonth: {
      from: startOfMonth(now).toISOString(),
      to: endOfMonth(now).toISOString(),
    },
    custom: {
      from: startOfDay(now).toISOString(),
      to: endOfDay(now).toISOString(),
    },
  };
}

/**
 * Get preset options with labels
 */
export function getPresetOptions(now: Date = new Date()): DatePresetOption[] {
  const presets = getDatePresets(now);
  return [
    { key: 'today', label: 'Today', range: presets.today },
    { key: 'yesterday', label: 'Yesterday', range: presets.yesterday },
    { key: 'last7', label: 'Last 7 Days', range: presets.last7 },
    { key: 'thisWeek', label: 'This Week', range: presets.thisWeek },
    { key: 'last30', label: 'Last 30 Days', range: presets.last30 },
    { key: 'thisMonth', label: 'This Month', range: presets.thisMonth },
    { key: 'custom', label: 'Custom Range', range: presets.custom },
  ];
}

/**
 * Normalize date range - ensure from <= to and set proper boundaries
 */
export function normalizeRange(range: Partial<DateRange>): DateRange {
  const now = new Date();
  
  // Default to today if not provided
  const from = range.from ? parseISO(range.from) : now;
  const to = range.to ? parseISO(range.to) : now;
  
  // Validate dates
  const validFrom = isValid(from) ? from : now;
  const validTo = isValid(to) ? to : now;
  
  // Ensure from <= to
  const normalizedFrom = validFrom <= validTo ? validFrom : validTo;
  const normalizedTo = validFrom <= validTo ? validTo : validFrom;
  
  return {
    from: startOfDay(normalizedFrom).toISOString(),
    to: endOfDay(normalizedTo).toISOString(),
  };
}

/**
 * Convert date range to URL parameters
 */
export function rangeToParams(range: DateRange): URLSearchParams {
  const params = new URLSearchParams();
  params.set('from', format(parseISO(range.from), 'yyyy-MM-dd'));
  params.set('to', format(parseISO(range.to), 'yyyy-MM-dd'));
  return params;
}

/**
 * Parse date range from URL parameters
 */
export function paramsToRange(params: URLSearchParams): DateRange | null {
  const from = params.get('from');
  const to = params.get('to');
  
  if (!from || !to) return null;
  
  try {
    const fromDate = parseISO(from);
    const toDate = parseISO(to);
    
    if (!isValid(fromDate) || !isValid(toDate)) return null;
    
    return normalizeRange({ from: fromDate.toISOString(), to: toDate.toISOString() });
  } catch (error) {
    return null;
  }
}

/**
 * Format date range for display
 */
export function formatRange(range: DateRange, preset?: DatePreset): string {
  if (preset && preset !== 'custom') {
    const presetOptions = getPresetOptions();
    const presetOption = presetOptions.find(p => p.key === preset);
    if (presetOption) return presetOption.label;
  }
  
  const fromDate = parseISO(range.from);
  const toDate = parseISO(range.to);
  
  // If same day, show single date
  if (differenceInDays(toDate, fromDate) === 0) {
    return format(fromDate, 'MMM d, yyyy');
  }
  
  // If same month, show "Sep 1–15, 2024"
  if (fromDate.getFullYear() === toDate.getFullYear() && fromDate.getMonth() === toDate.getMonth()) {
    return `${format(fromDate, 'MMM d')}–${format(toDate, 'd, yyyy')}`;
  }
  
  // If same year, show "Sep 1–Oct 15, 2024"
  if (fromDate.getFullYear() === toDate.getFullYear()) {
    return `${format(fromDate, 'MMM d')}–${format(toDate, 'MMM d, yyyy')}`;
  }
  
  // Full range
  return `${format(fromDate, 'MMM d, yyyy')}–${format(toDate, 'MMM d, yyyy')}`;
}

/**
 * Check if date range is a preset
 */
export function getRangePreset(range: DateRange, now: Date = new Date()): DatePreset | null {
  const presets = getDatePresets(now);
  
  for (const [key, presetRange] of Object.entries(presets)) {
    if (presetRange.from === range.from && presetRange.to === range.to) {
      return key as DatePreset;
    }
  }
  
  return null;
}
