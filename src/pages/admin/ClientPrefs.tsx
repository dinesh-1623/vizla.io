import React from 'react';
import AppShell from '@/components/shell/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DataTable } from '@/components/ui/DataTable';

const ClientPrefs: React.FC = () => {
  const clientPrefsData = [
    { client: 'Client A', priority: 'High', notificationMethod: 'Email', responseTime: '2 hours' },
    { client: 'Client B', priority: 'Medium', notificationMethod: 'SMS', responseTime: '4 hours' },
    { client: 'Client C', priority: 'High', notificationMethod: 'Email + SMS', responseTime: '1 hour' },
    { client: 'Capital One', priority: 'Low', notificationMethod: 'Email', responseTime: '8 hours' },
    { client: 'Wells Fargo', priority: 'Medium', notificationMethod: 'Email', responseTime: '6 hours' }
  ];

  return (
    <AppShell title="Client Preferences">
      <div className="space-y-6">
        {/* Header */}
        <SectionHeading
          title="Client Preferences"
          subtitle="Client-specific settings and communication preferences"
        />

        {/* Client Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">5</div>
              <div className="text-sm text-muted mt-1">Total Clients</div>
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

        {/* Client Preferences Table */}
        <GlassCard>
          <SectionHeading title="Client Communication Preferences" />
          <DataTable
            columns={[
              { key: 'client', header: 'Client' },
              { key: 'priority', header: 'Priority' },
              { key: 'notificationMethod', header: 'Notification Method' },
              { key: 'responseTime', header: 'Response Time' }
            ]}
            rows={clientPrefsData.map(pref => ({
              client: pref.client,
              priority: pref.priority,
              notificationMethod: pref.notificationMethod,
              responseTime: pref.responseTime
            }))}
            emptyText="No client preferences found"
          />
        </GlassCard>
      </div>
    </AppShell>
  );
};

export default ClientPrefs;
