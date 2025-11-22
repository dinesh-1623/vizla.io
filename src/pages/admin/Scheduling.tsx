/**
 * Scheduling Page
 * Create and manage recurring driver shifts
 */

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/shell/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RecurringShiftForm } from '@/components/scheduling/RecurringShiftForm';
import { getShifts, removeShift } from '@/lib/shift/store';
import { Calendar, Trash2, Plus } from 'lucide-react';
import type { Shift } from '@/lib/shift/types';

const Scheduling: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load shifts
  useEffect(() => {
    setShifts(getShifts());
  }, [refreshKey]);

  const handleSuccess = () => {
    setShowForm(false);
    setRefreshKey(k => k + 1);
  };

  const handleDelete = (shiftId: string) => {
    if (confirm('Are you sure you want to delete this shift?')) {
      removeShift(shiftId);
      setRefreshKey(k => k + 1);
    }
  };

  // Group shifts by week
  const shiftsByWeek = shifts.reduce((acc, shift) => {
    const date = new Date(shift.startISO);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!acc[weekKey]) {
      acc[weekKey] = [];
    }
    acc[weekKey].push(shift);
    return acc;
  }, {} as Record<string, Shift[]>);

  return (
    <AppShell title="Scheduling">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-vizla-text-primary">Shift Scheduling</h1>
            <p className="text-vizla-text-secondary mt-1">
              Create and manage recurring driver shifts
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Recurring Shift
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-vizla-brand-primary">{shifts.length}</div>
              <div className="text-sm text-vizla-text-muted mt-1">Total Shifts</div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-vizla-brand-primary">
                {shifts.filter(s => s.shiftType === 'Day').length}
              </div>
              <div className="text-sm text-vizla-text-muted mt-1">Day Shifts</div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-vizla-brand-primary">
                {shifts.filter(s => s.shiftType === 'Night').length}
              </div>
              <div className="text-sm text-vizla-text-muted mt-1">Night Shifts</div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-vizla-brand-primary">
                {Object.keys(shiftsByWeek).length}
              </div>
              <div className="text-sm text-vizla-text-muted mt-1">Weeks Scheduled</div>
            </div>
          </GlassCard>
        </div>

        {/* Form or Shifts List */}
        {showForm ? (
          <RecurringShiftForm
            onSuccess={handleSuccess}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-vizla-text-primary mb-4">
              Scheduled Shifts
            </h3>

            {shifts.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-vizla-text-muted opacity-50" />
                <p className="text-vizla-text-secondary mb-4">
                  No shifts scheduled yet
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Shift
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(shiftsByWeek)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([weekKey, weekShifts]) => {
                    const weekStart = new Date(weekKey);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);

                    return (
                      <div key={weekKey}>
                        <h4 className="text-sm font-semibold text-vizla-text-primary mb-3">
                          Week of {weekStart.toLocaleDateString()} - {weekEnd.toLocaleDateString()}
                        </h4>
                        <div className="space-y-2">
                          {weekShifts
                            .sort((a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime())
                            .map(shift => {
                              const startDate = new Date(shift.startISO);
                              const endDate = new Date(shift.endISO);
                              const dayOfWeek = startDate.toLocaleDateString('en-US', { weekday: 'long' });

                              return (
                                <div
                                  key={shift.id}
                                  className="flex items-center justify-between p-4 bg-vizla-glass border border-vizla-glassBorder rounded-lg"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                      <div className="font-medium text-vizla-text-primary">
                                        {dayOfWeek}, {startDate.toLocaleDateString()}
                                      </div>
                                      <Badge variant="outline">
                                        {shift.shiftType}
                                      </Badge>
                                      <Badge variant="outline">
                                        {shift.marketId} · {shift.zoneId}
                                      </Badge>
                                    </div>
                                    <div className="text-sm text-vizla-text-secondary mt-1">
                                      {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                      {shift.assignedDriverIds.length > 0 && (
                                        <span className="ml-3">
                                          · {shift.assignedDriverIds.length} driver{shift.assignedDriverIds.length !== 1 ? 's' : ''}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(shift.id)}
                                    className="text-vizla-text-muted hover:text-red-400"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </GlassCard>
        )}
      </div>
    </AppShell>
  );
};

export default Scheduling;
