import { loadLocated, type LocatedRow } from '@/lib/data/loaders';
import { differenceInHours, formatDistanceToNowStrict, startOfDay, subDays } from 'date-fns';

export type DerivedStatus = 'located' | 'blocked' | 'stashed' | 'dispatched';

export interface EnrichedLocatedRow extends LocatedRow {
  derivedStatus: DerivedStatus;
  locatedAt: Date;
  agingHours: number;
}

export interface AlertItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description?: string;
  affectedCount?: number;
  actionRoute?: string;
}

export interface AgingBucket {
  label: string;
  count: number;
  isCritical?: boolean;
}

export interface ThroughputMetrics {
  located24h: number;
  dispatched24h: number;
  clearanceRate: number;
  averageAgeHours: number;
  agingBuckets: AgingBucket[];
}

export interface MarketSummary {
  market: string;
  total: number;
  blocked: number;
  stashed: number;
  utilization: number;
  trend: 'up' | 'down' | 'flat';
}

export interface DriverSummary {
  name: string;
  active: number;
  blocked: number;
  stashed: number;
  unassigned?: boolean;
}

export interface NarrativeEvent {
  id: string;
  message: string;
  timestamp: Date;
  relativeTime: string;
  tone: 'positive' | 'neutral' | 'warning';
}

export interface OperationsSnapshot {
  totals: {
    vehicles: number;
    located: number;
    blocked: number;
    blockedOver48h: number;
    stashed: number;
    dispatched: number;
    unassignedDrivers: number;
    activeMarkets: number;
  };
  throughput: ThroughputMetrics;
  alerts: AlertItem[];
  markets: MarketSummary[];
  drivers: DriverSummary[];
  narrative: NarrativeEvent[];
  lastUpdated: Date;
}

export interface SnapshotFilters {
  market?: string;
  status?: DerivedStatus;
}

const CAPACITY_BASELINE = 140;

const BLOCKED_KEYWORDS = [
  'bill owed',
  'impound',
  'fee',
  'notified',
  'hold',
  'blocked',
  'owed',
  'pending',
  'debt',
];

const STASHED_KEYWORDS = [
  'garage',
  'stash',
  'lot',
  'behind gate',
  'pulled in',
  'backed in',
  'stored',
];

