import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { MarketZone } from '@/lib/types/markets';

type SortField = 'market' | 'zone';
type SortDirection = 'asc' | 'desc';

interface MarketsListProps {
  zones: MarketZone[];
  onZoneClick: (market: string, zone: string) => void;
}

export const MarketsList: React.FC<MarketsListProps> = ({
  zones,
  onZoneClick
}) => {
  const [sortField, setSortField] = useState<SortField>('market');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const sortedZones = [...zones].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };
  
  return (
    <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-vizla-glassBorder">
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('market')}
                  className="flex items-center gap-2 text-sm font-medium text-vizla-text-secondary hover:text-vizla-text-primary transition-colors focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none rounded"
                >
                  Market
                  {getSortIcon('market')}
                </button>
              </th>
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('zone')}
                  className="flex items-center gap-2 text-sm font-medium text-vizla-text-secondary hover:text-vizla-text-primary transition-colors focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none rounded"
                >
                  Zone
                  {getSortIcon('zone')}
                </button>
              </th>
              <th className="text-left p-4">
                <span className="text-sm font-medium text-vizla-text-secondary">Code</span>
              </th>
              <th className="text-left p-4">
                <span className="text-sm font-medium text-vizla-text-secondary">Status</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedZones.map((zone, index) => (
              <tr
                key={`${zone.market}-${zone.zone}`}
                className={`border-b border-vizla-glassBorder hover:bg-vizla-glass/50 transition-colors ${
                  index % 2 === 0 ? 'bg-transparent' : 'bg-vizla-glass/20'
                }`}
              >
                <td className="p-4">
                  <button
                    onClick={() => onZoneClick(zone.market, zone.zone)}
                    className="text-sm text-vizla-text-primary hover:text-vizla-brand-primary transition-colors focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none rounded"
                  >
                    {zone.market}
                  </button>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => onZoneClick(zone.market, zone.zone)}
                    className="text-sm text-vizla-text-primary hover:text-vizla-brand-primary transition-colors focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:outline-none rounded"
                  >
                    {zone.zone}
                  </button>
                </td>
                <td className="p-4">
                  <span className="text-sm text-vizla-text-muted">
                    {zone.code || '—'}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    zone.is_active !== false
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      zone.is_active !== false ? 'bg-green-400' : 'bg-gray-400'
                    }`} />
                    {zone.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
};
