import { MarketZone, MarketGroup } from '@/lib/types/markets';
import { mockMarketsData } from '@/lib/mock/markets';

// Lightweight CSV parser
function parseCSV(csvText: string): MarketZone[] {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const entry: MarketZone = {
      market: values[0] || '',
      zone: values[1] || '',
      code: values[2] || undefined,
      is_active: values[3] === 'true'
    };
    return entry;
  });
}

// Group zones by market
export function groupZonesByMarket(zones: MarketZone[]): MarketGroup[] {
  const marketMap = new Map<string, MarketZone[]>();
  
  zones.forEach(zone => {
    const existing = marketMap.get(zone.market) || [];
    existing.push(zone);
    marketMap.set(zone.market, existing);
  });
  
  return Array.from(marketMap.entries())
    .map(([market, zones]) => ({
      market,
      zones: zones.sort((a, b) => a.zone.localeCompare(b.zone)),
      zoneCount: zones.length,
      activeCount: zones.filter(z => z.is_active !== false).length
    }))
    .sort((a, b) => a.market.localeCompare(b.market));
}

// Load markets from CSV or fallback to mock
export async function loadMarkets(): Promise<MarketZone[]> {
  try {
    const response = await fetch('/data/markets-zones.csv');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const csvText = await response.text();
    const parsed = parseCSV(csvText);
    
    if (parsed.length === 0) {
      throw new Error('No data found in CSV');
    }
    
    return parsed;
  } catch (error) {
    console.warn('Failed to load markets CSV, using mock data:', error);
    return mockMarketsData;
  }
}

// Export filtered data as CSV
export function exportMarketsCSV(zones: MarketZone[], filename: string = 'markets-zones-export.csv'): void {
  const headers = ['market', 'zone', 'code', 'is_active'];
  const csvContent = [
    headers.join(','),
    ...zones.map(zone => [
      zone.market,
      zone.zone,
      zone.code || '',
      zone.is_active ? 'true' : 'false'
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Filter zones by search term
export function filterZones(zones: MarketZone[], search: string): MarketZone[] {
  if (!search.trim()) return zones;
  
  const searchLower = search.toLowerCase();
  return zones.filter(zone => 
    zone.market.toLowerCase().includes(searchLower) ||
    zone.zone.toLowerCase().includes(searchLower) ||
    zone.code?.toLowerCase().includes(searchLower)
  );
}
