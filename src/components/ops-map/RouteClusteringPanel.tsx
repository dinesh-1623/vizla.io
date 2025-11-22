/**
 * Route Clustering Panel
 * Displays AI-powered route clustering results
 */

import React from 'react';
import { X, Sparkles, RefreshCw, MapPin, Clock, Route, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import type { RouteCluster } from '@/lib/ai/services/RouteClusteringService';
import { getPriorityBadgeColor, formatConfidenceScore } from '@/lib/services/routeClustering';

interface RouteClusteringPanelProps {
  clusters: RouteCluster[];
  unclusteredVehicles: any[];
  summary: {
    totalVehicles: number;
    clusteredCount: number;
    unclusteredCount: number;
    totalRoutes: number;
    averageVehiclesPerRoute: number;
    averageRouteTime: number;
    averageRouteDistance: number;
    processingTimeMs: number;
  };
  recommendations: string[];
  onDismiss: () => void;
  onSelectCluster?: (cluster: RouteCluster) => void;
  selectedClusterId?: string;
}

export function RouteClusteringPanel({
  clusters,
  unclusteredVehicles,
  summary,
  recommendations,
  onDismiss,
  onSelectCluster,
  selectedClusterId,
}: RouteClusteringPanelProps) {
  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-h-[90vh] overflow-y-auto">
      <GlassCard className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">AI Route Clusters</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-xs text-gray-400">Total Routes</div>
            <div className="text-lg font-semibold text-white">{summary.totalRoutes}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-xs text-gray-400">Vehicles Clustered</div>
            <div className="text-lg font-semibold text-green-400">
              {summary.clusteredCount}/{summary.totalVehicles}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-xs text-gray-400">Avg per Route</div>
            <div className="text-lg font-semibold text-white">
              {summary.averageVehiclesPerRoute.toFixed(1)}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-xs text-gray-400">Avg Time</div>
            <div className="text-lg font-semibold text-white">
              {Math.round(summary.averageRouteTime)}m
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <div className="text-xs font-semibold text-blue-400">AI Recommendations</div>
                <ul className="text-xs text-gray-300 space-y-1">
                  {recommendations.map((rec, idx) => (
                    <li key={idx}>• {rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Clusters List */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Route Clusters ({clusters.length})
          </div>
          {clusters.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-4">
              No clusters generated
            </div>
          ) : (
            clusters
              .sort((a, b) => {
                const priorityOrder = { now: 0, priority: 1, next: 2, later: 3 };
                return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
              })
              .map((cluster) => (
                <RouteClusterCard
                  key={cluster.clusterId}
                  cluster={cluster}
                  isSelected={selectedClusterId === cluster.clusterId}
                  onClick={() => onSelectCluster?.(cluster)}
                />
              ))
          )}
        </div>

        {/* Unclustered Vehicles */}
        {unclusteredVehicles.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Unclustered ({unclusteredVehicles.length})
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="text-xs text-yellow-400">
                {unclusteredVehicles.length} vehicle{unclusteredVehicles.length !== 1 ? 's' : ''} could not be clustered.
                They may be too isolated or outside clustering parameters.
              </div>
            </div>
          </div>
        )}

        {/* Processing Time */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t border-white/10">
          Processed in {(summary.processingTimeMs / 1000).toFixed(2)}s
        </div>
      </GlassCard>
    </div>
  );
}

interface RouteClusterCardProps {
  cluster: RouteCluster;
  isSelected?: boolean;
  onClick?: () => void;
}

function RouteClusterCard({ cluster, isSelected, onClick }: RouteClusterCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white/5 border rounded-lg p-3 cursor-pointer transition-all
        ${isSelected ? 'border-purple-500/50 bg-purple-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/10'}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Route className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-white">{cluster.clusterId}</span>
          <Badge className={`text-[10px] px-1.5 py-0.5 ${getPriorityBadgeColor(cluster.priority)}`}>
            {cluster.priority}
          </Badge>
        </div>
        {cluster.confidenceScore && (
          <div className="text-[10px] text-gray-400">
            {formatConfidenceScore(cluster.confidenceScore)}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-300">{cluster.vehicles.length} vehicles</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-300">{Math.round(cluster.estimatedRouteTime)}m</span>
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-300">{cluster.estimatedDistance.toFixed(1)}km</span>
        </div>
      </div>

      {/* Driver Assignment */}
      {cluster.recommendedDriverName && (
        <div className="text-xs text-gray-400 mb-2">
          <span className="text-gray-500">Driver:</span>{' '}
          <span className="text-white">{cluster.recommendedDriverName}</span>
          {cluster.assignmentReason && (
            <div className="text-[10px] text-gray-500 mt-0.5">
              {cluster.assignmentReason}
            </div>
          )}
        </div>
      )}

      {/* AI Insights */}
      {cluster.aiInsights && (
        <div className="mt-2 space-y-1">
          {cluster.aiInsights.recommendations && cluster.aiInsights.recommendations.length > 0 && (
            <div className="text-[10px] text-blue-400">
              💡 {cluster.aiInsights.recommendations[0]}
            </div>
          )}
          {cluster.aiInsights.optimalStartTime && (
            <div className="text-[10px] text-green-400">
              ⏰ Best start: {cluster.aiInsights.optimalStartTime}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


