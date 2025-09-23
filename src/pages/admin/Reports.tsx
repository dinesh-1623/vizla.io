import React from 'react';
import AppShell from '@/components/shell/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DataTable } from '@/components/ui/DataTable';

const Reports: React.FC = () => {
  const reportsData = [
    { id: 'R001', name: 'Daily Operations', type: 'Automated', lastGenerated: '2024-01-15 08:00', status: 'Ready' },
    { id: 'R002', name: 'Monthly Performance', type: 'Scheduled', lastGenerated: '2024-01-01 00:00', status: 'Ready' },
    { id: 'R003', name: 'Driver Efficiency', type: 'Manual', lastGenerated: '2024-01-14 16:30', status: 'Ready' },
    { id: 'R004', name: 'Client Satisfaction', type: 'Scheduled', lastGenerated: '2024-01-10 12:00', status: 'Generating' },
    { id: 'R005', name: 'Financial Summary', type: 'Manual', lastGenerated: '2024-01-12 14:15', status: 'Ready' }
  ];

  return (
    <AppShell title="Reports">
      <div className="space-y-6">
        {/* Header */}
        <SectionHeading
          title="Reports & Analytics"
          subtitle="System reports and performance analytics"
        />

        {/* Report Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">5</div>
              <div className="text-sm text-muted mt-1">Total Reports</div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">3</div>
              <div className="text-sm text-muted mt-1">Automated</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">2</div>
              <div className="text-sm text-muted mt-1">Manual</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">1</div>
              <div className="text-sm text-muted mt-1">Generating</div>
            </div>
          </GlassCard>
        </div>

        {/* Reports Table */}
        <GlassCard>
          <SectionHeading title="Available Reports" />
          <DataTable
            columns={[
              { key: 'id', header: 'Report ID' },
              { key: 'name', header: 'Report Name' },
              { key: 'type', header: 'Type' },
              { key: 'lastGenerated', header: 'Last Generated' },
              { key: 'status', header: 'Status' }
            ]}
            rows={reportsData.map(report => ({
              id: report.id,
              name: report.name,
              type: report.type,
              lastGenerated: report.lastGenerated,
              status: report.status
            }))}
            emptyText="No reports found"
          />
        </GlassCard>
      </div>
    </AppShell>
  );
};

export default Reports;
