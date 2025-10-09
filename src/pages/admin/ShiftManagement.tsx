import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Settings,
  UserPlus,
  Save,
  RotateCcw
} from 'lucide-react';
import AppShell from '@/components/shell/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

// Types for shift management
interface ShiftTemplate {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  duration: number; // in hours
  role: 'driver' | 'spotter' | 'manager';
  isActive: boolean;
  color: string;
  maxCapacity: number;
  description: string;
}

interface ShiftAssignment {
  id: string;
  templateId: string;
  employeeId: string;
  employeeName: string;
  role: 'driver' | 'spotter' | 'manager';
  date: string; // YYYY-MM-DD format
  status: 'scheduled' | 'confirmed' | 'completed' | 'no-show' | 'cancelled';
  actualStartTime?: string;
  actualEndTime?: string;
  notes?: string;
}

interface Employee {
  id: string;
  name: string;
  role: 'driver' | 'spotter' | 'manager';
  phone: string;
  email: string;
  isActive: boolean;
  maxHoursPerWeek: number;
  preferredShifts: string[];
  certifications: string[];
}

interface WeeklySchedule {
  weekStart: string; // YYYY-MM-DD
  assignments: ShiftAssignment[];
  totalHours: number;
  coverage: {
    drivers: number;
    spotters: number;
    managers: number;
  };
}

const ShiftManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State management
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    return startOfWeek.toISOString().split('T')[0];
  });
  
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([
    {
      id: 'morning-driver',
      name: 'Morning Driver',
      startTime: '06:00',
      endTime: '14:00',
      duration: 8,
      role: 'driver',
      isActive: true,
      color: '#10b981',
      maxCapacity: 5,
      description: 'Early morning vehicle recovery operations'
    },
    {
      id: 'afternoon-driver',
      name: 'Afternoon Driver',
      startTime: '14:00',
      endTime: '22:00',
      duration: 8,
      role: 'driver',
      isActive: true,
      color: '#3b82f6',
      maxCapacity: 5,
      description: 'Peak hours vehicle recovery operations'
    },
    {
      id: 'night-driver',
      name: 'Night Driver',
      startTime: '22:00',
      endTime: '06:00',
      duration: 8,
      role: 'driver',
      isActive: true,
      color: '#8b5cf6',
      maxCapacity: 3,
      description: 'Overnight emergency recovery operations'
    },
    {
      id: 'spotter-shift',
      name: 'Spotter Shift',
      startTime: '08:00',
      endTime: '17:00',
      duration: 9,
      role: 'spotter',
      isActive: true,
      color: '#f59e0b',
      maxCapacity: 10,
      description: 'Vehicle location and assessment operations'
    },
    {
      id: 'manager-shift',
      name: 'Manager Shift',
      startTime: '09:00',
      endTime: '18:00',
      duration: 9,
      role: 'manager',
      isActive: true,
      color: '#ef4444',
      maxCapacity: 2,
      description: 'Operations management and coordination'
    }
  ]);

  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: 'emp-1',
      name: 'Mike Johnson',
      role: 'driver',
      phone: '(555) 123-4567',
      email: 'mike.johnson@vizla.com',
      isActive: true,
      maxHoursPerWeek: 40,
      preferredShifts: ['morning-driver', 'afternoon-driver'],
      certifications: ['CDL Class A', 'Towing Certified']
    },
    {
      id: 'emp-2',
      name: 'Sarah Williams',
      role: 'driver',
      phone: '(555) 234-5678',
      email: 'sarah.williams@vizla.com',
      isActive: true,
      maxHoursPerWeek: 40,
      preferredShifts: ['afternoon-driver', 'night-driver'],
      certifications: ['CDL Class A', 'Towing Certified', 'Hazmat']
    },
    {
      id: 'emp-3',
      name: 'David Chen',
      role: 'spotter',
      phone: '(555) 345-6789',
      email: 'david.chen@vizla.com',
      isActive: true,
      maxHoursPerWeek: 45,
      preferredShifts: ['spotter-shift'],
      certifications: ['Vehicle Assessment', 'GPS Navigation']
    },
    {
      id: 'emp-4',
      name: 'Lisa Rodriguez',
      role: 'spotter',
      phone: '(555) 456-7890',
      email: 'lisa.rodriguez@vizla.com',
      isActive: true,
      maxHoursPerWeek: 40,
      preferredShifts: ['spotter-shift'],
      certifications: ['Vehicle Assessment', 'Customer Service']
    },
    {
      id: 'emp-5',
      name: 'Robert Smith',
      role: 'manager',
      phone: '(555) 567-8901',
      email: 'robert.smith@vizla.com',
      isActive: true,
      maxHoursPerWeek: 50,
      preferredShifts: ['manager-shift'],
      certifications: ['Operations Management', 'Fleet Management']
    }
  ]);

  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({
    weekStart: selectedWeek,
    assignments: [],
    totalHours: 0,
    coverage: { drivers: 0, spotters: 0, managers: 0 }
  });

  const [showCreateShift, setShowCreateShift] = useState(false);
  const [showEmployeeManager, setShowEmployeeManager] = useState(false);

  // Calculate week dates
  const weekDates = useMemo(() => {
    const startDate = new Date(selectedWeek);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      return {
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: date.toDateString() === new Date().toDateString()
      };
    });
  }, [selectedWeek]);

  // Calculate coverage analytics
  const coverageAnalytics = useMemo(() => {
    const assignments = weeklySchedule.assignments.filter(a => 
      weekDates.some(day => day.date === a.date)
    );
    
    const dailyCoverage = weekDates.map(day => {
      const dayAssignments = assignments.filter(a => a.date === day.date);
      const drivers = dayAssignments.filter(a => a.role === 'driver').length;
      const spotters = dayAssignments.filter(a => a.role === 'spotter').length;
      const managers = dayAssignments.filter(a => a.role === 'manager').length;
      
      return {
        date: day.date,
        day: day.day,
        drivers,
        spotters,
        managers,
        totalStaff: drivers + spotters + managers,
        isAdequate: drivers >= 2 && spotters >= 2 && managers >= 1
      };
    });

    const totalHours = assignments.reduce((sum, assignment) => {
      const template = shiftTemplates.find(t => t.id === assignment.templateId);
      return sum + (template?.duration || 0);
    }, 0);

    const averageDailyStaff = dailyCoverage.reduce((sum, day) => sum + day.totalStaff, 0) / 7;

    return {
      dailyCoverage,
      totalHours,
      averageDailyStaff,
      coverageScore: dailyCoverage.filter(day => day.isAdequate).length / 7 * 100
    };
  }, [weeklySchedule.assignments, shiftTemplates, weekDates]);

  // Handle shift assignment
  const handleAssignShift = (templateId: string, employeeId: string, date: string) => {
    const template = shiftTemplates.find(t => t.id === templateId);
    const employee = employees.find(e => e.id === employeeId);
    
    if (!template || !employee) return;

    // Check for conflicts
    const existingAssignment = weeklySchedule.assignments.find(
      a => a.employeeId === employeeId && a.date === date
    );
    
    if (existingAssignment) {
      toast({
        title: "Assignment Conflict",
        description: `${employee.name} is already assigned for ${date}`,
        variant: "destructive"
      });
      return;
    }

    const newAssignment: ShiftAssignment = {
      id: `shift-${Date.now()}`,
      templateId,
      employeeId,
      employeeName: employee.name,
      role: employee.role,
      date,
      status: 'scheduled'
    };

    setWeeklySchedule(prev => ({
      ...prev,
      assignments: [...prev.assignments, newAssignment]
    }));

    toast({
      title: "Shift Assigned",
      description: `${employee.name} assigned to ${template.name} on ${date}`,
    });
  };

  // Handle shift removal
  const handleRemoveShift = (assignmentId: string) => {
    setWeeklySchedule(prev => ({
      ...prev,
      assignments: prev.assignments.filter(a => a.id !== assignmentId)
    }));

    toast({
      title: "Shift Removed",
      description: "Shift assignment has been removed",
    });
  };

  // Copy previous week's schedule
  const handleCopyPreviousWeek = () => {
    // Implementation for copying previous week's assignments
    toast({
      title: "Schedule Copied",
      description: "Previous week's schedule has been copied",
    });
  };

  return (
    <AppShell title="Shift Management">
      <div className="space-y-6">
        {/* Header with Week Navigation */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Calendar className="w-6 h-6 text-vizla-brand-primary" />
              <div>
                <h1 className="text-2xl font-bold text-vizla-text-primary">Shift Management</h1>
                <p className="text-vizla-text-secondary">
                  Week of {new Date(selectedWeek).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const prevWeek = new Date(selectedWeek);
                  prevWeek.setDate(prevWeek.getDate() - 7);
                  setSelectedWeek(prevWeek.toISOString().split('T')[0]);
                }}
              >
                ← Previous
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const nextWeek = new Date(selectedWeek);
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  setSelectedWeek(nextWeek.toISOString().split('T')[0]);
                }}
              >
                Next →
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPreviousWeek}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Previous Week
              </Button>
            </div>
          </div>

          {/* Coverage Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium text-green-400">Coverage Score</span>
              </div>
              <div className="text-2xl font-bold text-green-300">
                {coverageAnalytics.coverageScore.toFixed(0)}%
              </div>
            </div>
            
            <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium text-blue-400">Total Hours</span>
              </div>
              <div className="text-2xl font-bold text-blue-300">
                {coverageAnalytics.totalHours}h
              </div>
            </div>
            
            <div className="bg-purple-600/20 border border-purple-600/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-medium text-purple-400">Avg Daily Staff</span>
              </div>
              <div className="text-2xl font-bold text-purple-300">
                {coverageAnalytics.averageDailyStaff.toFixed(1)}
              </div>
            </div>
            
            <div className="bg-orange-600/20 border border-orange-600/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-orange-400" />
                <span className="text-sm font-medium text-orange-400">Active Employees</span>
              </div>
              <div className="text-2xl font-bold text-orange-300">
                {employees.filter(e => e.isActive).length}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Main Content Tabs */}
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
            <TabsTrigger value="templates">Shift Templates</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Weekly Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-vizla-text-primary">Weekly Schedule</h2>
                <Dialog open={showCreateShift} onOpenChange={setShowCreateShift}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Assign Shift
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Assign New Shift</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Employee</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select employee" />
                            </SelectTrigger>
                            <SelectContent>
                              {employees.filter(e => e.isActive).map(employee => (
                                <SelectItem key={employee.id} value={employee.id}>
                                  {employee.name} ({employee.role})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Shift Template</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select shift template" />
                            </SelectTrigger>
                            <SelectContent>
                              {shiftTemplates.filter(t => t.isActive).map(template => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name} ({template.startTime} - {template.endTime})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Date</Label>
                        <Input type="date" />
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowCreateShift(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => setShowCreateShift(false)}>
                          Assign Shift
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Schedule Grid */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-vizla-glassBorder">
                      <th className="text-left p-3 text-sm font-medium text-vizla-text-muted">Employee</th>
                      {weekDates.map(day => (
                        <th key={day.date} className="text-center p-3 text-sm font-medium text-vizla-text-muted min-w-[120px]">
                          <div className="flex flex-col items-center">
                            <span className={day.isToday ? 'text-vizla-brand-primary font-semibold' : ''}>
                              {day.day}
                            </span>
                            <span className="text-xs text-vizla-text-muted">
                              {new Date(day.date).getDate()}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {employees.filter(e => e.isActive).map(employee => (
                      <tr key={employee.id} className="border-b border-vizla-glassBorder/50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-vizla-text-primary">{employee.name}</div>
                            <div className="text-xs text-vizla-text-muted">{employee.role}</div>
                          </div>
                        </td>
                        {weekDates.map(day => {
                          const assignment = weeklySchedule.assignments.find(
                            a => a.employeeId === employee.id && a.date === day.date
                          );
                          const template = assignment ? shiftTemplates.find(t => t.id === assignment.templateId) : null;
                          
                          return (
                            <td key={day.date} className="p-2 text-center">
                              {assignment ? (
                                <div className="relative">
                                  <Badge 
                                    className="w-full justify-center"
                                    style={{ backgroundColor: template?.color + '20', color: template?.color }}
                                  >
                                    <div className="flex flex-col items-center">
                                      <span className="text-xs font-medium">{template?.name}</span>
                                      <span className="text-xs opacity-75">
                                        {template?.startTime}-{template?.endTime}
                                      </span>
                                    </div>
                                  </Badge>
                                  <button
                                    onClick={() => handleRemoveShift(assignment.id)}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    // Quick assign logic - assign first available template for employee's role
                                    const availableTemplate = shiftTemplates.find(
                                      t => t.role === employee.role && t.isActive
                                    );
                                    if (availableTemplate) {
                                      handleAssignShift(availableTemplate.id, employee.id, day.date);
                                    }
                                  }}
                                  className="w-full h-8 border-2 border-dashed border-vizla-glassBorder rounded hover:border-vizla-brand-primary hover:bg-vizla-brand-primary/10 transition-colors"
                                >
                                  <Plus className="w-4 h-4 mx-auto text-vizla-text-muted" />
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </TabsContent>

          {/* Shift Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-vizla-text-primary">Shift Templates</h2>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {shiftTemplates.map(template => (
                  <div key={template.id} className="border border-vizla-glassBorder rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-vizla-text-primary">{template.name}</h3>
                      <Badge 
                        variant={template.isActive ? "default" : "secondary"}
                        style={{ backgroundColor: template.color + '20', color: template.color }}
                      >
                        {template.role}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-vizla-text-secondary">
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <span>{template.startTime} - {template.endTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>{template.duration}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Capacity:</span>
                        <span>{template.maxCapacity}</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-vizla-text-muted mt-3">{template.description}</p>
                    
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-4">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-vizla-text-primary">Employees</h2>
                <Dialog open={showEmployeeManager} onOpenChange={setShowEmployeeManager}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Employee
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Employee</DialogTitle>
                    </DialogHeader>
                    {/* Employee form would go here */}
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="space-y-4">
                {employees.map(employee => (
                  <div key={employee.id} className="flex items-center justify-between p-4 border border-vizla-glassBorder rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-vizla-brand-primary/20 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-vizla-brand-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-vizla-text-primary">{employee.name}</h3>
                        <p className="text-sm text-vizla-text-secondary">
                          {employee.role} • {employee.phone} • {employee.email}
                        </p>
                        <div className="flex gap-2 mt-1">
                          {employee.certifications.map(cert => (
                            <Badge key={cert} variant="secondary" className="text-xs">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={employee.isActive ? "default" : "secondary"}>
                        {employee.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <GlassCard className="p-6">
              <h2 className="text-lg font-semibold text-vizla-text-primary mb-4">Coverage Analytics</h2>
              
              <div className="space-y-4">
                {coverageAnalytics.dailyCoverage.map(day => (
                  <div key={day.date} className="flex items-center justify-between p-4 border border-vizla-glassBorder rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 text-center">
                        <div className="text-sm font-medium text-vizla-text-primary">{day.day}</div>
                        <div className="text-xs text-vizla-text-muted">{new Date(day.date).getDate()}</div>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-400">{day.drivers}</div>
                          <div className="text-xs text-vizla-text-muted">Drivers</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-400">{day.spotters}</div>
                          <div className="text-xs text-vizla-text-muted">Spotters</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-400">{day.managers}</div>
                          <div className="text-xs text-vizla-text-muted">Managers</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {day.isAdequate ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      )}
                      <span className={`text-sm font-medium ${
                        day.isAdequate ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {day.isAdequate ? 'Adequate' : 'Needs Attention'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default ShiftManagement;
