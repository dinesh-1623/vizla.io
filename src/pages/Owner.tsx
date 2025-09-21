import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockCars, DRIVERS } from '@/data/mockCars';
import { VehicleCard } from '@/components/driver/VehicleCard';
import { X, ArrowLeft, Grid3X3, List } from 'lucide-react';
import AppShell from '@/components/shell/AppShell';

type ViewMode = 'card' | 'grid';

const Owner: React.FC = () => {
  const navigate = useNavigate();
  
  // Filter states
  const [weekRange, setWeekRange] = useState('');
  const [client, setClient] = useState('');
  const [zone, setZone] = useState('');
  const [timeLocated, setTimeLocated] = useState('');
  const [driver, setDriver] = useState('');
  
  // Drilldown states
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  // Get unique values for filters
  const uniqueClients = useMemo(() => {
    const clients = new Set(mockCars.map((car) => car.client));
    return Array.from(clients).sort();
  }, []);

  // Persist view mode in localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('owner-view-mode') as ViewMode;
    if (savedViewMode && ['card', 'grid'].includes(savedViewMode)) {
      setViewMode(savedViewMode);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('owner-view-mode', viewMode);
  }, [viewMode]);

  // Persist selectedDriver in localStorage
  useEffect(() => {
    const savedDriver = localStorage.getItem('owner-selected-driver');
    if (savedDriver) {
      setSelectedDriver(savedDriver);
      setDriver(savedDriver);
    }
  }, []);

  useEffect(() => {
    if (selectedDriver) {
      localStorage.setItem('owner-selected-driver', selectedDriver);
    }
  }, [selectedDriver]);

  // Filter cars for summary (ignore Client filter)
  const filteredForSummary = useMemo(() => {
    return mockCars.filter((car) => {
      if (zone && car.zone !== zone) return false;
      if (timeLocated && car.timeLocated !== timeLocated) return false;
      return true;
    });
  }, [zone, timeLocated]);

  // Driver breakdown for summary
  const byDriver = useMemo(() => {
    const driverCounts = new Map<string, number>();
    DRIVERS.forEach(driverName => {
      const count = filteredForSummary.filter(car => car.assignedDriver === driverName).length;
      driverCounts.set(driverName, count);
    });
    
    return Array.from(driverCounts.entries())
      .map(([driver, count]) => ({ driver, count }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [filteredForSummary]);

  // Auto-select first driver when list appears
  useEffect(() => {
    if (byDriver.length > 0 && !selectedDriver) {
      const firstDriver = byDriver[0].driver;
      setSelectedDriver(firstDriver);
      setDriver(firstDriver);
    }
  }, [byDriver, selectedDriver]);

  // Base filtered cars for drilldown (respects selectedDriver and global filters, ignores Client for totals)
  const baseForDrilldown = useMemo(() => {
    return mockCars.filter((car) => {
      if (selectedDriver && car.assignedDriver !== selectedDriver) return false;
      if (zone && car.zone !== zone) return false;
      if (timeLocated && car.timeLocated !== timeLocated) return false;
      return true;
    });
  }, [selectedDriver, zone, timeLocated]);

  // Client breakdown for drilldown
  const clientBreakdown = useMemo(() => {
    const clientCounts = new Map<string, number>();
    baseForDrilldown.forEach(car => {
      const count = clientCounts.get(car.client) || 0;
      clientCounts.set(car.client, count + 1);
    });
    
    return Array.from(clientCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [baseForDrilldown]);

  // Zone breakdown (show all zones, even with 0 count)
  const allZones = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5', 'Zone 6', 'Zone 7', 'Zone 8'];
  const zoneBreakdown = useMemo(() => {
    const zoneCounts = new Map<string, number>();
    
    // Initialize all zones with 0
    allZones.forEach(zone => zoneCounts.set(zone, 0));
    
    // Count actual data
    let filteredCars = baseForDrilldown;
    if (selectedClient) {
      filteredCars = filteredCars.filter(car => car.client === selectedClient);
    }
    
    filteredCars.forEach(car => {
      const count = zoneCounts.get(car.zone) || 0;
      zoneCounts.set(car.zone, count + 1);
    });
    
    return Array.from(zoneCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [baseForDrilldown, selectedClient, allZones]);

  // Final results
  const results = useMemo(() => {
    return mockCars.filter((car) => {
      if (selectedDriver && car.assignedDriver !== selectedDriver) return false;
      if (selectedClient && car.client !== selectedClient) return false;
      if (selectedZone && car.zone !== selectedZone) return false;
      if (client && car.client !== client) return false;
      if (zone && car.zone !== zone) return false;
      if (timeLocated && car.timeLocated !== timeLocated) return false;
      return true;
    });
  }, [selectedDriver, selectedClient, selectedZone, client, zone, timeLocated]);

  // Clear functions
  const clearClient = () => setSelectedClient('');
  const clearZone = () => setSelectedZone('');
  const clearAllSelections = () => {
    setSelectedClient('');
    setSelectedZone('');
  };

  const clearBreadcrumb = (level: 'client' | 'zone') => {
    if (level === 'client') {
      setSelectedClient('');
      setSelectedZone('');
    } else if (level === 'zone') {
      setSelectedZone('');
    }
  };

  const handleDriverClick = (driverName: string) => {
    setSelectedDriver(driverName);
    setDriver(driverName);
    setSelectedClient('');
    setSelectedZone('');
  };

  const handleClientClick = (clientName: string) => {
    setSelectedClient(clientName);
    setSelectedZone('');
  };

  const handleZoneClick = (zoneName: string) => {
    setSelectedZone(zoneName);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        setViewMode(prev => prev === 'card' ? 'grid' : 'card');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hasActiveSelections = selectedClient || selectedZone;

  return (
    <AppShell title="Owner View · Drilldowns">
      {/* Sticky Header */}
      <header className="bg-white/5 backdrop-blur-md ring-1 ring-white/10 sticky top-0 z-40 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-neutral-200 ring-1 ring-white/10 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-emerald-400/60 transition-colors"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-100">Owner View · Drilldowns</h1>
            <p className="text-neutral-400 text-sm">Mock data only</p>
          </div>
        </div>
      </header>

        {/* Filters Bar */}
        <div className="bg-white/5 backdrop-blur-md ring-1 ring-white/10 sticky top-[72px] z-30 rounded-2xl p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Week Range */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Week Range
              </label>
              <div className="relative">
                <select
                  value={weekRange}
                  onChange={(e) => setWeekRange(e.target.value)}
                  className="w-full bg-white/5 text-neutral-100 ring-1 ring-white/10 rounded-xl px-3 py-2 pr-8 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all appearance-none"
                >
                  <option value="" className="bg-slate-900">Select week range</option>
                  <option value="this-week" className="bg-slate-900">This week</option>
                  <option value="previous-week" className="bg-slate-900">Previous week</option>
                </select>
                {weekRange && (
                  <button
                    onClick={() => setWeekRange('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-neutral-300 hover:text-white transition-colors"
                    aria-label="Clear week range filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Client */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Client
              </label>
              <div className="relative">
                <select
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="w-full bg-white/5 text-neutral-100 ring-1 ring-white/10 rounded-xl px-3 py-2 pr-8 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all appearance-none"
                >
                  <option value="" className="bg-slate-900">Select client</option>
                  {uniqueClients.map((c) => (
                    <option key={c} value={c} className="bg-slate-900">{c}</option>
                  ))}
                </select>
                {client && (
                  <button
                    onClick={() => setClient('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-neutral-300 hover:text-white transition-colors"
                    aria-label="Clear client filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Zone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Zone
              </label>
              <div className="relative">
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full bg-white/5 text-neutral-100 ring-1 ring-white/10 rounded-xl px-3 py-2 pr-8 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all appearance-none"
                >
                  <option value="" className="bg-slate-900">Select zone</option>
                  {allZones.map((z) => (
                    <option key={z} value={z} className="bg-slate-900">{z}</option>
                  ))}
                </select>
                {zone && (
                  <button
                    onClick={() => setZone('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-neutral-300 hover:text-white transition-colors"
                    aria-label="Clear zone filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Time Located */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Length of Time
              </label>
              <div className="relative">
                <select
                  value={timeLocated}
                  onChange={(e) => setTimeLocated(e.target.value)}
                  className="w-full bg-white/5 text-neutral-100 ring-1 ring-white/10 rounded-xl px-3 py-2 pr-8 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all appearance-none"
                >
                  <option value="" className="bg-slate-900">Select time</option>
                  <option value="Less than 1 hour" className="bg-slate-900">Less than 1 hour</option>
                  <option value="Over 1 hour" className="bg-slate-900">Over 1 hour</option>
                  <option value="Over 2 hours" className="bg-slate-900">Over 2 hours</option>
                  <option value="5+ hours" className="bg-slate-900">5+ hours</option>
                </select>
                {timeLocated && (
                  <button
                    onClick={() => setTimeLocated('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-neutral-300 hover:text-white transition-colors"
                    aria-label="Clear time filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Driver */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Driver
              </label>
              <div className="relative">
                <select
                  value={driver}
                  onChange={(e) => setDriver(e.target.value)}
                  className="w-full bg-white/5 text-neutral-100 ring-1 ring-white/10 rounded-xl px-3 py-2 pr-8 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all appearance-none"
                >
                  <option value="" className="bg-slate-900">All</option>
                  {DRIVERS.map((d) => (
                    <option key={d} value={d} className="bg-slate-900">{d}</option>
                  ))}
                </select>
                {driver && (
                  <button
                    onClick={() => setDriver('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-neutral-300 hover:text-white transition-colors"
                    aria-label="Clear driver filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[288px_1fr] gap-6">
          {/* Left Summary Column */}
          <div className="w-full lg:w-72 shrink-0 space-y-3">
            <div className="bg-white/5 backdrop-blur-md ring-1 ring-white/10 rounded-2xl p-4">
              <h3 className="text-lg font-semibold text-neutral-100 mb-4">Spotter Summary</h3>
              <div className="space-y-2">
                {byDriver.map((item) => (
                  <button
                    key={item.driver}
                    onClick={() => handleDriverClick(item.driver)}
                    className={`w-full flex items-center justify-between rounded-xl ring-1 ring-white/10 px-3 py-2 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400/60 cursor-pointer ${
                      selectedDriver === item.driver
                        ? 'bg-white/10 text-neutral-100'
                        : 'bg-white/5 text-neutral-200 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm font-medium">{item.driver}</span>
                    <span className="rounded-full bg-white text-slate-900 text-[11px] px-2 py-0.5">
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-neutral-400 mt-3">
                Spotter Specific Located Data Summary (no client filter)
              </p>
            </div>
          </div>

          {/* Right Drilldown Column */}
          <div className="min-w-0 flex-1 space-y-4">
            <div className="bg-white/5 backdrop-blur-md ring-1 ring-white/10 rounded-2xl p-4">
              {selectedDriver ? (
                <>
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => handleDriverClick(selectedDriver)}
                      className="text-sm font-medium text-neutral-300 hover:text-neutral-100 focus-visible:ring-2 focus-visible:ring-emerald-400/60 rounded px-2 py-1"
                    >
                      {selectedDriver}
                    </button>
                    {selectedClient && (
                      <>
                        <span className="text-neutral-400">→</span>
                        <button
                          onClick={() => clearBreadcrumb('client')}
                          className="text-sm font-medium text-neutral-300 hover:text-neutral-100 focus-visible:ring-2 focus-visible:ring-emerald-400/60 rounded px-2 py-1"
                        >
                          {selectedClient}
                        </button>
                      </>
                    )}
                    {selectedZone && (
                      <>
                        <span className="text-neutral-400">→</span>
                        <button
                          onClick={() => clearBreadcrumb('zone')}
                          className="text-sm font-medium text-neutral-300 hover:text-neutral-100 focus-visible:ring-2 focus-visible:ring-emerald-400/60 rounded px-2 py-1"
                        >
                          {selectedZone}
                        </button>
                      </>
                    )}
                  </div>

                  {/* View Toggle */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex rounded-lg bg-white/5 p-1">
                      <button
                        onClick={() => setViewMode('card')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400/60 ${
                          viewMode === 'card'
                            ? 'bg-white text-slate-900'
                            : 'text-neutral-300 hover:text-neutral-100'
                        }`}
                      >
                        <Grid3X3 className="w-4 h-4" />
                        Card
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400/60 ${
                          viewMode === 'grid'
                            ? 'bg-white text-slate-900'
                            : 'text-neutral-300 hover:text-neutral-100'
                        }`}
                      >
                        <List className="w-4 h-4" />
                        Grid
                      </button>
                    </div>

                    {/* Active Selection Chips */}
                    {(selectedClient || selectedZone) && (
                      <div className="flex items-center gap-2">
                        {selectedClient && (
                          <span className="bg-white/10 text-neutral-200 ring-1 ring-white/15 rounded-full px-3 py-1.5 text-sm flex items-center gap-2">
                            Client: {selectedClient}
                            <button onClick={clearClient} aria-label="Clear client selection">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        )}
                        {selectedZone && (
                          <span className="bg-white/10 text-neutral-200 ring-1 ring-white/15 rounded-full px-3 py-1.5 text-sm flex items-center gap-2">
                            Zone: {selectedZone}
                            <button onClick={clearZone} aria-label="Clear zone selection">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        )}
                        <button
                          onClick={clearAllSelections}
                          className="text-neutral-300 hover:text-white text-sm px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
                        >
                          Clear all
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Client Breakdown */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-neutral-100 mb-3">Client Breakdown</h4>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-4 text-xs text-neutral-400 uppercase tracking-wider mb-2">
                        <div>Client</div>
                        <div>Located</div>
                      </div>
                      <div className="space-y-1">
                        {clientBreakdown.map((item) => (
                          <button
                            key={item.name}
                            onClick={() => handleClientClick(item.name)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400/60 ${
                              selectedClient === item.name
                                ? 'bg-white/10 text-neutral-100'
                                : 'hover:bg-white/8 text-neutral-200'
                            }`}
                          >
                            <span className="text-sm font-medium">{item.name}</span>
                            <span className="text-sm text-neutral-300">{item.count}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Zone Breakdown Grid */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-neutral-100 mb-3">Zone Breakdown</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {zoneBreakdown.map((item) => (
                        <button
                          key={item.name}
                          onClick={() => handleZoneClick(item.name)}
                          className={`p-3 rounded-lg text-center transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400/60 ${
                            selectedZone === item.name
                              ? 'bg-white/10 text-neutral-100'
                              : 'bg-white/5 hover:bg-white/8 text-neutral-200'
                          }`}
                        >
                          <div className="text-xs font-medium">{item.name}</div>
                          <div className="text-lg font-bold">{item.count}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-neutral-400 text-center py-8">
                  Select a driver from the summary to view drilldown data
                </p>
              )}
            </div>

            {/* Results Area */}
            <div className="bg-white/5 backdrop-blur-md ring-1 ring-white/10 rounded-2xl p-4">
              <h3 className="text-lg font-semibold text-neutral-100 mb-4">
                Results ({results.length} {results.length === 1 ? 'vehicle' : 'vehicles'})
              </h3>
              
              {results.length > 0 ? (
                viewMode === 'card' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.map((car) => (
                      <VehicleCard key={car.id} car={car} />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-auto max-h-[70vh]">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-slate-900/80 backdrop-blur-md">
                        <tr className="border-b border-white/10">
                          <th className="text-left p-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Located Date</th>
                          <th className="text-left p-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Time Since</th>
                          <th className="text-left p-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Client</th>
                          <th className="text-left p-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">VIN</th>
                          <th className="text-left p-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">YMM</th>
                          <th className="text-left p-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Plate</th>
                          <th className="text-left p-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Color</th>
                          <th className="text-left p-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Address</th>
                          <th className="text-left p-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Reach</th>
                          <th className="text-left p-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Rusted</th>
                          <th className="text-left p-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Notes</th>
                          <th className="text-left p-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Image</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((car) => (
                          <tr
                            key={car.id}
                            className="border-b border-white/5 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-emerald-400/60"
                            tabIndex={0}
                          >
                            <td className="p-3 text-sm text-neutral-200">{car.locatedDate}</td>
                            <td className="p-3 text-sm text-neutral-200">{car.locatedAgo}</td>
                            <td className="p-3 text-sm text-neutral-200">{car.client}</td>
                            <td className="p-3 text-sm text-neutral-200">—</td>
                            <td className="p-3 text-sm text-neutral-200">{car.yearMakeModel}</td>
                            <td className="p-3 text-sm text-neutral-200">{car.plate}</td>
                            <td className="p-3 text-sm text-neutral-200">—</td>
                            <td className="p-3 text-sm text-neutral-200">{car.address}</td>
                            <td className="p-3 text-sm text-neutral-200">{car.reachable ? '✅' : '❌'}</td>
                            <td className="p-3 text-sm text-neutral-200">{car.notRusted ? '✅' : '❌'}</td>
                            <td className="p-3 text-sm text-neutral-200">—</td>
                            <td className="p-3">
                              {car.image ? (
                                <img
                                  src={car.image}
                                  alt={car.yearMakeModel}
                                  className="h-10 w-16 object-cover rounded-md ring-1 ring-white/10"
                                />
                              ) : (
                                <div className="h-10 w-16 bg-slate-700 rounded-md ring-1 ring-white/10 flex items-center justify-center">
                                  <span className="text-xs text-neutral-400">—</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-white/10 bg-white/5 backdrop-blur-md p-12 text-center">
                  <p className="text-neutral-300 text-lg mb-4">
                    No vehicles found matching your selections
                  </p>
                  {hasActiveSelections && (
                    <button
                      onClick={clearAllSelections}
                      className="px-4 py-2 bg-white/10 text-neutral-200 ring-1 ring-white/20 rounded-lg hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-emerald-400/60 transition-colors"
                    >
                      Reset selection
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
    </AppShell>
  );
};

export default Owner;
