import { LocatedRow } from '@/lib/types/located';

export interface PivotCell {
  client: string;
  zone: string;
  driver: string;
  count: number;
}

export interface Pivot {
  clients: string[];
  zonesByClient: Record<string, string[]>;
  drivers: string[];
  cells: PivotCell[];
  totals: {
    byClient: Record<string, number>;
    byClientZone: Record<string, number>;
  };
}

export interface PivotFilters {
  market?: string;
  status?: string;
}

/**
 * Build pivot table from LocatedRow data
 */
export function buildPivotFromLocated(rows: LocatedRow[], filters: PivotFilters): Pivot {
  // Apply filters
  let filteredRows = rows;

  if (filters.market && filters.market !== 'All') {
    filteredRows = filteredRows.filter(row => row.market === filters.market);
  }

  if (filters.status && filters.status !== 'All') {
    filteredRows = filteredRows.filter(row => row.status === filters.status);
  }

  // Group by client
  const clients = Array.from(new Set(filteredRows.map(row => row.client))).sort();
  const zonesByClient: Record<string, string[]> = {};
  const allDrivers = new Set<string>();
  const cells: PivotCell[] = [];
  const totalsByClient: Record<string, number> = {};
  const totalsByClientZone: Record<string, number> = {};

  clients.forEach(client => {
    const clientRows = filteredRows.filter(row => row.client === client);
    zonesByClient[client] = Array.from(new Set(clientRows.map(row => row.zone))).sort();

    zonesByClient[client].forEach(zone => {
      const clientZoneRows = clientRows.filter(row => row.zone === zone);
      let clientZoneTotal = 0;

      // Group by driver within this client/zone
      const driverCounts = new Map<string, number>();
      clientZoneRows.forEach(row => {
        const driver = row.driver || 'Unassigned';
        allDrivers.add(driver);
        const count = driverCounts.get(driver) || 0;
        driverCounts.set(driver, count + 1);
        clientZoneTotal++;
      });

      // Create cells for each driver in this client/zone
      driverCounts.forEach((count, driver) => {
        cells.push({ client, zone, driver, count });
      });

      totalsByClientZone[`${client}|${zone}`] = clientZoneTotal;
      totalsByClient[client] = (totalsByClient[client] || 0) + clientZoneTotal;
    });
  });

  const drivers = Array.from(allDrivers).sort();

  return {
    clients,
    zonesByClient,
    drivers,
    cells,
    totals: {
      byClient: totalsByClient,
      byClientZone: totalsByClientZone,
    },
  };
}
