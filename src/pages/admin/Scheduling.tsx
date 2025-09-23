import React from 'react';
import AppShell from '@/components/shell/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DataTable } from '@/components/ui/DataTable';

const Scheduling: React.FC = () => {
  const scheduleData = [
    { id: 'SC001', task: 'Vehicle Recovery', driver: 'Naz', scheduledTime: '2024-01-15 14:00', priority: 'High' },
    { id: 'SC002', task: 'Client Pickup', driver: 'Roger', scheduledTime: '2024-01-15 16:30', priority: 'Medium' },
    { id: 'SC003', task: 'Vehicle Inspection', driver: 'Carla V', scheduledTime: '2024-01-15 18:00', priority: 'Low' },
    { id: 'SC004', task: 'Storage Transfer', driver: 'Dana M', scheduledTime: '2024-01-16 09:00', priority: 'Medium' },
    { id: 'SC005', task: 'Vehicle Recovery', driver: 'Naz', scheduledTime: '2024-01-16 11:30', priority: 'High' }
  ];

  return (
    <AppShell title="Scheduling">
      <div className="space-y-6">
        {/* Header */}
        <SectionHeading
          title="Task Scheduling"
          subtitle="Driver task scheduling and resource allocation"
        />

        {/* Schedule Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">5</div>
              <div className="text-sm text-muted mt-1">Scheduled Tasks</div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">2</div>
              <div className="text-sm text-muted mt-1">High Priority</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">2</div>
              <div className="text-sm text-muted mt-1">Medium Priority</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">1</div>
              <div className="text-sm text-muted mt-1">Low Priority</div>
            </div>
          </GlassCard>
        </div>

        {/* Schedule Table */}
        <GlassCard>
          <SectionHeading title="Scheduled Tasks" />
          <DataTable
            columns={[
              { key: 'id', header: 'Task ID' },
              { key: 'task', header: 'Task' },
              { key: 'driver', header: 'Driver' },
              { key: 'scheduledTime', header: 'Scheduled Time' },
              { key: 'priority', header: 'Priority' }
            ]}
            rows={scheduleData.map(schedule => ({
              id: schedule.id,
              task: schedule.task,
              driver: schedule.driver,
              scheduledTime: schedule.scheduledTime,
              priority: schedule.priority
            }))}
            emptyText="No scheduled tasks found"
          />
        </GlassCard>
      </div>
    </AppShell>
  );
};

export default Scheduling;
