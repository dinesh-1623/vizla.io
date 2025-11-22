/**
 * Alert Automation Admin Page
 * 
 * Admin page for managing alert automation, monitoring, and AI features
 */

import React from 'react';
import AppShell from '@/components/shell/AppShell';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { AlertAutomationPanel } from '@/components/admin/AlertAutomationPanel';

const AlertAutomation: React.FC = () => {
  return (
    <AppShell title="Alert Automation">
      <div className="space-y-6">
        <SectionHeading
          title="Alert Automation & Monitoring"
          subtitle="Manage alert creation, automation, and AI prioritization"
        />
        <AlertAutomationPanel />
      </div>
    </AppShell>
  );
};

export default AlertAutomation;




