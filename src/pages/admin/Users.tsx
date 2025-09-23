import React from 'react';
import AppShell from '@/components/shell/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DataTable } from '@/components/ui/DataTable';

const Users: React.FC = () => {
  const usersData = [
    { id: 'U001', name: 'John Smith', role: 'Admin', status: 'Active', lastLogin: '2 hours ago' },
    { id: 'U002', name: 'Sarah Johnson', role: 'Manager', status: 'Active', lastLogin: '1 day ago' },
    { id: 'U003', name: 'Mike Wilson', role: 'Operator', status: 'Active', lastLogin: '3 hours ago' },
    { id: 'U004', name: 'Lisa Brown', role: 'Operator', status: 'Inactive', lastLogin: '1 week ago' },
    { id: 'U005', name: 'David Lee', role: 'Viewer', status: 'Active', lastLogin: '4 hours ago' }
  ];

  return (
    <AppShell title="Users">
      <div className="space-y-6">
        {/* Header */}
        <SectionHeading
          title="User Management"
          subtitle="System users and access control"
        />

        {/* User Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">5</div>
              <div className="text-sm text-muted mt-1">Total Users</div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">4</div>
              <div className="text-sm text-muted mt-1">Active</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">2</div>
              <div className="text-sm text-muted mt-1">Admins</div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">1</div>
              <div className="text-sm text-muted mt-1">Inactive</div>
            </div>
          </GlassCard>
        </div>

        {/* Users Table */}
        <GlassCard>
          <SectionHeading title="System Users" />
          <DataTable
            columns={[
              { key: 'id', header: 'User ID' },
              { key: 'name', header: 'Name' },
              { key: 'role', header: 'Role' },
              { key: 'status', header: 'Status' },
              { key: 'lastLogin', header: 'Last Login' }
            ]}
            rows={usersData.map(user => ({
              id: user.id,
              name: user.name,
              role: user.role,
              status: user.status,
              lastLogin: user.lastLogin
            }))}
            emptyText="No users found"
          />
        </GlassCard>
      </div>
    </AppShell>
  );
};

export default Users;
