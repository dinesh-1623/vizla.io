import React, { useMemo } from 'react';
import { TrendingUp, DollarSign, Users, Star, Key, Truck } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { ClientPrefs } from '@/types/clientPrefs';

interface ClientAnalyticsProps {
  clients: ClientPrefs[];
}

export const ClientAnalytics: React.FC<ClientAnalyticsProps> = ({ clients }) => {
  const analytics = useMemo(() => {
    const totalClients = clients.length;
    const highPriority = clients.filter(c => c.priority === 'High').length;
    const mediumPriority = clients.filter(c => c.priority === 'Medium').length;
    const lowPriority = clients.filter(c => c.priority === 'Low').length;
    
    const totalRevenue = clients.reduce((sum, c) => sum + c.clientRepoFeeUSD, 0);
    const avgFee = totalRevenue / totalClients || 0;
    const maxFee = Math.max(...clients.map(c => c.clientRepoFeeUSD));
    const minFee = Math.min(...clients.map(c => c.clientRepoFeeUSD));
    
    const flatbedApproved = clients.filter(c => c.flatbedPreApproved).length;
    const keysRequired = clients.filter(c => c.keysRequired === 'Required').length;
    const keysPreferred = clients.filter(c => c.keysRequired === 'Preferred').length;
    const keysNotRequired = clients.filter(c => c.keysRequired === 'Not Required').length;
    
    const highValueClients = clients.filter(c => c.priority === 'High' && c.clientRepoFeeUSD >= 150).length;
    const premiumClients = clients.filter(c => c.clientRepoFeeUSD >= 200).length;
    
    return {
      totalClients,
      priority: { high: highPriority, medium: mediumPriority, low: lowPriority },
      revenue: { total: totalRevenue, avg: avgFee, max: maxFee, min: minFee },
      requirements: { flatbedApproved, keysRequired, keysPreferred, keysNotRequired },
      segments: { highValue: highValueClients, premium: premiumClients }
    };
  }, [clients]);

  const priorityPercentage = {
    high: (analytics.priority.high / analytics.totalClients) * 100,
    medium: (analytics.priority.medium / analytics.totalClients) * 100,
    low: (analytics.priority.low / analytics.totalClients) * 100
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Key Metrics */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-vizla-text-primary mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Key Metrics
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-vizla-text-secondary">Total Clients</span>
            <span className="text-2xl font-bold text-vizla-text-primary">{analytics.totalClients}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-vizla-text-secondary">High Priority</span>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              {analytics.priority.high} ({priorityPercentage.high.toFixed(1)}%)
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-vizla-text-secondary">Premium Clients</span>
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
              {analytics.segments.premium}
            </Badge>
          </div>
        </div>
      </GlassCard>

      {/* Revenue Analytics */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-vizla-text-primary mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-400" />
          Revenue Analytics
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-vizla-text-secondary">Total Revenue</span>
            <span className="text-xl font-bold text-green-400">
              ${analytics.revenue.total.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-vizla-text-secondary">Average Fee</span>
            <span className="text-lg font-semibold text-vizla-text-primary">
              ${analytics.revenue.avg.toFixed(0)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-vizla-text-secondary">Fee Range</span>
            <span className="text-sm text-vizla-text-muted">
              ${analytics.revenue.min} - ${analytics.revenue.max}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Priority Distribution */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-vizla-text-primary mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          Priority Distribution
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-vizla-text-secondary">High Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: `${priorityPercentage.high}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-vizla-text-primary">
                {analytics.priority.high}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-vizla-text-secondary">Medium Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${priorityPercentage.medium}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-vizla-text-primary">
                {analytics.priority.medium}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-vizla-text-secondary">Low Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${priorityPercentage.low}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-vizla-text-primary">
                {analytics.priority.low}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Requirements Analysis */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-vizla-text-primary mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-400" />
          Requirements Analysis
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-vizla-text-secondary">Flatbed Pre-Approved</span>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              {analytics.requirements.flatbedApproved} clients
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-vizla-text-secondary">Keys Required</span>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              {analytics.requirements.keysRequired}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-vizla-text-secondary">Keys Preferred</span>
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              {analytics.requirements.keysPreferred}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-vizla-text-secondary">Keys Not Required</span>
            <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
              {analytics.requirements.keysNotRequired}
            </Badge>
          </div>
        </div>
      </GlassCard>

      {/* Client Segments */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-vizla-text-primary mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" />
          Client Segments
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-vizla-text-secondary">High Value Clients</span>
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
              {analytics.segments.highValue}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-vizla-text-secondary">Premium Clients ($200+)</span>
            <Badge className="bg-gold-500/20 text-gold-400 border-gold-500/30">
              {analytics.segments.premium}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-vizla-text-secondary">Standard Clients</span>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              {analytics.totalClients - analytics.segments.highValue - analytics.segments.premium}
            </Badge>
          </div>
        </div>
      </GlassCard>

      {/* Operational Insights */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-vizla-text-primary mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5 text-orange-400" />
          Operational Insights
        </h3>
        <div className="space-y-4">
          <div className="text-sm text-vizla-text-secondary">
            <div className="mb-2">Efficiency Metrics:</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Pre-approved Flatbed Rate:</span>
                <span className="text-vizla-text-primary">
                  {((analytics.requirements.flatbedApproved / analytics.totalClients) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Keys Required Rate:</span>
                <span className="text-vizla-text-primary">
                  {((analytics.requirements.keysRequired / analytics.totalClients) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>High Priority Rate:</span>
                <span className="text-vizla-text-primary">
                  {priorityPercentage.high.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
