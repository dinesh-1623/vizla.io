import { ZoneMetrics, DriverMetrics } from '../../types/dashboard';

export interface Recommendation {
  id: string;
  text: string;
  priority: 'High' | 'Medium' | 'Low';
  icon: string;
  action?: string;
}

/**
 * Generate recommendations based on zone metrics
 */
export function generateRecommendations(metrics: ZoneMetrics): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  // Rule 1: If status is "Behind", suggest deferring low-priority vehicles
  if (metrics.status === 'Behind') {
    const lowPriorityCount = Math.min(metrics.deficitVehicles, 5); // Cap at 5
    if (lowPriorityCount > 0) {
      recommendations.push({
        id: 'defer-low-priority',
        text: `Defer ${lowPriorityCount} low-priority vehicles`,
        priority: 'High',
        icon: '⏸️',
        action: 'defer_vehicles'
      });
    }
  }
  
  // Rule 2: If optimized routing saves >= 45 minutes, favor stash routing
  if (metrics.routeOptimization.optimized.timeSaved >= 45) {
    recommendations.push({
      id: 'favor-stash-routing',
      text: 'Favor stash routing for this zone',
      priority: 'Medium',
      icon: '🗂️',
      action: 'optimize_routing'
    });
  }
  
  // Rule 3: If any driver is > 95% but others < 70%, suggest rebalancing
  const highUtilizationDrivers = metrics.drivers.filter(d => d.utilization > 95);
  const lowUtilizationDrivers = metrics.drivers.filter(d => d.utilization < 70);
  
  if (highUtilizationDrivers.length > 0 && lowUtilizationDrivers.length > 0) {
    recommendations.push({
      id: 'rebalance-groups',
      text: 'Rebalance groups between drivers',
      priority: 'High',
      icon: '⚖️',
      action: 'rebalance_groups'
    });
  }
  
  // Rule 4: If capacity doesn't fit, suggest adding resources or extending shift
  if (!metrics.capacityFit) {
    if (metrics.deficitHours <= 2) {
      recommendations.push({
        id: 'extend-shift',
        text: `Extend shift by ${Math.ceil(metrics.deficitHours)} hour${Math.ceil(metrics.deficitHours) > 1 ? 's' : ''}`,
        priority: 'Medium',
        icon: '⏰',
        action: 'extend_shift'
      });
    } else {
      recommendations.push({
        id: 'add-rollback',
        text: 'Add 1 rollback or extend shift significantly',
        priority: 'High',
        icon: '🚛',
        action: 'add_resources'
      });
    }
  }
  
  // Rule 5: If any driver is consistently behind, suggest focused support
  const behindDrivers = metrics.drivers.filter(d => d.status === 'Behind');
  if (behindDrivers.length > 0 && behindDrivers.length < metrics.drivers.length) {
    recommendations.push({
      id: 'focused-support',
      text: `Provide focused support to ${behindDrivers.length} driver${behindDrivers.length > 1 ? 's' : ''}`,
      priority: 'Medium',
      icon: '🎯',
      action: 'provide_support'
    });
  }
  
  // Rule 6: If zone has high route optimization potential, suggest grouping optimization
  const totalOptimizationSavings = metrics.routeOptimization.optimized.timeSaved;
  if (totalOptimizationSavings >= 60) {
    recommendations.push({
      id: 'optimize-grouping',
      text: 'Optimize vehicle grouping for better routing',
      priority: 'Low',
      icon: '📊',
      action: 'optimize_grouping'
    });
  }
  
  // Rule 7: If shift utilization is very low, suggest taking on more work
  if (metrics.shiftUtilization < 60) {
    recommendations.push({
      id: 'increase-workload',
      text: 'Consider taking on additional vehicles from neighboring zones',
      priority: 'Low',
      icon: '📈',
      action: 'increase_workload'
    });
  }
  
  // Sort by priority (High -> Medium -> Low) and limit to 3 recommendations
  return recommendations
    .sort((a, b) => {
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, 3);
}

/**
 * Filter recommendations based on user preferences
 */
export function filterRecommendations(
  recommendations: Recommendation[],
  showRecommendedOnly: boolean
): Recommendation[] {
  if (!showRecommendedOnly) {
    return recommendations;
  }
  
  // Only show high and medium priority recommendations when filtering
  return recommendations.filter(rec => rec.priority === 'High' || rec.priority === 'Medium');
}

/**
 * Get recommendation icon component
 */
export function getRecommendationIcon(icon: string): string {
  const iconMap: { [key: string]: string } = {
    '⏸️': 'Pause',
    '🗂️': 'FolderOpen',
    '⚖️': 'Scale',
    '⏰': 'Clock',
    '🚛': 'Truck',
    '🎯': 'Target',
    '📊': 'BarChart3',
    '📈': 'TrendingUp'
  };
  
  return iconMap[icon] || 'AlertCircle';
}

/**
 * Get recommendation color based on priority
 */
export function getRecommendationColor(priority: 'High' | 'Medium' | 'Low'): string {
  switch (priority) {
    case 'High':
      return 'text-red-400 bg-red-500/20 border-red-500/30';
    case 'Medium':
      return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    case 'Low':
      return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    default:
      return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  }
}




