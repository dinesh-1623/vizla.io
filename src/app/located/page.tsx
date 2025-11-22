'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Download, Calendar, Filter, Bell, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';

// Types for the clean dashboard
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
}

interface DetailedBreakdownRow {
  client: string;
  zone: string;
  johnD: number;
  janeS: number;
  mikeR: number;
  sarahK: number;
  total: number;
}

const LocatedPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Filter state - clean and simple
  const [market, setMarket] = useState<string>('All Markets');
  const [status, setStatus] = useState<string>('All Statuses');
  const [zone, setZone] = useState<string>('All Zones');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  // Generate clean mock data matching Naz's requirements
  const generateMockData = (): {
    kpis: KPIData;
    locatedByClient: ChartData[];
    locatedByMarket: ChartData[];
    awaitingTowByDriver: ChartData[];
    locatedRevenue: ChartData[];
    detailedBreakdown: DetailedBreakdownRow[];
  } => {
    return {
      kpis: {
        located: 1234,
        bankGps: 150,
        avgTime: 2.3,
        fivePlusDays: 87,
        blockedIn: 15,
        stashed: 42
      },
      locatedByClient: [
        { name: 'Client A', value: 300, percentage: 24 },
        { name: 'Client B', value: 200, percentage: 16 },
        { name: 'Client C', value: 100, percentage: 8 },
        { name: 'Client D', value: 60, percentage: 5 }
      ],
      locatedByMarket: [
        { name: 'Houston', value: 280, percentage: 23 },
        { name: 'Maryland', value: 240, percentage: 19 },
        { name: 'DC', value: 180, percentage: 15 },
        { name: 'Virginia', value: 120, percentage: 10 },
        { name: 'Delaware', value: 80, percentage: 6 }
      ],
      awaitingTowByDriver: [
        { name: 'John D.', value: 160, percentage: 13 },
        { name: 'Jane S.', value: 130, percentage: 11 },
        { name: 'Mike R.', value: 110, percentage: 9 },
        { name: 'Sarah K.', value: 80, percentage: 6 }
      ],
      locatedRevenue: [
        { name: 'Client A', value: 30000, percentage: 37 },
        { name: 'Client B', value: 15000, percentage: 18 },
        { name: 'Client C', value: 28000, percentage: 35 },
        { name: 'Client D', value: 8000, percentage: 10 }
      ],
      detailedBreakdown: [
        { client: 'Client A', zone: 'North', johnD: 50, janeS: 0, mikeR: 0, sarahK: 0, total: 50 },
        { client: 'Client A', zone: 'West', johnD: 0, janeS: 75, mikeR: 0, sarahK: 0, total: 75 },
        { client: 'Client B', zone: 'North', johnD: 100, janeS: 0, mikeR: 0, sarahK: 0, total: 100 },
        { client: 'Client B', zone: 'East', johnD: 0, janeS: 50, mikeR: 0, sarahK: 0, total: 50 },
        { client: 'Client C', zone: 'South', johnD: 70, janeS: 0, mikeR: 0, sarahK: 0, total: 70 },
        { client: 'Client D', zone: 'West', johnD: 0, janeS: 0, mikeR: 0, sarahK: 60, total: 60 }
      ]
    };
  };

  const mockData = generateMockData();

  // Clean, compact KPI card component - much smaller for simple numbers
  const CompactKPICard: React.FC<{ label: string; value: string | number; unit?: string }> = ({ label, value, unit }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-3 text-center hover:shadow-sm transition-shadow">
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className="text-lg font-bold text-gray-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && <span className="text-xs text-gray-500 ml-1">{unit}</span>}
      </div>
    </div>
  );

  // Clean horizontal bar chart component
  const HorizontalBarChart: React.FC<{ title: string; data: ChartData[]; showRevenue?: boolean }> = ({ title, data, showRevenue = false }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{item.name}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {showRevenue ? `$${(item.value / 1000).toFixed(0)}k` : item.value.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-slate-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  // Clean detailed breakdown table
  const DetailedBreakdownTable: React.FC<{ data: DetailedBreakdownRow[] }> = ({ data }) => {
    const getHeatMapColor = (value: number) => {
      if (value === 0) return 'bg-gray-50';
      if (value <= 25) return 'bg-slate-100';
      if (value <= 50) return 'bg-slate-200';
      if (value <= 75) return 'bg-slate-300';
      return 'bg-slate-400';
    };

    return (
      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold text-gray-900">Detailed Breakdown</CardTitle>
            <Button 
              onClick={() => {
                const csvContent = [
                  ['CLIENT', 'ZONE', 'JOHN D.', 'JANE S.', 'MIKE R.', 'SARAH K.', 'TOTAL'],
                  ...data.map(row => [row.client, row.zone, row.johnD, row.janeS, row.mikeR, row.sarahK, row.total])
                ].map(row => row.join(',')).join('\n');
                
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `located-dashboard-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
                
                toast.success('CSV exported successfully!');
              }}
              className="bg-slate-500 hover:bg-slate-600 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">CLIENT</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">ZONE</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">JOHN D.</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">JANE S.</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">MIKE R.</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">SARAH K.</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{row.client}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{row.zone}</td>
                    <td className={`py-3 px-4 text-center text-sm font-medium ${getHeatMapColor(row.johnD)}`}>
                      {row.johnD || '-'}
                    </td>
                    <td className={`py-3 px-4 text-center text-sm font-medium ${getHeatMapColor(row.janeS)}`}>
                      {row.janeS || '-'}
                    </td>
                    <td className={`py-3 px-4 text-center text-sm font-medium ${getHeatMapColor(row.mikeR)}`}>
                      {row.mikeR || '-'}
                    </td>
                    <td className={`py-3 px-4 text-center text-sm font-medium ${getHeatMapColor(row.sarahK)}`}>
                      {row.sarahK || '-'}
                    </td>
                    <td className="py-3 px-4 text-center text-sm font-bold text-gray-900">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Simple data loading for demo
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);



  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Clean Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium text-gray-700">Back to Dashboard</span>
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Located Dashboard</h1>
                <p className="text-sm text-gray-600 mt-1">Vizla.io - Executive Summary</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                onClick={() => toast.success('Data refreshed!')}
                disabled={isLoading}
                variant="outline"
                className="border-gray-300"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" className="border-gray-300">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" className="border-gray-300">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" className="border-gray-300">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Clean Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <Select value={market} onValueChange={setMarket}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Markets">All Markets</SelectItem>
                <SelectItem value="Houston">Houston</SelectItem>
                <SelectItem value="Maryland">Maryland</SelectItem>
                <SelectItem value="DC">DC</SelectItem>
                <SelectItem value="Virginia">Virginia</SelectItem>
                <SelectItem value="Delaware">Delaware</SelectItem>
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Statuses">All Statuses</SelectItem>
                <SelectItem value="Located">Located</SelectItem>
                <SelectItem value="Stashed">Stashed</SelectItem>
                <SelectItem value="Blocked">Blocked</SelectItem>
                <SelectItem value="Towed">Towed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={zone} onValueChange={setZone}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Zones">All Zones</SelectItem>
                <SelectItem value="North">North</SelectItem>
                <SelectItem value="South">South</SelectItem>
                <SelectItem value="East">East</SelectItem>
                <SelectItem value="West">West</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="border-gray-300">
                  <Calendar className="w-4 h-4 mr-2" />
                  Date Range
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Compact KPI Cards - Much smaller for simple numbers */}
        <div className="grid grid-cols-6 gap-3">
          <CompactKPICard label="Located" value={mockData.kpis.located} />
          <CompactKPICard label="Bank GPS" value={mockData.kpis.bankGps} />
          <CompactKPICard label="Avg. Time" value={mockData.kpis.avgTime} unit="d" />
          <CompactKPICard label="5+ days" value={mockData.kpis.fivePlusDays} />
          <CompactKPICard label="Blocked in" value={mockData.kpis.blockedIn} />
          <CompactKPICard label="Stashed" value={mockData.kpis.stashed} />
        </div>

        {/* Clean Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <HorizontalBarChart 
            title="Located by Client" 
            data={mockData.locatedByClient} 
          />
          <HorizontalBarChart 
            title="Located by Market" 
            data={mockData.locatedByMarket} 
          />
          <HorizontalBarChart 
            title="Awaiting Tow by Driver" 
            data={mockData.awaitingTowByDriver} 
          />
          <HorizontalBarChart 
            title="Located Revenue" 
            data={mockData.locatedRevenue} 
            showRevenue 
          />
        </div>

        {/* Detailed Breakdown Table */}
        <DetailedBreakdownTable data={mockData.detailedBreakdown} />
      </div>
    </div>
  );
};

export default LocatedPage;
