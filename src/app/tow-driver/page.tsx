'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertCircle, Calendar } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Skeleton } from '@/components/ui/Skeleton';
import { DatePicker } from '@/components/tow-driver/DatePicker';
import { fetchLocatedByDate, fetchDefaultLocated } from '@/features/tow-driver/data/fetchLocated';
import { getDefaultGid, getTodayDate, getMostRecentDate, getAvailableDates } from '@/data/dateTabMap';
import { LocatedJob, FetchResult } from '@/lib/types';

const TowDriverPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<FetchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Initialize default date
  useEffect(() => {
    const today = getTodayDate();
    const availableDates = getAvailableDates();
    
    // Default selection logic: today if available, otherwise most recent
    let defaultDate = today;
    if (!availableDates.includes(today)) {
      const mostRecent = getMostRecentDate();
      if (mostRecent) {
        defaultDate = mostRecent;
      } else if (availableDates.length > 0) {
        defaultDate = availableDates[0];
      }
    }
    
    setSelectedDate(defaultDate);
  }, []);

  // Load data when date changes
  useEffect(() => {
    if (selectedDate) {
      loadData(selectedDate);
    }
  }, [selectedDate]);

  const loadData = async (date: string) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log(`🔄 Loading data for ${date}...`);
      
      const result = await fetchLocatedByDate(date);
      setData(result);
      
      console.log(`✅ Loaded ${result.meta.count} jobs from ${result.meta.source}`);
    } catch (err) {
      console.error('❌ Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const handleRefresh = () => {
    if (selectedDate) {
      loadData(selectedDate);
    }
  };

  // Compute stats from loaded data
  const stats = useMemo(() => {
    if (!data?.rows) return null;
    
    const rows = data.rows;
    const total = rows.length;
    const byStatus = rows.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byZone = rows.reduce((acc, job) => {
      acc[job.zone] = (acc[job.zone] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byDriver = rows.reduce((acc, job) => {
      const driver = job.driver === '-' ? 'Unassigned' : job.driver;
      acc[driver] = (acc[driver] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, byStatus, byZone, byDriver };
  }, [data]);

  return (
    <div className="min-h-screen bg-vizla-canvas text-vizla-text-primary">
      <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Header */}
        <div className="sticky top-0 z-30">
          <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                  aria-label="Go back to dashboard"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm font-medium text-vizla-text-secondary">Back to Dashboard</span>
                </button>

                <div>
                  <SectionHeading
                    title="Tow Truck Driver View"
                    subtitle="Real-time dispatch data from Google Sheets"
                    className="!mb-0"
                  />
                </div>
              </div>

              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                aria-label="Refresh Data"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium text-vizla-text-secondary">
                  {isLoading ? 'Loading...' : 'Refresh Data'}
                </span>
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Date Picker */}
        <div className="sticky top-28 z-20">
          <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Calendar className="w-5 h-5 text-vizla-text-muted" />
                <div>
                  <h3 className="text-sm font-medium text-vizla-text-primary">
                    Dispatch Date
                  </h3>
                  <p className="text-xs text-vizla-text-muted">
                    Select a date to view dispatch data
                  </p>
                </div>
              </div>
              
              <div className="w-64">
                <DatePicker
                  selectedDate={selectedDate}
                  onDateChange={handleDateChange}
                />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Data Source Caption */}
        {data && (
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-vizla-text-muted">
              <div className={`w-2 h-2 rounded-full ${data.meta.source === 'live' ? 'bg-vizla-success' : 'bg-vizla-warning'}`} />
              <span>
                Data source: <span className="font-medium text-vizla-text-secondary">{data.meta.source}</span>
              </span>
              <span>•</span>
              <span>{data.meta.date}</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-vizla-danger/10 border border-vizla-danger/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-vizla-danger" />
              <span className="text-sm font-medium text-vizla-danger">Error loading data: {error}</span>
              <button
                onClick={handleRefresh}
                className="ml-auto px-3 py-1 rounded-md bg-vizla-danger text-white text-sm font-medium hover:bg-vizla-danger/80 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <GlassCard key={i}>
                <div className="space-y-3">
                  <Skeleton className="h-3 w-24" />
                  <div className="flex items-end justify-between">
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-5 w-10 rounded-full" />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Stats Cards */}
        {!isLoading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <GlassCard>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-vizla-text-muted uppercase tracking-wider">
                    Total Jobs
                  </p>
                </div>
                <div className="text-2xl font-bold text-vizla-text-primary">
                  {stats.total}
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-vizla-text-muted uppercase tracking-wider">
                    By Status
                  </p>
                </div>
                <div className="space-y-1">
                  {Object.entries(stats.byStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between text-sm">
                      <span className="text-vizla-text-secondary">{status}</span>
                      <span className="font-medium text-vizla-text-primary">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-vizla-text-muted uppercase tracking-wider">
                    Top Zones
                  </p>
                </div>
                <div className="space-y-1">
                  {Object.entries(stats.byZone)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                    .map(([zone, count]) => (
                    <div key={zone} className="flex items-center justify-between text-sm">
                      <span className="text-vizla-text-secondary truncate">{zone}</span>
                      <span className="font-medium text-vizla-text-primary">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Jobs List */}
        {!isLoading && data && data.rows.length > 0 && (
          <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-vizla-text-primary mb-4">
                Dispatch Jobs ({data.rows.length})
              </h3>
              
              <div className="space-y-3">
                {data.rows.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-vizla-glass ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-sm font-medium text-vizla-text-primary truncate">
                          {job.makeModel}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          job.status === 'Located' ? 'bg-vizla-success/20 text-vizla-success' :
                          job.status === 'Blocked' ? 'bg-vizla-warning/20 text-vizla-warning' :
                          'bg-vizla-info/20 text-vizla-info'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-vizla-text-secondary">
                        <div>
                          <span className="text-vizla-text-muted">Client:</span> {job.client}
                        </div>
                        <div>
                          <span className="text-vizla-text-muted">Zone:</span> {job.zone}
                        </div>
                        <div>
                          <span className="text-vizla-text-muted">Driver:</span> {job.driver === '-' ? 'Unassigned' : job.driver}
                        </div>
                        <div>
                          <span className="text-vizla-text-muted">Plate:</span> {job.plate || 'N/A'}
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-vizla-text-muted">
                        {job.address}
                      </div>
                    </div>
                    
                    {job.notes && (
                      <div className="ml-4 text-xs text-vizla-text-muted max-w-xs">
                        {job.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        )}

        {/* Empty State */}
        {!isLoading && data && data.rows.length === 0 && (
          <GlassCard className="h-64 flex items-center justify-center text-center border-dashed border-vizla-borderSubtle">
            <div>
              <h3 className="text-lg font-semibold text-vizla-text-primary">No jobs found</h3>
              <p className="text-sm text-vizla-text-secondary mt-1">
                No dispatch jobs available for {selectedDate}
              </p>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default TowDriverPage;
