import React from 'react';
import AppShell from '@/components/shell/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DataTable } from '@/components/ui/DataTable';

const Shifts: React.FC = () => {
  const shiftsData = [
    { id: 'S001', driver: 'Naz', date: '2024-01-15', startTime: '06:00', endTime: '14:00', status: 'Completed' },
    { id: 'S002', driver: 'Roger', date: '2024-01-15', startTime: '14:00', endTime: '22:00', status: 'Completed' },
    { id: 'S003', driver: 'Carla V', date: '2024-01-15', startTime: '22:00', endTime: '06:00', status: 'Active' },
    { id: 'S004', driver: 'Dana M', date: '2024-01-16', startTime: '06:00', endTime: '14:00', status: 'Scheduled' },
    { id: 'S005', driver: 'Naz', date: '2024-01-16', startTime: '14:00', endTime: '22:00', status: 'Scheduled' }
  ];

  return (
    <AppShell title="Shifts">
      <div className="space-y-6">
        {/* Header */}
        <SectionHeading
          title="Shift Management"
          subtitle="Driver schedules and shift tracking"
        />

        {/* Shift Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">5</div>
              <div className="text-sm text-muted mt-1">Total Shifts</div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">1</div>
              <div className="text-sm text-muted mt-1">Active</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">2</div>
              <div className="text-sm text-muted mt-1">Completed</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">2</div>
              <div className="text-sm text-muted mt-1">Scheduled</div>
            </div>
          </GlassCard>
        </div>

        {/* Shifts Table */}
        <GlassCard>
          <SectionHeading title="Driver Shifts" />
          <DataTable
            columns={[
              { key: 'id', header: 'Shift ID' },
              { key: 'driver', header: 'Driver' },
              { key: 'date', header: 'Date' },
              { key: 'time', header: 'Time' },
              { key: 'status', header: 'Status' }
            ]}
            rows={shiftsData.map(shift => ({
              id: shift.id,
              driver: shift.driver,
              date: shift.date,
              time: `${shift.startTime} - ${shift.endTime}`,
              status: shift.status
            }))}
            emptyText="No shifts found"
          />
        </GlassCard>
      </div>
    </AppShell>
  );
};

export default Shifts;
