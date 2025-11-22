/**
 * Data Source Toggle Component
 * 
 * Tiny toggle to switch between Mock and Supabase data sources
 */

import React from 'react';
import { Database, DatabaseIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSettings } from '@/lib/settings';

export const DataSourceToggle: React.FC = () => {
  const { dataSource, setDataSource } = useSettings();

  const handleToggle = () => {
    const newSource = dataSource === 'mock' ? 'supabase' : 'mock';
    setDataSource(newSource);
    
    // Reload the page to apply data source change
    window.location.reload();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className="h-9 w-9 text-vizla-text-secondary hover:text-vizla-text-primary hover:bg-vizla-glass/20 transition-colors"
            aria-pressed={dataSource === 'supabase'}
            aria-label={dataSource === 'mock' ? 'Switch to Supabase' : 'Switch to Mock'}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggle();
              }
            }}
          >
            {dataSource === 'mock' ? (
              <DatabaseIcon className="h-4 w-4" />
            ) : (
              <Database className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {dataSource === 'mock' 
              ? 'Using mock data. Click to switch to Supabase'
              : 'Using Supabase data. Click to switch to mock'
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

