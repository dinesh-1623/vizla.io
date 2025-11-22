import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  DollarSign, 
  Users, 
  Clock, 
  BarChart3,
  PieChart,
  Activity,
  Shield,
  Zap,
  Brain,
  Eye,
  ChevronRight,
  Award,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { type ZoneStat } from '@/lib/mockData/zoneCapacity';

interface ExecutiveDashboardProps {
  zones: ZoneStat[];
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ zones }) => {
  const [selectedZone, setSelectedZone] = useState<ZoneStat | null>(null);

  // Calculate executive-level KPIs
  const executiveKPIs = {
    totalRevenue: zones.reduce((sum, zone) => sum + zone.clients.reduce((cSum, client) => cSum + client.revenue, 0), 0),
    avgProfitability: zones.reduce((sum, zone) => sum + zone.businessIntelligence.profitability, 0) / zones.length,
    marketShare: zones.reduce((sum, zone) => sum + zone.businessIntelligence.marketShare, 0),
    customerSatisfaction: zones.reduce((sum, zone) => sum + zone.businessIntelligence.customerSatisfaction, 0) / zones.length,
    operationalEfficiency: zones.reduce((sum, zone) => sum + zone.businessIntelligence.operationalEfficiency, 0) / zones.length,
    riskScore: zones.reduce((sum, zone) => sum + zone.businessIntelligence.riskScore, 0) / zones.length,
    growthPotential: zones.reduce((sum, zone) => sum + zone.strategicInsights.growthPotential, 0) / zones.length
  };

  const getRiskColor = (score: number) => {
    if (score <= 30) return 'text-vizla-success';
    if (score <= 60) return 'text-vizla-warning';
    return 'text-vizla-danger';
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 85) return 'text-vizla-success';
    if (score >= 70) return 'text-vizla-warning';
    return 'text-vizla-danger';
  };

  const getCompetitivePositionColor = (position: string) => {
    switch (position) {
      case 'leading': return 'bg-vizla-success/20 text-vizla-success border-vizla-success/30';
      case 'strong': return 'bg-vizla-brand-primary/20 text-vizla-brand-primary border-vizla-brand-primary/30';
      case 'moderate': return 'bg-vizla-warning/20 text-vizla-warning border-vizla-warning/30';
      case 'weak': return 'bg-vizla-danger/20 text-vizla-danger border-vizla-danger/30';
      default: return 'bg-vizla-elev1 text-vizla-text-secondary border-vizla-glassBorder';
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive KPI Dashboard */}
      <Card className="bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-vizla-brand-primary" />
            <h2 className="text-xl font-bold text-vizla-text-primary">Executive Dashboard</h2>
            <Badge className="bg-vizla-brand-primary/20 text-vizla-brand-primary border-vizla-brand-primary/30">
              40+ Years Experience
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <div className="text-center p-4 bg-vizla-elev1 rounded-lg">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-vizla-success" />
              <div className="text-2xl font-bold text-vizla-text-primary">
                ${(executiveKPIs.totalRevenue / 1000).toFixed(0)}K
              </div>
              <div className="text-xs text-vizla-text-secondary">Total Revenue</div>
            </div>

            <div className="text-center p-4 bg-vizla-elev1 rounded-lg">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-vizla-success" />
              <div className="text-2xl font-bold text-vizla-text-primary">
                {executiveKPIs.avgProfitability.toFixed(1)}%
              </div>
              <div className="text-xs text-vizla-text-secondary">Avg Profitability</div>
            </div>

            <div className="text-center p-4 bg-vizla-elev1 rounded-lg">
              <PieChart className="w-8 h-8 mx-auto mb-2 text-vizla-brand-primary" />
              <div className="text-2xl font-bold text-vizla-text-primary">
                {executiveKPIs.marketShare.toFixed(1)}%
              </div>
              <div className="text-xs text-vizla-text-secondary">Market Share</div>
            </div>

            <div className="text-center p-4 bg-vizla-elev1 rounded-lg">
              <Star className="w-8 h-8 mx-auto mb-2 text-vizla-warning" />
              <div className={`text-2xl font-bold ${getPerformanceColor(executiveKPIs.customerSatisfaction)}`}>
                {executiveKPIs.customerSatisfaction.toFixed(0)}
              </div>
              <div className="text-xs text-vizla-text-secondary">Customer Satisfaction</div>
            </div>

            <div className="text-center p-4 bg-vizla-elev1 rounded-lg">
              <Zap className="w-8 h-8 mx-auto mb-2 text-vizla-brand-secondary" />
              <div className={`text-2xl font-bold ${getPerformanceColor(executiveKPIs.operationalEfficiency)}`}>
                {executiveKPIs.operationalEfficiency.toFixed(0)}%
              </div>
              <div className="text-xs text-vizla-text-secondary">Operational Efficiency</div>
            </div>

            <div className="text-center p-4 bg-vizla-elev1 rounded-lg">
              <Shield className="w-8 h-8 mx-auto mb-2 text-vizla-danger" />
              <div className={`text-2xl font-bold ${getRiskColor(executiveKPIs.riskScore)}`}>
                {executiveKPIs.riskScore.toFixed(0)}
              </div>
              <div className="text-xs text-vizla-text-secondary">Risk Score</div>
            </div>

            <div className="text-center p-4 bg-vizla-elev1 rounded-lg">
              <Activity className="w-8 h-8 mx-auto mb-2 text-vizla-success" />
              <div className="text-2xl font-bold text-vizla-success">
                +{executiveKPIs.growthPotential.toFixed(0)}%
              </div>
              <div className="text-xs text-vizla-text-secondary">Growth Potential</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategic Zone Analysis */}
      <Card className="bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-6 h-6 text-vizla-brand-primary" />
            <h3 className="text-lg font-bold text-vizla-text-primary">Strategic Zone Analysis</h3>
          </div>

          <Tabs defaultValue="performance" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="strategic">Strategic</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {zones.map((zone) => (
                  <div key={zone.zoneId} className="p-4 bg-vizla-elev1 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-vizla-text-primary">{zone.zoneLabel}</h4>
                      <Badge className={getCompetitivePositionColor(zone.businessIntelligence.competitivePosition)}>
                        {zone.businessIntelligence.competitivePosition.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-vizla-text-secondary">Market Share</span>
                        <span className="text-sm font-medium text-vizla-text-primary">
                          {zone.businessIntelligence.marketShare}%
                        </span>
                      </div>
                      <Progress value={zone.businessIntelligence.marketShare} className="h-2" />

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-vizla-text-secondary">Growth Rate</span>
                        <span className={`text-sm font-medium ${zone.businessIntelligence.growthRate > 0 ? 'text-vizla-success' : 'text-vizla-danger'}`}>
                          {zone.businessIntelligence.growthRate > 0 ? '+' : ''}{zone.businessIntelligence.growthRate}%
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-vizla-text-secondary">Efficiency</span>
                        <span className={`text-sm font-medium ${getPerformanceColor(zone.businessIntelligence.operationalEfficiency)}`}>
                          {zone.businessIntelligence.operationalEfficiency}%
                        </span>
                      </div>
                      <Progress value={zone.businessIntelligence.operationalEfficiency} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="financial" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {zones.map((zone) => {
                  const zoneRevenue = zone.clients.reduce((sum, client) => sum + client.revenue, 0);
                  const avgCostPerVehicle = zone.performanceMetrics.costPerVehicle;
                  const avgRevenuePerVehicle = zone.performanceMetrics.revenuePerVehicle;
                  const profitMargin = ((avgRevenuePerVehicle - avgCostPerVehicle) / avgRevenuePerVehicle) * 100;

                  return (
                    <div key={zone.zoneId} className="p-4 bg-vizla-elev1 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-vizla-text-primary">{zone.zoneLabel}</h4>
                        <Badge className={`${profitMargin > 20 ? 'bg-vizla-success/20 text-vizla-success' : 'bg-vizla-warning/20 text-vizla-warning'} border`}>
                          {profitMargin.toFixed(1)}% Margin
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-vizla-text-secondary">Revenue</span>
                          <span className="text-sm font-medium text-vizla-text-primary">
                            ${(zoneRevenue / 1000).toFixed(0)}K
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-vizla-text-secondary">Cost/Vehicle</span>
                          <span className="text-sm font-medium text-vizla-text-primary">
                            ${avgCostPerVehicle}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-vizla-text-secondary">Revenue/Vehicle</span>
                          <span className="text-sm font-medium text-vizla-text-primary">
                            ${avgRevenuePerVehicle}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-vizla-text-secondary">Customer Retention</span>
                          <span className={`text-sm font-medium ${getPerformanceColor(zone.performanceMetrics.customerRetention)}`}>
                            {zone.performanceMetrics.customerRetention}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="strategic" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {zones.map((zone) => (
                  <div key={zone.zoneId} className="p-4 bg-vizla-elev1 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-vizla-text-primary">{zone.zoneLabel}</h4>
                      <Badge className={`${zone.businessIntelligence.strategicValue === 'critical' ? 'bg-vizla-danger/20 text-vizla-danger' : 
                                      zone.businessIntelligence.strategicValue === 'high' ? 'bg-vizla-warning/20 text-vizla-warning' :
                                      'bg-vizla-success/20 text-vizla-success'} border`}>
                        {zone.businessIntelligence.strategicValue.toUpperCase()} VALUE
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium text-vizla-text-primary mb-2">Market Opportunities</div>
                        <div className="space-y-1">
                          {zone.strategicInsights.marketOpportunities.slice(0, 2).map((opportunity, index) => (
                            <div key={index} className="text-xs text-vizla-text-secondary flex items-center gap-2">
                              <ChevronRight className="w-3 h-3" />
                              {opportunity}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium text-vizla-text-primary mb-2">Recommended Actions</div>
                        <div className="space-y-1">
                          {zone.strategicInsights.recommendedActions.slice(0, 2).map((action, index) => (
                            <div key={index} className="text-xs text-vizla-text-secondary flex items-center gap-2">
                              <Target className="w-3 h-3" />
                              {action}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-vizla-glassBorder">
                        <span className="text-sm text-vizla-text-secondary">Growth Potential</span>
                        <span className="text-sm font-bold text-vizla-success">
                          +{zone.strategicInsights.growthPotential}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="insights" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {zones.map((zone) => (
                  <div key={zone.zoneId} className="p-4 bg-vizla-elev1 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-vizla-text-primary">{zone.zoneLabel}</h4>
                      <div className="flex gap-2">
                        {zone.businessIntelligence.riskScore > 70 ? (
                          <AlertTriangle className="w-4 h-4 text-vizla-danger" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-vizla-success" />
                        )}
                        {zone.performanceMetrics.completionRate > 90 ? (
                          <Award className="w-4 h-4 text-vizla-warning" />
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium text-vizla-text-primary mb-2">Operational Challenges</div>
                        <div className="space-y-1">
                          {zone.strategicInsights.operationalChallenges.slice(0, 2).map((challenge, index) => (
                            <div key={index} className="text-xs text-vizla-text-secondary flex items-center gap-2">
                              <AlertCircle className="w-3 h-3" />
                              {challenge}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium text-vizla-text-primary mb-2">Long-term Trends</div>
                        <div className="space-y-1">
                          {zone.strategicInsights.longTermTrends.slice(0, 2).map((trend, index) => (
                            <div key={index} className="text-xs text-vizla-text-secondary flex items-center gap-2">
                              <TrendingUp className="w-3 h-3" />
                              {trend}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-vizla-glassBorder">
                        <div className="text-center">
                          <div className="text-lg font-bold text-vizla-text-primary">
                            {zone.performanceMetrics.avgResponseTime}m
                          </div>
                          <div className="text-xs text-vizla-text-secondary">Avg Response</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${getPerformanceColor(zone.performanceMetrics.completionRate)}`}>
                            {zone.performanceMetrics.completionRate}%
                          </div>
                          <div className="text-xs text-vizla-text-secondary">Completion</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
