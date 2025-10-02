import React, { useState } from 'react';
import { 
  Presentation, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users, 
  DollarSign,
  Star,
  Key,
  Truck,
  Maximize2,
  Minimize2,
  Download,
  Share2
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClientPrefs } from '@/types/clientPrefs';
import { ClientAnalytics } from './ClientAnalytics';
import { ClientCharts } from './ClientCharts';

interface PresentationModeProps {
  clients: ClientPrefs[];
  onExport?: () => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({ clients, onExport }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const slides = [
    {
      id: 'overview',
      title: 'Client Preferences Overview',
      icon: <Users className="w-6 h-6" />,
      content: <OverviewSlide clients={clients} />
    },
    {
      id: 'analytics',
      title: 'Key Analytics & Metrics',
      icon: <TrendingUp className="w-6 h-6" />,
      content: <ClientAnalytics clients={clients} />
    },
    {
      id: 'charts',
      title: 'Visual Analytics',
      icon: <BarChart3 className="w-6 h-6" />,
      content: <ClientCharts clients={clients} />
    },
    {
      id: 'insights',
      title: 'Business Insights',
      icon: <Star className="w-6 h-6" />,
      content: <InsightsSlide clients={clients} />
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : ''}`}>
      <div className={`${isFullscreen ? 'h-screen overflow-hidden' : ''}`}>
        {/* Presentation Header */}
        <div className="bg-gray-800/95 backdrop-blur-sm border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Presentation className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">Client Preferences Presentation</h2>
              </div>
              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                Slide {currentSlide + 1} of {slides.length}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={onExport}
                variant="outline"
                size="sm"
                className="bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-600/50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={toggleFullscreen}
                variant="outline"
                size="sm"
                className="bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-600/50"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Slide Navigation */}
        <div className="bg-gray-800/50 border-b border-gray-700 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlide(index)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentSlide === index
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                  }`}
                >
                  {slide.icon}
                  {slide.title}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={prevSlide}
                variant="outline"
                size="sm"
                disabled={currentSlide === 0}
                className="bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-600/50 disabled:opacity-50"
              >
                Previous
              </Button>
              <Button
                onClick={nextSlide}
                variant="outline"
                size="sm"
                disabled={currentSlide === slides.length - 1}
                className="bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-600/50 disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        {/* Slide Content */}
        <div className={`${isFullscreen ? 'h-[calc(100vh-120px)]' : 'min-h-[600px]'} p-6 overflow-auto`}>
          {slides[currentSlide].content}
        </div>
      </div>
    </div>
  );
};

// Overview Slide Component
const OverviewSlide: React.FC<{ clients: ClientPrefs[] }> = ({ clients }) => {
  const stats = {
    total: clients.length,
    highPriority: clients.filter(c => c.priority === 'High').length,
    totalRevenue: clients.reduce((sum, c) => sum + c.clientRepoFeeUSD, 0),
    flatbedApproved: clients.filter(c => c.flatbedPreApproved).length,
    keysRequired: clients.filter(c => c.keysRequired === 'Required').length
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Client Preferences Dashboard</h1>
        <p className="text-xl text-gray-400">Comprehensive overview of client priorities, fees, and operational requirements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="p-6 text-center">
          <Users className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-3xl font-bold text-white mb-2">{stats.total}</h3>
          <p className="text-gray-400">Total Clients</p>
        </GlassCard>

        <GlassCard className="p-6 text-center">
          <Star className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-3xl font-bold text-white mb-2">{stats.highPriority}</h3>
          <p className="text-gray-400">High Priority</p>
        </GlassCard>

        <GlassCard className="p-6 text-center">
          <DollarSign className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-3xl font-bold text-white mb-2">${stats.totalRevenue.toLocaleString()}</h3>
          <p className="text-gray-400">Total Revenue</p>
        </GlassCard>

        <GlassCard className="p-6 text-center">
          <Truck className="w-12 h-12 text-orange-400 mx-auto mb-4" />
          <h3 className="text-3xl font-bold text-white mb-2">{stats.flatbedApproved}</h3>
          <p className="text-gray-400">Flatbed Pre-Approved</p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Priority Distribution</h3>
          <div className="space-y-3">
            {['High', 'Medium', 'Low'].map(priority => {
              const count = clients.filter(c => c.priority === priority).length;
              const percentage = (count / clients.length) * 100;
              return (
                <div key={priority} className="flex items-center justify-between">
                  <span className="text-gray-300">{priority} Priority</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          priority === 'High' ? 'bg-red-500' : 
                          priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-medium w-16 text-right">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Key Requirements</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Keys Required</span>
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                {stats.keysRequired} clients
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Flatbed Pre-Approved</span>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                {stats.flatbedApproved} clients
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Average Fee</span>
              <span className="text-white font-medium">
                ${(stats.totalRevenue / stats.total).toFixed(0)}
              </span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

// Insights Slide Component
const InsightsSlide: React.FC<{ clients: ClientPrefs[] }> = ({ clients }) => {
  const insights = {
    highValueClients: clients.filter(c => c.priority === 'High' && c.clientRepoFeeUSD >= 150).length,
    premiumClients: clients.filter(c => c.clientRepoFeeUSD >= 200).length,
    efficiencyRate: (clients.filter(c => c.flatbedPreApproved).length / clients.length) * 100,
    keysRequiredRate: (clients.filter(c => c.keysRequired === 'Required').length / clients.length) * 100,
    avgFee: clients.reduce((sum, c) => sum + c.clientRepoFeeUSD, 0) / clients.length,
    maxFee: Math.max(...clients.map(c => c.clientRepoFeeUSD)),
    minFee: Math.min(...clients.map(c => c.clientRepoFeeUSD))
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Business Insights</h1>
        <p className="text-xl text-gray-400">Key performance indicators and strategic recommendations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Revenue Insights
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-300">Average Fee:</span>
              <span className="text-white font-medium">${insights.avgFee.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Fee Range:</span>
              <span className="text-white font-medium">${insights.minFee} - ${insights.maxFee}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Premium Clients:</span>
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                {insights.premiumClients} clients
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">High Value Clients:</span>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {insights.highValueClients} clients
              </Badge>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-yellow-400" />
            Operational Efficiency
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-300">Flatbed Pre-Approval Rate:</span>
              <span className="text-white font-medium">{insights.efficiencyRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Keys Required Rate:</span>
              <span className="text-white font-medium">{insights.keysRequiredRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Streamlined Operations:</span>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                {insights.efficiencyRate > 50 ? 'High' : 'Medium'}
              </Badge>
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Strategic Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="text-lg font-medium text-blue-400">Revenue Optimization</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Focus on {insights.premiumClients} premium clients for maximum revenue</li>
              <li>• Consider fee adjustments for {clients.filter(c => c.clientRepoFeeUSD < 100).length} low-fee clients</li>
              <li>• Leverage {insights.highValueClients} high-value relationships</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-lg font-medium text-green-400">Operational Efficiency</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• {insights.efficiencyRate.toFixed(1)}% flatbed pre-approval reduces delays</li>
              <li>• {insights.keysRequiredRate.toFixed(1)}% require keys - plan accordingly</li>
              <li>• Streamline processes for {clients.filter(c => c.priority === 'High').length} high-priority clients</li>
            </ul>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
