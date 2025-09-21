/**
 * Component-level styling constants to avoid drift
 * These should be used instead of repeating utility chains
 */

export const GLASS_SURFACE = 'glass rounded-2xl';
export const GLASS_BUTTON = 'glass hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors';
export const GLASS_INPUT = 'glass focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors';

export const SPACING = {
  SECTION: 'space-y-6',
  CARD_INTERNAL: 'p-4',
  BUTTON_PADDING: 'px-4 py-2',
  INPUT_PADDING: 'px-3 py-2',
  GRID_GAP: 'gap-6',
  STACK_GAP: 'gap-4',
} as const;

export const TEXT_STYLES = {
  HEADING_PRIMARY: 'text-[22px] font-semibold tracking-[-0.01em] text-primary',
  HEADING_SECONDARY: 'text-lg font-medium text-primary',
  BODY_PRIMARY: 'text-sm text-primary',
  BODY_SECONDARY: 'text-sm text-secondary',
  BODY_MUTED: 'text-xs text-muted',
  LABEL: 'text-xs font-medium text-muted uppercase tracking-wider',
} as const;

export const STATUS_COLORS = {
  EASY: 'bg-vizla-success',
  MEDIUM: 'bg-vizla-warn',
  HARD: 'bg-vizla-danger',
} as const;

export const LAYOUT = {
  CONTAINER: 'mx-auto max-w-7xl px-6 py-6',
  GRID_RESPONSIVE: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  GRID_FOUR_COL: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  GRID_THREE_COL: 'grid grid-cols-1 lg:grid-cols-3',
} as const;

export const INTERACTIVE = {
  FOCUS_RING: 'focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none',
  HOVER_GLASS: 'hover:bg-white/10',
  ACTIVE_GLASS: 'active:bg-white/20',
} as const;