const DISPATCHED_KEYWORDS = [
  'released',
  'picked up',
  'delivered',
  'dispatched',
  'towed',
  'cleared',
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function parseDateFromNotes(notes: string | undefined, now: Date): Date | null {
  if (!notes) {
    return null;
  }

  const normalized = notes.replace(/[^\d/.-]/g, ' ');
  const matches = normalized.match(/(\d{1,2})[\/|-](\d{1,2})(?:[\/|-](\d{2,4}))?/);

  if (!matches) {
    return null;
  }

  const month = Number(matches[1]);
  const day = Number(matches[2]);
  const yearFragment = matches[3];

  if (Number.isNaN(month) || Number.isNaN(day)) {
    return null;
  }

  const currentYear = now.getFullYear();
  let year = currentYear;

  if (yearFragment) {
    const parsedYear = Number(yearFragment.length === 2 ? `20${yearFragment}` : yearFragment);
    if (!Number.isNaN(parsedYear)) {
      year = parsedYear;
    }
  }

  let parsed = new Date(year, month - 1, day);

  if (parsed.getTime() > now.getTime()) {
    parsed = subDays(parsed, 365);
  }

  return parsed;
}

function inferDerivedStatus(row: LocatedRow): DerivedStatus {
  const notes = (row.notes || '').toLowerCase();
  const status = (row.status || '').toLowerCase();
  const driver = (row.driver || '').toLowerCase();
  const source = (row.source || '').toLowerCase();

  if (
    BLOCKED_KEYWORDS.some((keyword) => notes.includes(keyword)) ||
    BLOCKED_KEYWORDS.some((keyword) => status.includes(keyword)) ||
    BLOCKED_KEYWORDS.some((keyword) => driver.includes(keyword))
  ) {
    return 'blocked';
  }

  if (
    STASHED_KEYWORDS.some((keyword) => notes.includes(keyword)) ||
    STASHED_KEYWORDS.some((keyword) => status.includes(keyword)) ||
    STASHED_KEYWORDS.some((keyword) => driver.includes(keyword))
  ) {
    return 'stashed';
  }

  if (
    DISPATCHED_KEYWORDS.some((keyword) => notes.includes(keyword)) ||
    DISPATCHED_KEYWORDS.some((keyword) => status.includes(keyword)) ||
    source === 'dispatched'
  ) {
    return 'dispatched';
  }

  return 'located';
}

function deriveLocatedAt(row: LocatedRow, now: Date): Date {
  const parsedNotesDate = parseDateFromNotes(row.notes, now);

  if (parsedNotesDate) {
    return startOfDay(parsedNotesDate);
  }

  const baseline = hashString(row.id || row.client || '0') % 10;
  return subDays(startOfDay(now), baseline);
}

function enrichRows(rows: LocatedRow[], now: Date): EnrichedLocatedRow[] {
  return rows.map((row) => {
    const locatedAt = deriveLocatedAt(row, now);
    const derivedStatus = inferDerivedStatus(row);
    const agingHours = Math.max(0, differenceInHours(now, locatedAt));
    const market = row.market || row.zone || 'Unknown';

    const enriched: EnrichedLocatedRow = {
      ...row,
      market,
      derivedStatus,
      locatedAt,
      agingHours,
    };

    return enriched;
  });
}

function filterRows(rows: EnrichedLocatedRow[], filters?: SnapshotFilters): EnrichedLocatedRow[] {
  if (!filters) {
    return rows;
  }

  return rows.filter((row) => {
    if (filters.market && row.market !== filters.market) {
      return false;
    }

    if (filters.status && row.derivedStatus !== filters.status) {
      return false;
    }

    return true;
  });
}

function buildThroughputMetrics(rows: EnrichedLocatedRow[]): ThroughputMetrics {
  const located24h = rows.filter((row) => row.agingHours <= 24).length;
  const dispatched24h = rows.filter((row) => row.derivedStatus === 'dispatched' && row.agingHours <= 24).length;

  const blocked = rows.filter((row) => row.derivedStatus === 'blocked');
  const clearedOrDispatched = rows.filter(
    (row) => row.derivedStatus === 'dispatched' || row.derivedStatus === 'stashed',
  );

  const clearanceRate =
    blocked.length === 0 ? 0 : Math.min(100, Math.round((clearedOrDispatched.length / (blocked.length + clearedOrDispatched.length)) * 100));

  const averageAgeHours =
    rows.length === 0 ? 0 : Math.round(rows.reduce((acc, row) => acc + row.agingHours, 0) / rows.length);

  const agingBuckets: AgingBucket[] = [
    {
      label: '0-24h',
      count: rows.filter((row) => row.agingHours < 24).length,
    },
    {
      label: '24-48h',
      count: rows.filter((row) => row.agingHours >= 24 && row.agingHours < 48).length,
    },
    {
      label: '48-72h',
      count: rows.filter((row) => row.agingHours >= 48 && row.agingHours < 72).length,
      isCritical: true,
    },
    {
      label: '72h+',
      count: rows.filter((row) => row.agingHours >= 72).length,
      isCritical: true,
    },
  ];

  return {
    located24h,
    dispatched24h,
    clearanceRate,
    averageAgeHours,
    agingBuckets,
  };
}

function buildMarketSummaries(rows: EnrichedLocatedRow[]): MarketSummary[] {
  const marketMap = new Map<string, EnrichedLocatedRow[]>();

  rows.forEach((row) => {
    if (!row.market) {
      return;
    }

    if (!marketMap.has(row.market)) {
      marketMap.set(row.market, []);
    }

    marketMap.get(row.market)?.push(row);
  });

  const summaries: MarketSummary[] = [];

  marketMap.forEach((marketRows, market) => {
    const total = marketRows.length;
    const blocked = marketRows.filter((row) => row.derivedStatus === 'blocked').length;
    const stashed = marketRows.filter((row) => row.derivedStatus === 'stashed').length;
    const utilization = Math.min(100, Math.round((total / CAPACITY_BASELINE) * 100));

    let trend: MarketSummary['trend'] = 'flat';
    if (utilization >= 90) {
      trend = 'up';
    } else if (utilization <= 60) {
      trend = 'down';
    }

    summaries.push({
      market,
      total,
      blocked,
      stashed,
      utilization,
      trend,
    });
  });

  return summaries.sort((a, b) => b.total - a.total);
}

function buildDriverSummaries(rows: EnrichedLocatedRow[]): DriverSummary[] {
  const driverMap = new Map<string, EnrichedLocatedRow[]>();

  rows.forEach((row) => {
    const key = row.assignedDriver || row.driver || 'Unassigned';

    if (!driverMap.has(key)) {
      driverMap.set(key, []);
    }

    driverMap.get(key)?.push(row);
  });

  const summaries: DriverSummary[] = [];

  driverMap.forEach((driverRows, name) => {
    const active = driverRows.length;
    const blocked = driverRows.filter((row) => row.derivedStatus === 'blocked').length;
    const stashed = driverRows.filter((row) => row.derivedStatus === 'stashed').length;

    summaries.push({
      name,
      active,
      blocked,
      stashed,
      unassigned: name.toLowerCase() === 'unassigned',
    });
  });

  return summaries.sort((a, b) => b.active - a.active);
}

function buildAlerts(rows: EnrichedLocatedRow[], markets: MarketSummary[], filters?: SnapshotFilters): AlertItem[] {
  const alerts: AlertItem[] = [];

  const blockedOver48h = rows.filter(
    (row) => row.derivedStatus === 'blocked' && row.agingHours >= 48,
  );

  if (blockedOver48h.length > 0) {
    alerts.push({
      id: 'blocked-over-48h',
      severity: 'critical',
      title: `${blockedOver48h.length} vehicles blocked over 48h`,
      description: 'Escalate to finance or coordinate with lot to unlock movement.',
      affectedCount: blockedOver48h.length,
      actionRoute: '/app/blocked',
    });
  }

  const highUtilMarkets = markets.filter((market) => market.utilization >= 90);
  if (highUtilMarkets.length > 0) {
    alerts.push({
      id: 'capacity-alert',
      severity: 'warning',
      title: `${highUtilMarkets.length} markets over capacity`,
      description: highUtilMarkets.map((market) => `${market.market} ${market.utilization}%`).join(' · '),
      actionRoute: '/app/zones/capacity',
    });
  }

  const unassigned = rows.filter((row) => (row.assignedDriver || '').toLowerCase() === 'unassigned');
  if (!filters?.status && unassigned.length > 0) {
    alerts.push({
      id: 'unassigned-alert',
      severity: 'info',
      title: `${unassigned.length} vehicles without an assigned driver`,
      description: 'Review assignments to keep jobs moving.',
      affectedCount: unassigned.length,
      actionRoute: '/app/driver/progress',
    });
  }

  return alerts;
}

function buildNarrative(rows: EnrichedLocatedRow[], throughput: ThroughputMetrics, now: Date): NarrativeEvent[] {
  const events: NarrativeEvent[] = [];
  const mostRecent = [...rows].sort((a, b) => b.locatedAt.getTime() - a.locatedAt.getTime()).slice(0, 3);

  mostRecent.forEach((row) => {
    events.push({
      id: `recent-${row.id}`,
      message: `${row.client} located in ${row.market || 'Unknown market'} ${formatDistanceToNowStrict(row.locatedAt, {
        addSuffix: true,
      })}`,
      timestamp: row.locatedAt,
      relativeTime: formatDistanceToNowStrict(row.locatedAt, { addSuffix: true }),
      tone: 'neutral',
    });
  });

  if (throughput.dispatched24h > 0) {
    events.unshift({
      id: 'dispatched-progress',
      message: `Cleared ${throughput.dispatched24h} vehicles in the last 24h.`,
      timestamp: subDays(now, 0),
      relativeTime: 'Last 24h',
      tone: 'positive',
    });
  }

  if (throughput.agingBuckets.some((bucket) => bucket.isCritical && bucket.count > 0)) {
    const criticalBucket = throughput.agingBuckets.find((bucket) => bucket.label === '72h+')!;
    events.push({
      id: 'aging-watch',
      message: `${criticalBucket.count} vehicles aging past 72h need action.`,
      timestamp: subDays(now, 3),
      relativeTime: '72h+',
      tone: 'warning',
    });
  }

  return events;
}

export async function fetchOperationsDataset(): Promise<EnrichedLocatedRow[]> {
  const rows = await loadLocated();
  const now = new Date();
  return enrichRows(rows, now);
}

export function buildOperationsSnapshot(
  rows: EnrichedLocatedRow[],
  filters?: SnapshotFilters,
): OperationsSnapshot {
  const now = new Date();
  const filteredRows = filterRows(rows, filters);

  const totals = {
    vehicles: filteredRows.length,
    located: filteredRows.filter((row) => row.derivedStatus === 'located').length,
    blocked: filteredRows.filter((row) => row.derivedStatus === 'blocked').length,
    blockedOver48h: filteredRows.filter((row) => row.derivedStatus === 'blocked' && row.agingHours >= 48).length,
    stashed: filteredRows.filter((row) => row.derivedStatus === 'stashed').length,
    dispatched: filteredRows.filter((row) => row.derivedStatus === 'dispatched').length,
    unassignedDrivers: filteredRows.filter((row) => (row.assignedDriver || '').toLowerCase() === 'unassigned').length,
    activeMarkets: new Set(filteredRows.map((row) => row.market).filter(Boolean)).size,
  };

  const throughput = buildThroughputMetrics(filteredRows);
  const markets = buildMarketSummaries(filteredRows);
  const drivers = buildDriverSummaries(filteredRows);
  const alerts = buildAlerts(filteredRows, markets, filters);
  const narrative = buildNarrative(filteredRows, throughput, now);

  return {
    totals,
    throughput,
    alerts,
    markets,
    drivers,
    narrative,
    lastUpdated: now,
  };
}

