import React, { useState, useEffect, useMemo } from 'react';
import AppShell from '@/components/shell/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Download, 
  FileText, 
  Calendar,
  Clock,
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface Report {
  id: string;
  name: string;
  description: string;
  type: 'automated' | 'scheduled' | 'manual' | 'analytics';
  category: 'operations' | 'financial' | 'performance' | 'compliance' | 'analytics';
  status: 'ready' | 'generating' | 'error' | 'scheduled';
  lastGenerated?: string;
  nextRun?: string;
  schedule?: string;
  format: 'pdf' | 'csv' | 'excel' | 'json';
  parameters?: Record<string, any>;
}

const Reports: React.FC = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'automated' | 'scheduled' | 'manual' | 'analytics'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'operations' | 'financial' | 'performance' | 'compliance' | 'analytics'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'generating' | 'error' | 'scheduled'>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);

  // Load reports
  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      
      // Mock comprehensive reports
      const mockReports: Report[] = [
        {
          id: '1',
          name: 'Daily Operations Summary',
          description: 'Complete daily operations overview including vehicles, drivers, and zones',
          type: 'automated',
          category: 'operations',
          status: 'ready',
          lastGenerated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
          schedule: 'Daily at 6:00 AM',
          format: 'pdf'
        },
        {
          id: '2',
          name: 'Monthly Performance Analytics',
          description: 'Comprehensive monthly performance metrics and KPIs',
          type: 'scheduled',
          category: 'performance',
          status: 'ready',
          lastGenerated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
          schedule: 'Monthly on 1st',
          format: 'excel'
        },
        {
          id: '3',
          name: 'Driver Efficiency Report',
          description: 'Detailed driver performance and efficiency metrics',
          type: 'manual',
          category: 'performance',
          status: 'ready',
          lastGenerated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          format: 'pdf'
        },
        {
          id: '4',
          name: 'Client Satisfaction Analysis',
          description: 'Client feedback and satisfaction survey results',
          type: 'scheduled',
          category: 'analytics',
          status: 'generating',
          lastGenerated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          format: 'csv'
        },
        {
          id: '5',
          name: 'Financial Summary',
          description: 'Revenue, costs, and profitability analysis',
          type: 'manual',
          category: 'financial',
          status: 'ready',
          lastGenerated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          format: 'excel'
        },
        {
          id: '6',
          name: 'Zone Capacity Analysis',
          description: 'Zone capacity utilization and forecasting',
          type: 'analytics',
          category: 'analytics',
          status: 'ready',
          lastGenerated: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          format: 'pdf'
        },
        {
          id: '7',
          name: 'Vehicle Location Heatmap',
          description: 'Visual heatmap of vehicle locations and density',
          type: 'analytics',
          category: 'operations',
          status: 'ready',
          lastGenerated: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          format: 'json'
        },
        {
          id: '8',
          name: 'Compliance Audit Report',
          description: 'Regulatory compliance and audit trail',
          type: 'scheduled',
          category: 'compliance',
          status: 'scheduled',
          nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          schedule: 'Weekly on Monday',
          format: 'pdf'
        }
      ];

      setReports(mockReports);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter reports
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      if (searchTerm && !report.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !report.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (typeFilter !== 'all' && report.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && report.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && report.status !== statusFilter) return false;
      return true;
    });
  }, [reports, searchTerm, typeFilter, categoryFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredReports.length;
    const automated = filteredReports.filter(r => r.type === 'automated').length;
    const scheduled = filteredReports.filter(r => r.type === 'scheduled').length;
    const manual = filteredReports.filter(r => r.type === 'manual').length;
    const analytics = filteredReports.filter(r => r.type === 'analytics').length;
    const ready = filteredReports.filter(r => r.status === 'ready').length;
    const generating = filteredReports.filter(r => r.status === 'generating').length;

    return { total, automated, scheduled, manual, analytics, ready, generating };
  }, [filteredReports]);

  // Generate report
  const handleGenerateReport = async (report: Report) => {
    setGeneratingReportId(report.id);
    setSelectedReport(report);

    // Update status
    setReports(prev => prev.map(r => 
      r.id === report.id ? { ...r, status: 'generating' as const } : r
    ));

    // Simulate generation
    setTimeout(() => {
      setReports(prev => prev.map(r => 
        r.id === report.id 
          ? { ...r, status: 'ready' as const, lastGenerated: new Date().toISOString() }
          : r
      ));
      setGeneratingReportId(null);
      toast({
        title: 'Report Generated',
        description: `${report.name} has been generated successfully.`,
      });
    }, 2000);
  };

  // Download report
  const handleDownloadReport = (report: Report) => {
    toast({
      title: 'Download Started',
      description: `Downloading ${report.name}...`,
    });
    // Simulate download
    setTimeout(() => {
      toast({
        title: 'Download Complete',
        description: `${report.name} downloaded successfully.`,
      });
    }, 1000);
  };

  // Get type icon
  const getTypeIcon = (type: Report['type']) => {
    switch (type) {
      case 'automated': return <RefreshCw className="w-4 h-4" />;
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      case 'manual': return <FileText className="w-4 h-4" />;
      case 'analytics': return <BarChart3 className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Get status color
  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'ready': return 'text-vizla-success bg-vizla-success/20 border-vizla-success/30';
      case 'generating': return 'text-vizla-brand-primary bg-vizla-brand-primary/20 border-vizla-brand-primary/30';
      case 'error': return 'text-vizla-danger bg-vizla-danger/20 border-vizla-danger/30';
      case 'scheduled': return 'text-vizla-warning bg-vizla-warning/20 border-vizla-warning/30';
      default: return '';
    }
  };

  // Get category color
  const getCategoryColor = (category: Report['category']) => {
    switch (category) {
      case 'operations': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'financial': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'performance': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'compliance': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'analytics': return 'bg-vizla-brand-primary/20 text-vizla-brand-primary border-vizla-brand-primary/30';
      default: return '';
    }
  };

  return (
    <AppShell title="Reports">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-vizla-text-primary mb-2">
              Reports & Analytics
            </h1>
            <p className="text-vizla-text-secondary">
              Generate, schedule, and download comprehensive reports
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Total</span>
              <FileText className="w-4 h-4 text-vizla-text-muted" />
            </div>
            <div className="text-3xl font-bold text-vizla-text-primary">{stats.total}</div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Automated</span>
              <RefreshCw className="w-4 h-4 text-vizla-brand-primary" />
            </div>
            <div className="text-3xl font-bold text-vizla-brand-primary">{stats.automated}</div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Scheduled</span>
              <Calendar className="w-4 h-4 text-vizla-warning" />
            </div>
            <div className="text-3xl font-bold text-vizla-warning">{stats.scheduled}</div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Manual</span>
              <FileText className="w-4 h-4 text-vizla-text-secondary" />
            </div>
            <div className="text-3xl font-bold text-vizla-text-primary">{stats.manual}</div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Analytics</span>
              <BarChart3 className="w-4 h-4 text-vizla-brand-primary" />
            </div>
            <div className="text-3xl font-bold text-vizla-brand-primary">{stats.analytics}</div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Ready</span>
              <CheckCircle2 className="w-4 h-4 text-vizla-success" />
            </div>
            <div className="text-3xl font-bold text-vizla-success">{stats.ready}</div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vizla-text-secondary">Generating</span>
              <Loader2 className="w-4 h-4 text-vizla-brand-primary animate-spin" />
            </div>
            <div className="text-3xl font-bold text-vizla-brand-primary">{stats.generating}</div>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-vizla-text-muted" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-vizla-glassElev/30 border-vizla-glassBorder"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                <SelectTrigger className="w-[140px] bg-vizla-glassElev/30 border-vizla-glassBorder">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="automated">Automated</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={(v: any) => setCategoryFilter(v)}>
                <SelectTrigger className="w-[140px] bg-vizla-glassElev/30 border-vizla-glassBorder">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-[140px] bg-vizla-glassElev/30 border-vizla-glassBorder">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="generating">Generating</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </GlassCard>

        {/* Reports Grid */}
        {isLoading ? (
          <GlassCard className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-vizla-brand-primary mx-auto mb-4" />
            <p className="text-vizla-text-secondary">Loading reports...</p>
          </GlassCard>
        ) : filteredReports.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <FileText className="w-12 h-12 text-vizla-text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-vizla-text-primary mb-2">
              No reports found
            </h3>
            <p className="text-vizla-text-secondary">
              Try adjusting your filters
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <GlassCard key={report.id} className="p-6 hover:shadow-xl transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(report.type)}
                    <h3 className="text-lg font-semibold text-vizla-text-primary">
                      {report.name}
                    </h3>
                  </div>
                  <Badge className={getStatusColor(report.status)}>
                    {report.status}
                  </Badge>
                </div>
                
                <p className="text-sm text-vizla-text-secondary mb-4 line-clamp-2">
                  {report.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={getCategoryColor(report.category)}>
                    {report.category}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {report.format.toUpperCase()}
                  </Badge>
                </div>

                {report.lastGenerated && (
                  <div className="text-xs text-vizla-text-muted mb-2">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Last generated: {new Date(report.lastGenerated).toLocaleString()}
                  </div>
                )}
                {report.schedule && (
                  <div className="text-xs text-vizla-text-muted mb-4">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {report.schedule}
                  </div>
                )}

                {report.status === 'generating' && (
                  <div className="mb-4">
                    <Progress value={undefined} className="h-1" />
                    <p className="text-xs text-vizla-text-muted mt-2">Generating...</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-vizla-glassBorder">
                  {report.status === 'ready' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateReport(report)}
                        className="flex-1 border-vizla-glassBorder"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Regenerate
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDownloadReport(report)}
                        className="flex-1 bg-vizla-brand-primary hover:bg-vizla-brand-primary/90"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </>
                  )}
                  {report.status === 'generating' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      className="flex-1 border-vizla-glassBorder"
                    >
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Generating...
                    </Button>
                  )}
                  {report.status === 'scheduled' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateReport(report)}
                      className="flex-1 border-vizla-glassBorder"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Run Now
                    </Button>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Reports;
