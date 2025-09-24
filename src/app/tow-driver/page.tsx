'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertCircle, Calendar } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Skeleton } from '@/components/ui/Skeleton';
import { DatePicker } from '@/components/tow-driver/DatePicker';
import { JobList } from '@/features/tow-driver/components/JobList';
import { JobFilters } from '@/features/tow-driver/components/JobFilters';
import { BatchPanel } from '@/features/tow-driver/components/BatchPanel';
import { fetchLocatedByDate, fetchDefaultLocated } from '@/features/tow-driver/data/fetchLocated';
import { getDefaultGid, getTodayDate, getMostRecentDate, getAvailableDates } from '@/data/dateTabMap';
import { LocatedJob, FetchResult } from '@/lib/types';
import { 
  loadTowDriverState, 
  saveSelectedDate, 
  saveDestinationMode, 
  saveSelectedStorageLot, 
  saveSelectedStatuses, 
  saveBatchState 
} from '@/lib/storage';

const TowDriverPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<FetchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [filters, setFilters] = useState({
    client: '',
    zone: '',
    driver: ''
  });
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set(['Located', 'Stashed']));
  const [destinationMode, setDestinationMode] = useState<'storage' | 'stash'>('storage');
  const [selectedStorageLot, setSelectedStorageLot] = useState('White Marsh');
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  // Initialize state from localStorage
  useEffect(() => {
    const savedState = loadTowDriverState();
    const today = getTodayDate();
    const availableDates = getAvailableDates();
    
    // Initialize date from localStorage or default logic
    let defaultDate = today;
    if (savedState.selectedDate && availableDates.includes(savedState.selectedDate)) {
      defaultDate = savedState.selectedDate;
    } else if (!availableDates.includes(today)) {
      const mostRecent = getMostRecentDate();
      if (mostRecent) {
        defaultDate = mostRecent;
      } else if (availableDates.length > 0) {
        defaultDate = availableDates[0];
      }
    }
    
    setSelectedDate(defaultDate);

    // Initialize other state from localStorage
    if (savedState.destinationMode) {
      setDestinationMode(savedState.destinationMode);
    }
    if (savedState.selectedStorageLot) {
      setSelectedStorageLot(savedState.selectedStorageLot);
    }
    if (savedState.selectedStatuses) {
      setSelectedStatuses(new Set(savedState.selectedStatuses));
    }
    if (savedState.batchJobIds) {
      setSelectedJobIds(new Set(savedState.batchJobIds));
    }
    if (savedState.currentJobIndex !== undefined) {
      setCurrentJobIndex(savedState.currentJobIndex);
    }
  }, []);

  // Load data when date changes
  useEffect(() => {
    if (selectedDate) {
      loadData(selectedDate);
    }
  }, [selectedDate]);

  // Persist state changes to localStorage
  useEffect(() => {
    if (selectedDate) {
      saveSelectedDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    saveDestinationMode(destinationMode);
  }, [destinationMode]);

  useEffect(() => {
    saveSelectedStorageLot(selectedStorageLot);
  }, [selectedStorageLot]);

  useEffect(() => {
    saveSelectedStatuses(selectedStatuses);
  }, [selectedStatuses]);

  useEffect(() => {
    saveBatchState(selectedJobIds, currentJobIndex);
  }, [selectedJobIds, currentJobIndex]);

  const loadData = async (date: string) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log(`🔄 Loading data for ${date}...`);
      
      const result = await fetchLocatedByDate(date);
      setData(result);
      setLastFetchTime(new Date());
      
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

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClearFilter = (key: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: ''
    }));
  };

  const handleClearAllFilters = () => {
    setFilters({
      client: '',
      zone: '',
      driver: ''
    });
    setSelectedStatuses(new Set(['Located', 'Stashed']));
  };

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  const handleDestinationModeChange = (mode: 'storage' | 'stash') => {
    setDestinationMode(mode);
  };

  const handleStorageLotChange = (lot: string) => {
    setSelectedStorageLot(lot);
  };

  const handleStartNav = (job: LocatedJob) => {
    console.log('Starting navigation to:', job);
    // Navigation is handled in JobRow component
  };

  const handleAddToBatch = (job: LocatedJob) => {
    setSelectedJobIds(prev => new Set([...prev, job.id]));
  };

  const handleRemoveFromBatch = (job: LocatedJob) => {
    setSelectedJobIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(job.id);
      return newSet;
    });
  };

  const handleClearBatch = () => {
    setSelectedJobIds(new Set());
    setCurrentJobIndex(0);
  };

  const handleStartRoute = (jobs: LocatedJob[]) => {
    console.log('Starting route for jobs:', jobs);
    setCurrentJobIndex(0);
  };

  const handleNextStop = (index: number) => {
    setCurrentJobIndex(index);
  };

  // Filter jobs based on current filters
  const filteredJobs = useMemo(() => {
    if (!data?.rows) return [];
    
    console.log('🔍 Filtering jobs:', {
      totalJobs: data.rows.length,
      selectedStatuses: Array.from(selectedStatuses),
      filters,
      sampleJob: data.rows[0]
    });
    
    const filtered = data.rows.filter(job => {
      if (filters.client && job.client !== filters.client) return false;
      if (filters.zone && job.zone !== filters.zone) return false;
      if (filters.driver && (job.driver === '-' ? 'Unassigned' : job.driver) !== filters.driver) return false;
      if (selectedStatuses.size > 0 && !selectedStatuses.has(job.status)) return false;
      return true;
    });
    
    console.log('✅ Filtered jobs result:', {
      filteredCount: filtered.length,
      sampleFilteredJob: filtered[0]
    });
    
    return filtered;
  }, [data?.rows, filters, selectedStatuses]);

  // Get selected jobs in order
  const selectedJobs = useMemo(() => {
    if (!data?.rows) return [];
    return data.rows.filter(job => selectedJobIds.has(job.id));
  }, [data?.rows, selectedJobIds]);

  // Compute stats from filtered data
  const stats = useMemo(() => {
    if (!filteredJobs.length) return null;
    
    const total = filteredJobs.length;
    const byStatus = filteredJobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byZone = filteredJobs.reduce((acc, job) => {
      acc[job.zone] = (acc[job.zone] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byDriver = filteredJobs.reduce((acc, job) => {
      const driver = job.driver === '-' ? 'Unassigned' : job.driver;
      acc[driver] = (acc[driver] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, byStatus, byZone, byDriver };
  }, [filteredJobs]);

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

              <div className="flex items-center gap-4">
                {/* Data Freshness Pill */}
                {lastFetchTime && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder">
                    <div className="w-2 h-2 rounded-full bg-vizla-success"></div>
                    <span className="text-xs text-vizla-text-muted">
                      Updated {lastFetchTime.toLocaleTimeString()}
                    </span>
                  </div>
                )}
                
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
                className="ml-auto flex items-center gap-2 px-3 py-2 rounded-md bg-vizla-danger text-white text-sm font-medium hover:bg-vizla-danger/80 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
                aria-label="Retry loading data"
              >
                <RefreshCw className="w-4 h-4" />
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

        {/* Filters */}
        {!isLoading && data && data.rows.length > 0 && (
          <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
            <div className="p-6">
              <JobFilters
                jobs={data.rows}
                filters={filters}
                selectedStatuses={selectedStatuses}
                destinationMode={destinationMode}
                selectedStorageLot={selectedStorageLot}
                onFilterChange={handleFilterChange}
                onStatusToggle={handleStatusToggle}
                onClearFilter={handleClearFilter}
                onClearAll={handleClearAllFilters}
                onDestinationModeChange={handleDestinationModeChange}
                onStorageLotChange={handleStorageLotChange}
              />
            </div>
          </GlassCard>
        )}

        {/* Main Content - Two Column Layout */}
        {!isLoading && data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Jobs List */}
            <div className="lg:col-span-2">
              <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
                <div className="p-6">
                  <JobList
                    jobs={filteredJobs}
                    destinationMode={destinationMode}
                    selectedStorageLot={selectedStorageLot}
                    selectedJobIds={selectedJobIds}
                    onStartNav={handleStartNav}
                    onAddToBatch={handleAddToBatch}
                    onRemoveFromBatch={handleRemoveFromBatch}
                  />
                </div>
              </GlassCard>
            </div>

            {/* Right Column - Batch Panel */}
            <div className="lg:col-span-1">
              <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder h-fit">
                <div className="p-6">
                  <BatchPanel
                    selectedJobs={selectedJobs}
                    destinationMode={destinationMode}
                    selectedStorageLot={selectedStorageLot}
                    onRemoveJob={(jobId) => {
                      const job = selectedJobs.find(j => j.id === jobId);
                      if (job) handleRemoveFromBatch(job);
                    }}
                    onClearBatch={handleClearBatch}
                    onStartRoute={handleStartRoute}
                    onNextStop={handleNextStop}
                    currentJobIndex={currentJobIndex}
                  />
                </div>
              </GlassCard>
            </div>
          </div>
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
