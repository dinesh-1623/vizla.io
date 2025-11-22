/**
 * Note Parsing Button
 * Triggers AI extraction of metadata from vehicle notes.
 * 
 * Clean button with loading, success, and error states.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/browser';
import { toast } from 'sonner';

export type NoteParsingButtonProps = {
  /** Vehicle ID to extract metadata for */
  vehicleId: string;
  /** Current extraction status */
  currentStatus?: 'pending' | 'completed' | 'failed' | 'skipped' | null;
  /** Callback when extraction completes successfully */
  onExtractionComplete?: (metadata: {
    parking_type: string | null;
    gate_code: string | null;
    damage_description: string | null;
    special_instructions: string | null;
    estimated_fees: number | null;
    accessibility_score: number | null;
  }) => void;
  /** Callback when extraction fails */
  onExtractionError?: (error: string) => void;
  /** Optional notes override (if different from vehicle's notes) */
  notesOverride?: string | null;
  /** Whether to force re-extraction even if metadata exists */
  forceReparse?: boolean;
  /** Custom button variant */
  variant?: 'default' | 'outline' | 'ghost';
  /** Custom button size */
  size?: 'sm' | 'default' | 'lg';
  /** Additional className */
  className?: string;
};

/**
 * Call the Edge Function to extract metadata
 */
async function extractMetadata(
  vehicleId: string,
  options: {
    forceReparse?: boolean;
    notesOverride?: string | null;
  } = {}
): Promise<{
  success: boolean;
  metadata?: {
    parking_type: string | null;
    gate_code: string | null;
    damage_description: string | null;
    special_instructions: string | null;
    estimated_fees: number | null;
    accessibility_score: number | null;
  };
  error?: string;
  tokenUsage?: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    estimatedCostUsd: number;
  };
  processingTimeMs?: number;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-extract-note-metadata', {
      body: {
        vehicleId,
        forceReparse: options.forceReparse || false,
        notesOverride: options.notesOverride || null,
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to call extraction function');
    }

    if (!data) {
      throw new Error('No data returned from extraction function');
    }

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error extracting metadata:', error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export const NoteParsingButton: React.FC<NoteParsingButtonProps> = ({
  vehicleId,
  currentStatus,
  onExtractionComplete,
  onExtractionError,
  notesOverride = null,
  forceReparse = false,
  variant = 'outline',
  size = 'default',
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setLastError(null);

    try {
      const result = await extractMetadata(vehicleId, {
        forceReparse,
        notesOverride,
      });

      if (result.success && result.metadata) {
        toast.success('Metadata extracted successfully', {
          description: `Processed in ${result.processingTimeMs ? (result.processingTimeMs / 1000).toFixed(1) : '?'}s`,
        });
        onExtractionComplete?.(result.metadata);
        setLastError(null);
      } else {
        const errorMsg = result.error || 'Failed to extract metadata';
        toast.error('Extraction failed', {
          description: errorMsg,
        });
        setLastError(errorMsg);
        onExtractionError?.(errorMsg);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error('Extraction failed', {
        description: errorMessage,
      });
      setLastError(errorMessage);
      onExtractionError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine button text and icon based on state
  const getButtonConfig = () => {
    if (isLoading) {
      return {
        label: 'Extracting...',
        icon: RefreshCw,
        iconClassName: 'animate-spin',
      };
    }

    if (currentStatus === 'completed' && !forceReparse) {
      return {
        label: 'Re-extract Metadata',
        icon: RefreshCw,
        iconClassName: '',
      };
    }

    if (lastError) {
      return {
        label: 'Retry Extraction',
        icon: AlertCircle,
        iconClassName: '',
      };
    }

    return {
      label: 'Extract Metadata',
      icon: Sparkles,
      iconClassName: '',
    };
  };

  const buttonConfig = getButtonConfig();
  const Icon = buttonConfig.icon;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleExtract}
      disabled={isLoading}
      className={cn(
        'gap-2',
        isLoading && 'opacity-70 cursor-not-allowed',
        className
      )}
    >
      <Icon className={cn('w-4 h-4', buttonConfig.iconClassName)} />
      <span>{buttonConfig.label}</span>
    </Button>
  );
};

