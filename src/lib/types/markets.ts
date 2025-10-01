export type MarketZone = {
  market: string;
  zone: string;
  code?: string;
  is_active?: boolean;
};

export type MarketGroup = {
  market: string;
  zones: MarketZone[];
  zoneCount: number;
  activeCount: number;
};

export type MarketsViewMode = 'columns' | 'list';

export type MarketsFilterOptions = {
  search: string;
  viewMode: MarketsViewMode;
};
