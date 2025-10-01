import React from 'react';
import AppShell from '@/components/shell/AppShell';
import { MarketsOverview } from '@/components/MarketsOverview';

const Markets: React.FC = () => {
  return (
    <AppShell title="Markets & Zones">
      <MarketsOverview 
        defaultViewMode="list"
        showViewAllButton={false}
        maxColumns={6}
      />
    </AppShell>
  );
};

export default Markets;
