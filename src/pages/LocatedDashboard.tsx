import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DataSourceToggle } from '@/components/DataSourceToggle';
import Sidebar from '@/components/shell/Sidebar';
import { toast } from 'sonner';
import { 
  Filter, 
  CalendarIcon,
  Download,
  Bell,
  User,
  MapPin,
  Users,
  Car,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  BarChart3,
  RefreshCw,
  Settings,
  Eye,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  X,
  Menu
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

// Types for better type safety
interface KPIData {
  located: number;
  bankGps: number;
  avgTime: number;
  fivePlusDays: number;
  blockedIn: number;
  stashed: number;
}

interface ChartData {
  name: string;
  value: number;
  percentage?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface DetailedBreakdownData {
  client: string;
  zones: {
    zone: string;
    drivers: {
      johnD: number;
      janeS: number;
      mikeR: number;
      sarahK: number;
    };
    total: number;
  }[];
}

interface Filters {
  market: string;
  status: string;
  zone: string;
  dateRange: {
    from: Date;
    to: Date;
  };
}

// Enhanced mock data with more realistic and varied data
const generateMockData = (): {
  kpis: KPIData;
  locatedByClient: ChartData[];
  locatedByMarket: ChartData[];
  awaitingTowByDriver: ChartData[];
  locatedRevenue: ChartData[];
  detailedBreakdown: DetailedBreakdownData[];
} => {
  return {
    kpis: {
      located: Math.floor(Math.random() * 2000) + 800,
      bankGps: Math.floor(Math.random() * 300) + 100,
      avgTime: Math.round((Math.random() * 5 + 1) * 10) / 10,
      fivePlusDays: Math.floor(Math.random() * 200) + 50,
      blockedIn: Math.floor(Math.random() * 50) + 10,
      stashed: Math.floor(Math.random() * 100) + 20
    },
    locatedByClient: [
      { name: 'Client A', value: 300, percentage: 24.3, trend: 'up' },
      { name: 'Client B', value: 200, percentage: 16.2, trend: 'stable' },
      { name: 'Client C', value: 100, percentage: 8.1, trend: 'down' },
      { name: 'Client D', value: 60, percentage: 4.9, trend: 'up' }
    ],
    locatedByMarket: [
      { name: 'Houston', value: 280, percentage: 22.7 },
      { name: 'Maryland', value: 240, percentage: 19.4 },
      { name: 'DC', value: 180, percentage: 14.6 },
      { name: 'Virginia', value: 120, percentage: 9.7 },
      { name: 'Delaware', value: 80, percentage: 6.5 }
    ],
    awaitingTowByDriver: [
      { name: 'John D.', value: 160, percentage: 35.6 },
      { name: 'Jane S.', value: 130, percentage: 28.9 },
      { name: 'Mike R.', value: 110, percentage: 24.4 },
      { name: 'Sarah K.', value: 80, percentage: 17.8 }
    ],
    locatedRevenue: [
      { name: 'Client A', value: 35000, percentage: 40.7 },
      { name: 'Client B', value: 15000, percentage: 17.4 },
      { name: 'Client C', value: 28000, percentage: 32.6 },
      { name: 'Client D', value: 8000, percentage: 9.3 }
    ],
    detailedBreakdown: [
      {
        client: 'Client A',
        zones: [
          { zone: 'North', drivers: { johnD: 50, janeS: 25, mikeR: 0, sarahK: 0 }, total: 75 },
          { zone: 'East', drivers: { johnD: 0, janeS: 75, mikeR: 75, sarahK: 0 }, total: 150 }
        ]
      },
      {
        client: 'Client B',
        zones: [
          { zone: 'South', drivers: { johnD: 100, janeS: 0, mikeR: 0, sarahK: 0 }, total: 100 },
          { zone: 'East', drivers: { johnD: 0, janeS: 50, mikeR: 50, sarahK: 0 }, total: 100 }
        ]
      },
      {
        client: 'Client C',
        zones: [
          { zone: 'South', drivers: { johnD: 70, janeS: 0, mikeR: 0, sarahK: 0 }, total: 70 },
          { zone: 'West', drivers: { johnD: 0, janeS: 0, mikeR: 0, sarahK: 30 }, total: 30 }
        ]
      },
      {
        client: 'Client D',
        zones: [
          { zone: 'West', drivers: { johnD: 0, janeS: 60, mikeR: 0, sarahK: 0 }, total: 60 }
        ]
      }
    ]
  };
};

// Enhanced KPI Card with animations and better UX
const KPICard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  isLoading?: boolean;
  onClick?: () => void;
}> = ({ title, value, subtitle, icon, trend, isLoading, onClick }) => {
  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up': return 'text-slate-400';
      case 'down': return 'text-red-400';
      default: return 'text-vizla-text-secondary';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3" />;
      case 'down': return <TrendingUp className="w-3 h-3 rotate-180" />;
      default: return null;
    }
  };

  return (
    <Card 
      className={`bg-white border border-gray-200 hover:shadow-sm transition-shadow ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-3 text-center">
        <div className="text-xs text-gray-600 mb-1">{title}</div>
        <div className="text-lg font-bold text-gray-900">
          {isLoading ? (
            <div className="animate-pulse bg-gray-200 h-5 w-12 mx-auto rounded" />
          ) : (
            typeof value === 'number' ? value.toLocaleString() : value
          )}
        </div>
        {subtitle && (
          <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
        )}
      </CardContent>
    </Card>
  );
};

// Enhanced Bar Chart with better animations and interactions
const EnhancedBarChart: React.FC<{
  title: string;
  data: ChartData[];
  maxValue?: number;
  showRevenue?: boolean;
  isLoading?: boolean;
  onItemClick?: (type: string, item: ChartData) => void;
}> = ({ title, data, maxValue, showRevenue = false, isLoading, onItemClick }) => {
  const max = maxValue || Math.max(...data.map(d => d.value));
  
  if (isLoading) {
    return (
      <Card className="bg-vizla-glass/50 backdrop-blur-xl border border-vizla-glassBorder">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-vizla-text-primary">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-vizla-glass/30 rounded mb-2" />
                <div className="h-2 bg-vizla-glass/20 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-vizla-glass/50 backdrop-blur-xl border border-vizla-glassBorder">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-vizla-text-primary flex items-center gap-2">
          {title}
          <Info className="w-4 h-4 text-vizla-text-secondary/60" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div 
              key={index} 
              className="space-y-2 cursor-pointer hover:bg-vizla-glass/20 p-2 rounded-lg transition-colors"
              onClick={() => onItemClick?.(title, item)}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-vizla-text-secondary">{item.name}</span>
                <div className="flex items-center gap-2">
                  {item.percentage && (
                    <span className="text-xs text-vizla-text-muted">({item.percentage}%)</span>
                  )}
                  <span className="text-sm font-medium text-vizla-text-primary">
                    {showRevenue ? `$${(item.value / 1000).toFixed(0)}k` : item.value.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-gray-900 to-gray-800 h-2 rounded-full transition-all duration-700 ease-out hover:from-gray-800 hover:to-gray-700"
                  style={{ 
                    width: `${(item.value / max) * 100}%`,
                    animationDelay: `${index * 100}ms`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced Detailed Breakdown Table with better UX
const DetailedBreakdownTable: React.FC<{
  data: DetailedBreakdownData[];
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
  onExport: () => void;
  isLoading?: boolean;
}> = ({ data, filters, onFilterChange, onExport, isLoading }) => {
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  const toggleClient = useCallback((client: string) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(client)) {
        newSet.delete(client);
      } else {
        newSet.add(client);
      }
      return newSet;
    });
  }, []);

  const getHeatMapColor = useCallback((value: number, maxValue: number) => {
    if (value === 0) return 'bg-gray-500/20 text-gray-400';
    const intensity = value / maxValue;
    if (intensity >= 0.8) return 'bg-gray-900 text-white';
    if (intensity >= 0.6) return 'bg-gray-800 text-white';
    if (intensity >= 0.4) return 'bg-gray-700 text-white';
    if (intensity >= 0.2) return 'bg-gray-600 text-white';
    return 'bg-gray-500 text-white';
  }, []);

  const maxValue = useMemo(() => {
    return Math.max(
      ...data.flatMap(client => 
        client.zones.flatMap(zone => [
          zone.drivers.johnD, 
          zone.drivers.janeS, 
          zone.drivers.mikeR, 
          zone.drivers.sarahK
        ])
      )
    );
  }, [data]);

  if (isLoading) {
    return (
      <Card className="bg-vizla-glass/50 backdrop-blur-xl border border-vizla-glassBorder">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-vizla-text-primary">Detailed Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-vizla-glass/30 rounded" />
            <div className="h-64 bg-vizla-glass/20 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-vizla-glass/50 backdrop-blur-xl border border-vizla-glassBorder">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-vizla-text-primary">Detailed Breakdown</CardTitle>
          <div className="flex items-center gap-3">
            <Select value={filters.market} onValueChange={(value) => onFilterChange({ market: value })}>
              <SelectTrigger className="w-32 bg-vizla-glass border-vizla-glassBorder">
                <SelectValue placeholder="All Markets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Markets</SelectItem>
                <SelectItem value="houston">Houston</SelectItem>
                <SelectItem value="maryland">Maryland</SelectItem>
                <SelectItem value="dc">DC</SelectItem>
                <SelectItem value="virginia">Virginia</SelectItem>
                <SelectItem value="delaware">Delaware</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.zone} onValueChange={(value) => onFilterChange({ zone: value })}>
              <SelectTrigger className="w-28 bg-vizla-glass border-vizla-glassBorder">
                <SelectValue placeholder="All Zones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                <SelectItem value="north">North</SelectItem>
                <SelectItem value="south">South</SelectItem>
                <SelectItem value="east">East</SelectItem>
                <SelectItem value="west">West</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => onFilterChange({ status: value })}>
              <SelectTrigger className="w-32 bg-vizla-glass border-vizla-glassBorder">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="located">Located</SelectItem>
                <SelectItem value="dispatched">Dispatched</SelectItem>
                <SelectItem value="stashed">Stashed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="bank-gps">Bank GPS</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-40 bg-vizla-glass border-vizla-glassBorder text-vizla-text-primary hover:bg-vizla-glass/80"
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {format(filters.dateRange.from, 'MMM dd')} - {format(filters.dateRange.to, 'MMM dd')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-vizla-glass border-vizla-glassBorder">
                <Calendar
                  mode="range"
                  selected={{ from: filters.dateRange.from, to: filters.dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      onFilterChange({ 
                        dateRange: { 
                          from: startOfDay(range.from), 
                          to: endOfDay(range.to) 
                        } 
                      });
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button 
              onClick={onExport}
              className="bg-slate-500 hover:bg-slate-600 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-vizla-glassBorder">
                <th className="text-left py-3 px-4 text-vizla-text-secondary font-medium">CLIENT</th>
                <th className="text-left py-3 px-4 text-vizla-text-secondary font-medium">ZONE</th>
                <th className="text-center py-3 px-4 text-vizla-text-secondary font-medium">JOHN D.</th>
                <th className="text-center py-3 px-4 text-vizla-text-secondary font-medium">JANE S.</th>
                <th className="text-center py-3 px-4 text-vizla-text-secondary font-medium">MIKE R.</th>
                <th className="text-center py-3 px-4 text-vizla-text-secondary font-medium">SARAH K.</th>
                <th className="text-center py-3 px-4 text-vizla-text-secondary font-medium">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {data.map((client, clientIndex) => (
                <React.Fragment key={clientIndex}>
                  {client.zones.map((zone, zoneIndex) => (
                    <tr key={`${clientIndex}-${zoneIndex}`} className="border-b border-vizla-glassBorder/50 hover:bg-vizla-glass/20 transition-colors">
                      {zoneIndex === 0 && (
                        <td 
                          rowSpan={client.zones.length} 
                          className="py-3 px-4 text-vizla-text-primary font-medium"
                        >
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleClient(client.client)}
                              className="p-0 h-auto text-vizla-text-primary hover:text-vizla-text-primary"
                            >
                              {expandedClients.has(client.client) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
                            {client.client}
                          </div>
                        </td>
                      )}
                      <td className="py-3 px-4 text-vizla-text-secondary">{zone.zone}</td>
                      <td className="py-3 px-4 text-center">
                        {zone.drivers.johnD > 0 ? (
                          <div className={`inline-flex items-center justify-center w-12 h-8 rounded text-sm font-medium ${getHeatMapColor(zone.drivers.johnD, maxValue)} hover:scale-105 transition-transform cursor-pointer`}>
                            {zone.drivers.johnD}
                          </div>
                        ) : (
                          <span className="text-vizla-text-muted">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {zone.drivers.janeS > 0 ? (
                          <div className={`inline-flex items-center justify-center w-12 h-8 rounded text-sm font-medium ${getHeatMapColor(zone.drivers.janeS, maxValue)} hover:scale-105 transition-transform cursor-pointer`}>
                            {zone.drivers.janeS}
                          </div>
                        ) : (
                          <span className="text-vizla-text-muted">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {zone.drivers.mikeR > 0 ? (
                          <div className={`inline-flex items-center justify-center w-12 h-8 rounded text-sm font-medium ${getHeatMapColor(zone.drivers.mikeR, maxValue)} hover:scale-105 transition-transform cursor-pointer`}>
                            {zone.drivers.mikeR}
                          </div>
                        ) : (
                          <span className="text-vizla-text-muted">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {zone.drivers.sarahK > 0 ? (
                          <div className={`inline-flex items-center justify-center w-12 h-8 rounded text-sm font-medium ${getHeatMapColor(zone.drivers.sarahK, maxValue)} hover:scale-105 transition-transform cursor-pointer`}>
                            {zone.drivers.sarahK}
                          </div>
                        ) : (
                          <span className="text-vizla-text-muted">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-8 rounded bg-vizla-glass/50 text-vizla-text-primary text-sm font-medium">
                          {zone.total}
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

// Functional components for better interactivity
const KPIDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  kpiType: string;
  data: any;
}> = ({ isOpen, onClose, kpiType, data }) => {
  const getKPIDetails = (type: string) => {
    switch (type) {
      case 'located':
        return {
          title: 'Located Vehicles',
          description: 'Total number of vehicles currently located and tracked in the system.',
          details: [
            { label: 'New Today', value: '+45' },
            { label: 'This Week', value: '+312' },
            { label: 'This Month', value: '+1,234' },
            { label: 'Growth Rate', value: '+12.5%' }
          ]
        };
      case 'bankGps':
        return {
          title: 'Bank GPS Vehicles',
          description: 'Vehicles equipped with Bank GPS tracking systems.',
          details: [
            { label: 'Active Trackers', value: '142' },
            { label: 'Inactive', value: '8' },
            { label: 'Battery Low', value: '3' },
            { label: 'Signal Lost', value: '2' }
          ]
        };
      case 'avgTime':
        return {
          title: 'Average Location Time',
          description: 'Average duration vehicles remain in located status.',
          details: [
            { label: 'Current Avg', value: '2.3 days' },
            { label: 'Previous Avg', value: '2.8 days' },
            { label: 'Improvement', value: '+0.5 days' },
            { label: 'Target', value: '< 2.0 days' }
          ]
        };
      default:
        return {
          title: 'KPI Details',
          description: 'Detailed breakdown of this metric.',
          details: []
        };
    }
  };

  const kpiDetails = getKPIDetails(kpiType);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-vizla-glass/95 backdrop-blur-xl border border-vizla-glassBorder text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">{kpiDetails.title}</DialogTitle>
          <DialogDescription className="text-gray-300">
            {kpiDetails.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {kpiDetails.details.map((detail, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-vizla-glass/30 rounded-lg">
              <span className="text-gray-300">{detail.label}</span>
              <span className="text-white font-medium">{detail.value}</span>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white border-white/20">
            Close
          </Button>
          <Button className="bg-slate-500 hover:bg-slate-600 text-white">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Full Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ChartDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  chartType: string;
  selectedItem: ChartData | null;
}> = ({ isOpen, onClose, chartType, selectedItem }) => {
  if (!selectedItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-vizla-glass/95 backdrop-blur-xl border border-vizla-glassBorder text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            {chartType} - {selectedItem.name}
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Detailed breakdown for {selectedItem.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-vizla-glass/30 rounded-lg">
              <div className="text-sm text-gray-300">Total Value</div>
              <div className="text-2xl font-bold text-white">{selectedItem.value.toLocaleString()}</div>
            </div>
            {selectedItem.percentage && (
              <div className="p-4 bg-vizla-glass/30 rounded-lg">
                <div className="text-sm text-gray-300">Percentage</div>
                <div className="text-2xl font-bold text-white">{selectedItem.percentage}%</div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-white">Recent Activity</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-vizla-glass/20 rounded">
                <span className="text-gray-300">Last 7 days</span>
                <span className="text-white">+{Math.floor(Math.random() * 20) + 5}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-vizla-glass/20 rounded">
                <span className="text-gray-300">Last 30 days</span>
                <span className="text-white">+{Math.floor(Math.random() * 100) + 20}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white border-white/20">
            Close
          </Button>
          <Button className="bg-slate-500 hover:bg-slate-600 text-white">
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function LocatedDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    market: 'all',
    status: 'all',
    zone: 'all',
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date()
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(generateMockData());
  const [selectedKPI, setSelectedKPI] = useState<string | null>(null);
  const [selectedChartItem, setSelectedChartItem] = useState<{ type: string; item: ChartData } | null>(null);
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New vehicle located in Houston', time: '2 min ago', type: 'info' },
    { id: 2, message: 'Bank GPS tracker offline', time: '15 min ago', type: 'warning' },
    { id: 3, message: 'Weekly report ready', time: '1 hour ago', type: 'success' }
  ]);

  // Simulate data loading
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setData(generateMockData());
    setIsLoading(false);
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(refreshData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleFilterChange = useCallback((newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // In a real app, this would trigger a new API call
    setIsLoading(true);
    setTimeout(() => {
      setData(generateMockData());
      setIsLoading(false);
    }, 500);
  }, []);


  const handleKPIClick = useCallback((kpi: string) => {
    setSelectedKPI(kpi);
    toast.success(`Opening details for ${kpi}`, {
      description: 'Loading detailed metrics...'
    });
  }, []);

  const handleChartItemClick = useCallback((type: string, item: ChartData) => {
    setSelectedChartItem({ type, item });
    toast.info(`Viewing details for ${item.name}`, {
      description: `From ${type} chart`
    });
  }, []);

  const handleExport = useCallback(() => {
    const csvData = data.detailedBreakdown.map(client => 
      client.zones.map(zone => ({
        client: client.client,
        zone: zone.zone,
        johnD: zone.drivers.johnD,
        janeS: zone.drivers.janeS,
        mikeR: zone.drivers.mikeR,
        sarahK: zone.drivers.sarahK,
        total: zone.total
      }))
    ).flat();

    const csvContent = [
      ['Client', 'Zone', 'John D', 'Jane S', 'Mike R', 'Sarah K', 'Total'],
      ...csvData.map(row => [row.client, row.zone, row.johnD, row.janeS, row.mikeR, row.sarahK, row.total])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `located-dashboard-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('CSV exported successfully!', {
      description: 'File downloaded to your device'
    });
  }, [data]);

  const handleNotificationClick = useCallback((notification: any) => {
    toast.info(notification.message, {
      description: `Received ${notification.time}`
    });
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    toast.success('Notifications cleared');
  }, []);

  return (
    <div className="min-h-screen bg-vizla-background">
        {/* Enhanced Header */}
        <div className="sticky top-0 z-10 bg-vizla-background/95 backdrop-blur-xl border-b border-vizla-glassBorder">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-lg hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                  aria-expanded={sidebarOpen}
                  aria-label="Open navigation menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <Badge variant="outline" className="bg-slate-500/20 text-slate-400 border-slate-500/30">
                  Live Data
                </Badge>
              </div>
              
              <div className="flex items-center gap-4">
              {/* Global Filters */}
              <div className="flex items-center gap-3">
                <Select value={filters.market} onValueChange={(value) => handleFilterChange({ market: value })}>
                  <SelectTrigger className="w-32 bg-vizla-glass border-vizla-glassBorder">
                    <SelectValue placeholder="All Markets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Markets</SelectItem>
                    <SelectItem value="houston">Houston</SelectItem>
                    <SelectItem value="maryland">Maryland</SelectItem>
                    <SelectItem value="dc">DC</SelectItem>
                    <SelectItem value="virginia">Virginia</SelectItem>
                    <SelectItem value="delaware">Delaware</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.status} onValueChange={(value) => handleFilterChange({ status: value })}>
                  <SelectTrigger className="w-32 bg-vizla-glass border-vizla-glassBorder">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="located">Located</SelectItem>
                    <SelectItem value="dispatched">Dispatched</SelectItem>
                    <SelectItem value="stashed">Stashed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="bank-gps">Bank GPS</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.zone} onValueChange={(value) => handleFilterChange({ zone: value })}>
                  <SelectTrigger className="w-32 bg-vizla-glass border-vizla-glassBorder">
                    <SelectValue placeholder="All Zones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Zones</SelectItem>
                    <SelectItem value="north">North</SelectItem>
                    <SelectItem value="south">South</SelectItem>
                    <SelectItem value="east">East</SelectItem>
                    <SelectItem value="west">West</SelectItem>
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-40 bg-vizla-glass border-vizla-glassBorder text-vizla-text-primary hover:bg-vizla-glass/80"
                    >
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {format(filters.dateRange.from, 'MMM dd')} - {format(filters.dateRange.to, 'MMM dd')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-vizla-glass border-vizla-glassBorder">
                    <Calendar
                      mode="range"
                      selected={{ from: filters.dateRange.from, to: filters.dateRange.to }}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          handleFilterChange({ 
                            dateRange: { 
                              from: startOfDay(range.from), 
                              to: endOfDay(range.to) 
                            } 
                          });
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={refreshData}
                  disabled={isLoading}
                  className="text-vizla-text-secondary hover:text-vizla-text-primary"
                >
                  <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-vizla-text-secondary hover:text-vizla-text-primary relative">
                      <Bell className="w-5 h-5" />
                      {notifications.length > 0 && (
                        <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs bg-red-500 text-white">
                          {notifications.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 bg-vizla-glass/95 backdrop-blur-xl border border-vizla-glassBorder text-white">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-white">Notifications</h4>
                      <Button variant="ghost" size="sm" onClick={clearNotifications} className="text-gray-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-gray-400 text-sm">No notifications</p>
                      ) : (
                        notifications.map(notification => (
                          <div 
                            key={notification.id}
                            className="p-3 bg-vizla-glass/30 rounded-lg cursor-pointer hover:bg-vizla-glass/50 transition-colors"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <p className="text-sm text-white">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                <Button variant="ghost" size="icon" className="text-vizla-text-secondary hover:text-vizla-text-primary">
                  <Settings className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-vizla-text-secondary hover:text-vizla-text-primary">
                  <User className="w-5 h-5" />
                </Button>
                <DataSourceToggle />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Enhanced KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <KPICard 
            title="Located" 
            value={data.kpis.located.toLocaleString()} 
            icon={<MapPin className="w-4 h-4" />}
            trend="up"
            isLoading={isLoading}
            onClick={() => handleKPIClick('located')}
          />
          <KPICard 
            title="Bank GPS" 
            value={data.kpis.bankGps} 
            icon={<Car className="w-4 h-4" />}
            trend="stable"
            isLoading={isLoading}
            onClick={() => handleKPIClick('bankGps')}
          />
          <KPICard 
            title="Avg. Time" 
            value={`${data.kpis.avgTime} d`} 
            icon={<Clock className="w-4 h-4" />}
            trend="down"
            isLoading={isLoading}
            onClick={() => handleKPIClick('avgTime')}
          />
          <KPICard 
            title="5+ days" 
            value={data.kpis.fivePlusDays} 
            icon={<AlertTriangle className="w-4 h-4" />}
            trend="up"
            isLoading={isLoading}
            onClick={() => handleKPIClick('fivePlusDays')}
          />
          <KPICard 
            title="Blocked in" 
            value={data.kpis.blockedIn} 
            icon={<CheckCircle className="w-4 h-4" />}
            trend="stable"
            isLoading={isLoading}
            onClick={() => handleKPIClick('blockedIn')}
          />
          <KPICard 
            title="Stashed" 
            value={data.kpis.stashed} 
            icon={<TrendingUp className="w-4 h-4" />}
            trend="up"
            isLoading={isLoading}
            onClick={() => handleKPIClick('stashed')}
          />
        </div>

        {/* Enhanced Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <EnhancedBarChart 
            title="Located by Client" 
            data={data.locatedByClient} 
            isLoading={isLoading}
            onItemClick={handleChartItemClick}
          />
          <EnhancedBarChart 
            title="Located by Market" 
            data={data.locatedByMarket} 
            isLoading={isLoading}
            onItemClick={handleChartItemClick}
          />
          <EnhancedBarChart 
            title="Awaiting Tow by Driver" 
            data={data.awaitingTowByDriver} 
            isLoading={isLoading}
            onItemClick={handleChartItemClick}
          />
          <EnhancedBarChart 
            title="Located Revenue" 
            data={data.locatedRevenue} 
            showRevenue 
            isLoading={isLoading}
            onItemClick={handleChartItemClick}
          />
        </div>

        {/* Enhanced Detailed Breakdown */}
        <DetailedBreakdownTable
          data={data.detailedBreakdown}
          filters={filters}
          onFilterChange={handleFilterChange}
          onExport={handleExport}
          isLoading={isLoading}
        />
      </div>

      {/* Modals */}
      <KPIDetailModal
        isOpen={selectedKPI !== null}
        onClose={() => setSelectedKPI(null)}
        kpiType={selectedKPI || ''}
        data={data}
      />

      <ChartDetailModal
        isOpen={selectedChartItem !== null}
        onClose={() => setSelectedChartItem(null)}
        chartType={selectedChartItem?.type || ''}
        selectedItem={selectedChartItem?.item || null}
      />

      {/* Scrim - shows when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-[50] bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - shows when hamburger is clicked */}
      {sidebarOpen && (
        <div className="fixed top-0 left-0 z-[60] w-72 h-screen bg-vizla-elev1/95 backdrop-blur-md ring-1 ring-vizla-glassBorder text-vizla-text-secondary">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>
      )}
    </div>
  );
}