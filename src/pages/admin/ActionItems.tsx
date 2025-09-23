import React from 'react';
import AppShell from '@/components/shell/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DataTable } from '@/components/ui/DataTable';

const ActionItems: React.FC = () => {
  const actionItemsData = [
    { id: 'AI001', item: 'Update driver schedules', priority: 'High', assignedTo: 'John Smith', dueDate: '2024-01-16', status: 'Pending' },
    { id: 'AI002', item: 'Review fleet maintenance', priority: 'Medium', assignedTo: 'Sarah Johnson', dueDate: '2024-01-18', status: 'In Progress' },
    { id: 'AI003', item: 'Client feedback review', priority: 'Low', assignedTo: 'Mike Wilson', dueDate: '2024-01-20', status: 'Pending' },
    { id: 'AI004', item: 'Update zone coverage', priority: 'High', assignedTo: 'Lisa Brown', dueDate: '2024-01-17', status: 'Completed' },
    { id: 'AI005', item: 'System backup verification', priority: 'Medium', assignedTo: 'David Lee', dueDate: '2024-01-19', status: 'Pending' }
  ];

  return (
    <AppShell title="Action Items">
      <div className="space-y-6">
        {/* Header */}
        <SectionHeading
          title="Action Items"
          subtitle="Tasks and follow-up items requiring attention"
        />

        {/* Action Items Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">5</div>
              <div className="text-sm text-muted mt-1">Total Items</div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">3</div>
              <div className="text-sm text-muted mt-1">Pending</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">1</div>
              <div className="text-sm text-muted mt-1">In Progress</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">1</div>
              <div className="text-sm text-muted mt-1">Completed</div>
            </div>
          </GlassCard>
        </div>

        {/* Action Items Table */}
        <GlassCard>
          <SectionHeading title="Action Items List" />
          <DataTable
            columns={[
              { key: 'id', header: 'Item ID' },
              { key: 'item', header: 'Action Item' },
              { key: 'priority', header: 'Priority' },
              { key: 'assignedTo', header: 'Assigned To' },
              { key: 'dueDate', header: 'Due Date' },
              { key: 'status', header: 'Status' }
            ]}
            rows={actionItemsData.map(item => ({
              id: item.id,
              item: item.item,
              priority: item.priority,
              assignedTo: item.assignedTo,
              dueDate: item.dueDate,
              status: item.status
            }))}
            emptyText="No action items found"
          />
        </GlassCard>
      </div>
    </AppShell>
  );
};

export default ActionItems;
