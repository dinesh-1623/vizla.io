import React, { useMemo } from 'react';
import { BarChart3, PieChart, TrendingUp, DollarSign } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ClientPrefs } from '@/types/clientPrefs';

interface ClientChartsProps {
  clients: ClientPrefs[];
}

export const ClientCharts: React.FC<ClientChartsProps> = ({ clients }) => {
  const chartData = useMemo(() => {
    // Priority distribution
    const priorityData = clients.reduce((acc, client) => {
      acc[client.priority] = (acc[client.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Fee distribution (grouped by ranges)
    const feeRanges = {
      '0-100': 0,
      '101-150': 0,
      '151-200': 0,
      '200+': 0
    };

    clients.forEach(client => {
      if (client.clientRepoFeeUSD <= 100) feeRanges['0-100']++;
      else if (client.clientRepoFeeUSD <= 150) feeRanges['101-150']++;
      else if (client.clientRepoFeeUSD <= 200) feeRanges['151-200']++;
      else feeRanges['200+']++;
    });

    // Keys requirement distribution
    const keysData = clients.reduce((acc, client) => {
      acc[client.keysRequired] = (acc[client.keysRequired] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top clients by fee
    const topClients = [...clients]
      .sort((a, b) => b.clientRepoFeeUSD - a.clientRepoFeeUSD)
      .slice(0, 10);

    // Revenue by priority
    const revenueByPriority = clients.reduce((acc, client) => {
      if (!acc[client.priority]) {
        acc[client.priority] = { count: 0, totalFee: 0, avgFee: 0 };
      }
      acc[client.priority].count++;
      acc[client.priority].totalFee += client.clientRepoFeeUSD;
      acc[client.priority].avgFee = acc[client.priority].totalFee / acc[client.priority].count;
      return acc;
    }, {} as Record<string, { count: number; totalFee: number; avgFee: number }>);

    return {
      priorityData,
      feeRanges,
      keysData,
      topClients,
      revenueByPriority
    };
  }, [clients]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#eab308';
      case 'Low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getKeysColor = (requirement: string) => {
    switch (requirement) {
      case 'Required': return '#ef4444';
      case 'Preferred': return '#eab308';
      case 'Not Required': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Priority Distribution Pie Chart */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <PieChart className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-vizla-text-primary">Priority Distribution</h3>
        </div>
        <div className="space-y-4">
          {Object.entries(chartData.priorityData).map(([priority, count]) => {
            const percentage = (count / clients.length) * 100;
            return (
              <div key={priority} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: getPriorityColor(priority) }}
                  ></div>
                  <span className="text-vizla-text-secondary">{priority} Priority</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: getPriorityColor(priority)
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-vizla-text-primary w-12 text-right">
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Fee Distribution Bar Chart */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-vizla-text-primary">Fee Distribution</h3>
        </div>
        <div className="space-y-4">
          {Object.entries(chartData.feeRanges).map(([range, count]) => {
            const percentage = (count / clients.length) * 100;
            const maxCount = Math.max(...Object.values(chartData.feeRanges));
            const barWidth = (count / maxCount) * 100;
            
            return (
              <div key={range} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-vizla-text-secondary">${range}</span>
                  <span className="text-vizla-text-primary font-medium">
                    {count} clients ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${barWidth}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Keys Requirement Distribution */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-vizla-text-primary">Keys Requirement</h3>
        </div>
        <div className="space-y-4">
          {Object.entries(chartData.keysData).map(([requirement, count]) => {
            const percentage = (count / clients.length) * 100;
            return (
              <div key={requirement} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: getKeysColor(requirement) }}
                  ></div>
                  <span className="text-vizla-text-secondary">{requirement}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: getKeysColor(requirement)
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-vizla-text-primary w-12 text-right">
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Top Clients by Fee */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-vizla-text-primary">Top Clients by Fee</h3>
        </div>
        <div className="space-y-3">
          {chartData.topClients.map((client, index) => (
            <div key={client.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <div>
                  <div className="text-vizla-text-primary font-medium">{client.name}</div>
                  <div className="text-xs text-vizla-text-muted">{client.priority} Priority</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-400">
                  ${client.clientRepoFeeUSD}
                </div>
                <div className="text-xs text-vizla-text-muted">
                  {client.flatbedPreApproved ? 'Flatbed ✓' : 'No Flatbed'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Revenue by Priority */}
      <GlassCard className="p-6 lg:col-span-2">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-vizla-text-primary">Revenue Analysis by Priority</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(chartData.revenueByPriority).map(([priority, data]) => (
            <div key={priority} className="p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getPriorityColor(priority) }}
                ></div>
                <span className="text-vizla-text-primary font-medium">{priority} Priority</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-vizla-text-secondary">Clients:</span>
                  <span className="text-vizla-text-primary font-medium">{data.count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-vizla-text-secondary">Total Revenue:</span>
                  <span className="text-green-400 font-medium">${data.totalFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-vizla-text-secondary">Avg Fee:</span>
                  <span className="text-vizla-text-primary font-medium">${data.avgFee.toFixed(0)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
