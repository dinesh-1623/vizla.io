export type PaletteType = 'lagoon' | 'indigo' | 'neutral';

export interface PaletteStep {
  color: string;
  textColor: string;
}

export interface HeatmapPalette {
  name: string;
  steps: PaletteStep[];
  chartColors: string[];
}

export interface ChartColors {
  lagoon: string[];
  indigo: string[];
  neutral: string[];
}

export const HEATMAP_PALETTES: Record<PaletteType, HeatmapPalette> = {
  lagoon: {
    name: 'Vizla Lagoon',
    steps: [
      { color: 'var(--vizla-lagoon-1)', textColor: 'var(--vizla-text-light)' },
      { color: 'var(--vizla-lagoon-2)', textColor: 'var(--vizla-text-light)' },
      { color: 'var(--vizla-lagoon-3)', textColor: 'var(--vizla-text-light)' },
      { color: 'var(--vizla-lagoon-4)', textColor: 'var(--vizla-text-light)' },
      { color: 'var(--vizla-lagoon-5)', textColor: 'var(--vizla-text-dark)' },
      { color: 'var(--vizla-lagoon-6)', textColor: 'var(--vizla-text-dark)' },
      { color: 'var(--vizla-lagoon-7)', textColor: 'var(--vizla-text-dark)' },
    ],
    chartColors: [
      'rgba(6, 182, 212, 0.8)',   // mist teal
      'rgba(16, 185, 129, 0.8)',  // emerald
      'rgba(245, 158, 11, 0.8)',  // amber
      'rgba(139, 92, 246, 0.8)',  // violet
      'rgba(236, 72, 153, 0.8)',  // pink
      'rgba(99, 102, 241, 0.8)'   // indigo
    ]
  },
  indigo: {
    name: 'Indigo',
    steps: [
      { color: 'var(--vizla-indigo-1)', textColor: 'var(--vizla-text-light)' },
      { color: 'var(--vizla-indigo-2)', textColor: 'var(--vizla-text-light)' },
      { color: 'var(--vizla-indigo-3)', textColor: 'var(--vizla-text-light)' },
      { color: 'var(--vizla-indigo-4)', textColor: 'var(--vizla-text-light)' },
      { color: 'var(--vizla-indigo-5)', textColor: 'var(--vizla-text-dark)' },
      { color: 'var(--vizla-indigo-6)', textColor: 'var(--vizla-text-dark)' },
      { color: 'var(--vizla-indigo-7)', textColor: 'var(--vizla-text-dark)' },
    ],
    chartColors: [
      'rgba(59, 130, 246, 0.8)',   // blue
      'rgba(99, 102, 241, 0.8)',   // indigo
      'rgba(139, 92, 246, 0.8)',   // violet
      'rgba(168, 85, 247, 0.8)',   // purple
      'rgba(236, 72, 153, 0.8)',   // pink
      'rgba(6, 182, 212, 0.8)'     // cyan
    ]
  },
  neutral: {
    name: 'Neutral',
    steps: [
      { color: 'var(--vizla-neutral-1)', textColor: 'var(--vizla-text-light)' },
      { color: 'var(--vizla-neutral-2)', textColor: 'var(--vizla-text-light)' },
      { color: 'var(--vizla-neutral-3)', textColor: 'var(--vizla-text-light)' },
      { color: 'var(--vizla-neutral-4)', textColor: 'var(--vizla-text-light)' },
      { color: 'var(--vizla-neutral-5)', textColor: 'var(--vizla-text-dark)' },
      { color: 'var(--vizla-neutral-6)', textColor: 'var(--vizla-text-dark)' },
      { color: 'var(--vizla-neutral-7)', textColor: 'var(--vizla-text-dark)' },
    ],
    chartColors: [
      'rgba(107, 114, 128, 0.8)',  // gray
      'rgba(156, 163, 175, 0.8)',  // gray-400
      'rgba(209, 213, 219, 0.8)',  // gray-300
      'rgba(229, 231, 235, 0.8)',  // gray-200
      'rgba(243, 244, 246, 0.8)',  // gray-100
      'rgba(249, 250, 251, 0.8)'   // gray-50
    ]
  }
};

/**
 * Get color for a given count and max count using the specified palette
 */
export function getColorForCount(
  count: number, 
  maxCount: number, 
  palette: PaletteType = 'lagoon'
): PaletteStep {
  if (count === 0) {
    return { color: 'var(--vizla-glass)', textColor: 'var(--vizla-text-secondary)' };
  }
  
  const paletteData = HEATMAP_PALETTES[palette];
  const ratio = count / maxCount;
  
  // Map ratio to step index (0-6)
  let stepIndex = Math.floor(ratio * 6);
  stepIndex = Math.min(stepIndex, 6); // Ensure we don't exceed array bounds
  
  return paletteData.steps[stepIndex];
}

/**
 * Load palette preference from localStorage
 */
export function loadPalettePreference(): PaletteType {
  try {
    const saved = localStorage.getItem('vizla.palette');
    if (saved && (saved === 'lagoon' || saved === 'indigo' || saved === 'neutral')) {
      return saved;
    }
  } catch {
    // Ignore localStorage errors
  }
  return 'lagoon'; // Default to lagoon
}

/**
 * Save palette preference to localStorage
 */
export function savePalettePreference(palette: PaletteType): void {
  try {
    localStorage.setItem('vizla.palette', palette);
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Get chart colors for the specified palette
 */
export function getChartColors(palette: PaletteType): string[] {
  return HEATMAP_PALETTES[palette].chartColors;
}

/**
 * Get palette options for UI
 */
export function getPaletteOptions(): Array<{ value: PaletteType; label: string }> {
  return Object.entries(HEATMAP_PALETTES).map(([key, palette]) => ({
    value: key as PaletteType,
    label: palette.name
  }));
}
