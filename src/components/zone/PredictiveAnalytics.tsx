import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Target,
  Clock,
  DollarSign,
  BarChart3,
  Zap,
  Shield,
  Calendar
} from 'lucide-react';
import { type PredictiveAnalytics as PredictiveAnalyticsType } from '@/lib/mockData/zoneCapacity';

interface PredictiveAnalyticsProps {
  analytics: PredictiveAnalyticsType;
}

export const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({ analytics }) => {
  const [activeTab, setActiveTab] = useState('forecast');

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-vizla-success" />;
      case 'decreasing': return <TrendingUp className="w-4 h-4 text-vizla-danger rotate-180" />;
      default: return <BarChart3 className="w-4 h-4 text-vizla-text-secondary" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-vizla-danger';
      case 'medium': return 'text-vizla-warning';
      case 'low': return 'text-vizla-success';
      default: return 'text-vizla-text-primary';
    }
  };

  const getImpactBg = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-vizla-danger/20 border-vizla-danger/30';
      case 'medium': return 'bg-vizla-warning/20 border-vizla-warning/30';
      case 'low': return 'bg-vizla-success/20 border-vizla-success/30';
      default: return 'bg-vizla-elev1 border-vizla-glassBorder';
    }
  };

  return (
    <TooltipProvider>
      <Card className="rounded-2xl bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-vizla-brand-primary/20 rounded-full flex items-center justify-center">
                <Brain className="w-5 h-5 text-vizla-brand-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-vizla-text-primary">Predictive Analytics</h3>
                <p className="text-sm text-vizla-text-secondary">Machine Learning & Pattern Recognition</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Badge className="bg-vizla-success/20 text-vizla-success border border-vizla-success/30">
                {analytics.capacityForecast.confidence}% Confidence
              </Badge>
              <Badge className={`${getImpactBg('high')} ${getImpactColor('high')} border`}>
                ML Active
              </Badge>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="forecast">Forecast</TabsTrigger>
              <TabsTrigger value="demand">Demand</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="insights">ML Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="forecast" className="mt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-vizla-elev1 rounded-lg">
                    <Clock className="w-6 h-6 mx-auto mb-2 text-vizla-brand-primary" />
                    <div className="text-2xl font-bold text-vizla-text-primary">
                      {analytics.capacityForecast.today}
                    </div>
                    <div className="text-xs text-vizla-text-secondary">Today</div>
                  </div>
                  <div className="text-center p-4 bg-vizla-elev1 rounded-lg">
                    <Clock className="w-6 h-6 mx-auto mb-2 text-vizla-warning" />
                    <div className="text-2xl font-bold text-vizla-warning">
                      {analytics.capacityForecast.tomorrow}
                    </div>
                    <div className="text-xs text-vizla-text-secondary">Tomorrow</div>
                  </div>
                  <div className="text-center p-4 bg-vizla-elev1 rounded-lg">
                    <Calendar className="w-6 h-6 mx-auto mb-2 text-vizla-success" />
                    <div className="text-2xl font-bold text-vizla-success">
                      {analytics.capacityForecast.thisWeek}
                    </div>
                    <div className="text-xs text-vizla-text-secondary">This Week</div>
                  </div>
                  <div className="text-center p-4 bg-vizla-elev1 rounded-lg">
                    <TrendingUp className="w-6 h-6 mx-auto mb-2 text-vizla-brand-secondary" />
                    <div className="text-2xl font-bold text-vizla-brand-secondary">
                      {analytics.capacityForecast.nextWeek}
                    </div>
                    <div className="text-xs text-vizla-text-secondary">Next Week</div>
                  </div>
                </div>

                <div className="p-4 bg-vizla-elev1 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-vizla-text-primary">Trend Analysis</h4>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(analytics.capacityForecast.trend)}
                      <span className="text-sm font-medium capitalize text-vizla-text-primary">
                        {analytics.capacityForecast.trend}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-vizla-text-secondary">Confidence Level</div>
                    <div className="w-32">
                      <Progress value={analytics.capacityForecast.confidence} className="h-2" />
                    </div>
                    <div className="text-sm font-medium text-vizla-text-primary">
                      {analytics.capacityForecast.confidence}%
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="demand" className="mt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-vizla-elev1 rounded-lg">
                    <h4 className="font-medium text-vizla-text-primary mb-3">Peak Hours</h4>
                    <div className="space-y-2">
                      {analytics.demandPrediction.peakHours.map((hour, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-vizla-text-secondary">{hour}</span>
                          <div className="w-16 h-2 bg-vizla-elev2 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-vizla-brand-primary rounded-full"
                              style={{ width: `${85 - index * 10}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-vizla-elev1 rounded-lg">
                    <h4 className="font-medium text-vizla-text-primary mb-3">Impact Factors</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-vizla-text-secondary">Weather Impact</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-vizla-elev2 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-vizla-warning rounded-full"
                              style={{ width: `${analytics.demandPrediction.weatherImpact}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-vizla-text-primary">
                            {analytics.demandPrediction.weatherImpact}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-vizla-text-secondary">Event Impact</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-vizla-elev2 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-vizla-danger rounded-full"
                              style={{ width: `${analytics.demandPrediction.eventImpact}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-vizla-text-primary">
                            {analytics.demandPrediction.eventImpact}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-vizla-elev1 rounded-lg">
                  <h4 className="font-medium text-vizla-text-primary mb-3">7-Day Seasonal Trends</h4>
                  <div className="flex items-end justify-between h-20 gap-1">
                    {analytics.demandPrediction.seasonalTrends.map((value, index) => (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <div 
                            className="bg-vizla-brand-primary rounded-t flex-1 cursor-pointer hover:bg-vizla-brand-primary/80 transition-colors"
                            style={{ height: `${(value / 100) * 100}%` }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Day {index + 1}: {value}%</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="mt-6">
              <div className="space-y-4">
                {analytics.optimizationRecommendations.map((rec, index) => (
                  <div key={index} className="p-4 bg-vizla-elev1 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Lightbulb className="w-5 h-5 text-vizla-brand-primary" />
                        <span className="font-medium text-vizla-text-primary">{rec.action}</span>
                      </div>
                      <Badge className={`${getImpactBg(rec.impact)} ${getImpactColor(rec.impact)} border`}>
                        {rec.impact} impact
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-vizla-text-secondary" />
                        <span className="text-vizla-text-secondary">Cost:</span>
                        <span className="font-medium text-vizla-text-primary">${rec.cost}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-vizla-text-secondary" />
                        <span className="text-vizla-text-secondary">ROI:</span>
                        <span className="font-medium text-vizla-success">${rec.roi}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-vizla-text-secondary" />
                        <span className="text-vizla-text-secondary">Timeline:</span>
                        <span className="font-medium text-vizla-text-primary">{rec.timeline}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="insights" className="mt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-vizla-elev1 rounded-lg">
                    <h4 className="font-medium text-vizla-text-primary mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-vizla-success" />
                      Pattern Recognition
                    </h4>
                    <div className="space-y-2">
                      {analytics.mlInsights.patternRecognition.map((pattern, index) => (
                        <div key={index} className="text-sm text-vizla-text-secondary flex items-start gap-2">
                          <span className="text-vizla-success mt-1">▶</span>
                          {pattern}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-vizla-elev1 rounded-lg">
                    <h4 className="font-medium text-vizla-text-primary mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-vizla-warning" />
                      Anomaly Detection
                    </h4>
                    <div className="space-y-2">
                      {analytics.mlInsights.anomalyDetection.map((anomaly, index) => (
                        <div key={index} className="text-sm text-vizla-text-secondary flex items-start gap-2">
                          <span className="text-vizla-warning mt-1">⚠</span>
                          {anomaly}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-vizla-elev1 rounded-lg">
                    <h4 className="font-medium text-vizla-text-primary mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-vizla-brand-primary" />
                      Predictive Maintenance
                    </h4>
                    <div className="space-y-2">
                      {analytics.mlInsights.predictiveMaintenance.map((maintenance, index) => (
                        <div key={index} className="text-sm text-vizla-text-secondary flex items-start gap-2">
                          <span className="text-vizla-brand-primary mt-1">⚙</span>
                          {maintenance}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-vizla-elev1 rounded-lg">
                    <h4 className="font-medium text-vizla-text-primary mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-vizla-danger" />
                      Risk Assessment
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-vizla-text-secondary">Overall Risk</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-vizla-elev2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                analytics.mlInsights.riskAssessment > 70 ? 'bg-vizla-danger' :
                                analytics.mlInsights.riskAssessment > 40 ? 'bg-vizla-warning' : 'bg-vizla-success'
                              }`}
                              style={{ width: `${analytics.mlInsights.riskAssessment}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-vizla-text-primary">
                            {analytics.mlInsights.riskAssessment}/100
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
