/**
 * Extracted Metadata Card
 * Displays AI-extracted structured metadata from vehicle notes.
 * 
 * Clean, neutral design following McKinsey-style clarity and Apple-style aesthetics.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MapPin, 
  Lock, 
  AlertTriangle, 
  FileText, 
  DollarSign, 
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import type { ExtractedMetadata, ExtractionStatus } from '@/lib/types/extractedMetadata';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export type ExtractedMetadataCardProps = {
  metadata: ExtractedMetadata | null;
  status: ExtractionStatus | null;
  lastExtractedAt?: string | null;
  isLoading?: boolean;
  error?: string | null;
};

/**
 * Get status badge styling
 */
function getStatusBadge(status: ExtractionStatus | null) {
  switch (status) {
    case 'completed':
      return {
        label: 'Extracted',
        className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        icon: CheckCircle2,
      };
    case 'failed':
      return {
        label: 'Failed',
        className: 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: XCircle,
      };
    case 'pending':
      return {
        label: 'Processing',
        className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        icon: Clock,
      };
    case 'skipped':
      return {
        label: 'Skipped',
        className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        icon: XCircle,
      };
    default:
      return {
        label: 'Not extracted',
        className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        icon: Clock,
      };
  }
}

/**
 * Format accessibility score with color
 */
function formatAccessibilityScore(score: number | null): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (score === null) {
    return { label: 'N/A', color: 'text-gray-400', bgColor: 'bg-gray-500/20' };
  }

  if (score >= 8) {
    return { label: `${score}/10 - Easy`, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' };
  } else if (score >= 5) {
    return { label: `${score}/10 - Moderate`, color: 'text-amber-400', bgColor: 'bg-amber-500/20' };
  } else {
    return { label: `${score}/10 - Difficult`, color: 'text-red-400', bgColor: 'bg-red-500/20' };
  }
}

/**
 * Metadata field component
 */
function MetadataField({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number | null;
  valueClassName?: string;
}) {
  if (value === null || value === '') {
    return null;
  }

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-vizla-glassBorder last:border-0">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-vizla-glassElev flex items-center justify-center">
        <Icon className="w-4 h-4 text-vizla-text-secondary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-vizla-text-muted uppercase tracking-wide mb-1">
          {label}
        </div>
        <div className={cn('text-sm text-vizla-text-primary', valueClassName)}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      </div>
    </div>
  );
}

export const ExtractedMetadataCard: React.FC<ExtractedMetadataCardProps> = ({
  metadata,
  status,
  lastExtractedAt,
  isLoading = false,
  error = null,
}) => {
  const statusBadge = getStatusBadge(status);

  // Loading state
  if (isLoading) {
    return (
      <Card className="border border-vizla-glassBorder bg-vizla-glassElev shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-vizla-text-primary">
              AI-Extracted Metadata
            </CardTitle>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border border-red-500/30 bg-red-500/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-vizla-text-primary">
              AI-Extracted Metadata
            </CardTitle>
            <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
              <XCircle className="w-3 h-3 mr-1" />
              Error
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-400 bg-red-500/20 border border-red-500/30 rounded-lg p-3">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state (no metadata yet)
  if (!metadata || status === null || status === 'pending' || status === 'skipped') {
    return (
      <Card className="border border-vizla-glassBorder bg-vizla-glassElev/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-vizla-text-primary">
              AI-Extracted Metadata
            </CardTitle>
            <Badge variant="outline" className={statusBadge.className}>
              {statusBadge.icon && React.createElement(statusBadge.icon, { className: "w-3 h-3 mr-1" })}
              {statusBadge.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-vizla-text-secondary text-center py-6">
            {status === 'pending' ? (
              'Metadata extraction in progress...'
            ) : status === 'skipped' ? (
              'No notes available for extraction.'
            ) : (
              'No metadata extracted yet. Use "Extract Metadata" to analyze notes.'
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state - show extracted metadata
  const accessibilityInfo = formatAccessibilityScore(metadata.accessibility_score);

  return (
    <Card className="border border-vizla-glassBorder bg-vizla-glassElev shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-vizla-text-primary">
            AI-Extracted Metadata
          </CardTitle>
            <Badge variant="outline" className={statusBadge.className}>
              {statusBadge.icon && React.createElement(statusBadge.icon, { className: "w-3 h-3 mr-1" })}
              {statusBadge.label}
            </Badge>
        </div>
        {lastExtractedAt && (
          <div className="text-xs text-vizla-text-muted mt-1">
            Extracted {formatDistanceToNow(new Date(lastExtractedAt), { addSuffix: true })}
            {' · '}
            {format(new Date(lastExtractedAt), 'MMM d, yyyy h:mm a')}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-1">
        <MetadataField
          icon={MapPin}
          label="Parking Type"
          value={metadata.parking_type}
        />

        <MetadataField
          icon={Lock}
          label="Gate Code"
          value={metadata.gate_code}
          valueClassName="font-mono"
        />

        <MetadataField
          icon={AlertTriangle}
          label="Damage Description"
          value={metadata.damage_description}
        />

        <MetadataField
          icon={FileText}
          label="Special Instructions"
          value={metadata.special_instructions}
        />

        <MetadataField
          icon={DollarSign}
          label="Estimated Fees"
          value={metadata.estimated_fees ? `$${metadata.estimated_fees.toFixed(2)}` : null}
          valueClassName="font-semibold"
        />

        {metadata.accessibility_score !== null && (
          <div className="flex items-start gap-3 py-2.5 border-b border-vizla-glassBorder last:border-0">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-vizla-glassElev flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-vizla-text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-vizla-text-muted uppercase tracking-wide mb-1">
                Accessibility Score
              </div>
              <div className={cn(
                'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium',
                accessibilityInfo.color,
                accessibilityInfo.bgColor,
                'border border-current/20'
              )}>
                {accessibilityInfo.label}
              </div>
            </div>
          </div>
        )}

        {metadata.confidence_score !== null && (
          <div className="pt-2 mt-2 border-t border-vizla-glassBorder">
            <div className="flex items-center justify-between text-xs text-vizla-text-secondary">
              <span>Confidence:</span>
              <span className="font-medium text-vizla-text-primary">
                {Math.round(metadata.confidence_score * 100)}%
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

