import React from 'react';
import { Edit, Copy, Trash2, Clock, MapPin, Users, Target, Calendar } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Shift, Market, Zone, Driver } from '@/lib/shift/types';
import { 
  calculateShiftProgress, 
  formatDateTime, 
  formatDuration,
  getShiftTypeColorClass,
  getProgressStatusColorClass 
} from '@/lib/shift/utils';

interface ShiftCardProps {
  shift: Shift;
  onEdit: (shift: Shift) => void;
  onDuplicate: (shift: Shift) => void;
  onDelete: (shiftId: string) => void;
  markets: Market[];
  zones: Zone[];
  drivers: Driver[];
}

export const ShiftCard: React.FC<ShiftCardProps> = ({
  shift,
  onEdit,
  onDuplicate,
  onDelete,
  markets,
  zones,
  drivers
}) => {
  const market = markets.find(m => m.id === shift.marketId);
  const zone = zones.find(z => z.id === shift.zoneId);
  const assignedDrivers = drivers.filter(d => shift.assignedDriverIds.includes(d.id));
  
  const progress = calculateShiftProgress(shift);
  
  return (
    <GlassCard className="backdrop-blur-md ring-1 ring-vizla-glassBorder">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-vizla-text-primary">
                {market?.name} • {zone?.name}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getShiftTypeColorClass(shift.shiftType)}`}>
                {shift.shiftType}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-vizla-text-muted">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDateTime(shift.startISO)} - {formatDateTime(shift.endISO)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(shift.lengthMin)}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(shift)}
              className="p-2 rounded-lg bg-vizla-glass text-vizla-text-secondary hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
              title="Edit shift"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDuplicate(shift)}
              className="p-2 rounded-lg bg-vizla-glass text-vizla-text-secondary hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
              title="Duplicate shift"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(shift.id)}
              className="p-2 rounded-lg bg-vizla-glass text-red-400 hover:bg-red-500/10 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
              title="Delete shift"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          {/* Capacity & Goal */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-vizla-text-muted">
              <Users className="w-4 h-4" />
              <span>Capacity</span>
            </div>
            <div className="text-lg font-semibold text-vizla-text-primary">
              {shift.capacity} truck{shift.capacity !== 1 ? 's' : ''}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-vizla-text-muted">
              <Target className="w-4 h-4" />
              <span>Goal</span>
            </div>
            <div className="text-lg font-semibold text-vizla-text-primary">
              {shift.goalTows} tows
            </div>
          </div>

          {/* Starting Point & Storage */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-vizla-text-muted">
              <MapPin className="w-4 h-4" />
              <span>Starting Point</span>
            </div>
            <div className="text-sm text-vizla-text-primary">
              <div className="font-medium">{shift.startingPoint.type}</div>
              {shift.startingPoint.address && (
                <div className="text-vizla-text-muted mt-1">
                  {shift.startingPoint.address}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-vizla-text-muted">
              <MapPin className="w-4 h-4" />
              <span>Storage Lot</span>
            </div>
            <div className="text-sm text-vizla-text-primary">
              {shift.storageLot}
            </div>
          </div>

          {/* Assigned Drivers */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-vizla-text-muted">
              <Users className="w-4 h-4" />
              <span>Assigned Drivers</span>
            </div>
            <div className="space-y-2">
              {assignedDrivers.length === 0 ? (
                <div className="text-sm text-vizla-text-muted">No drivers assigned</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {assignedDrivers.map((driver) => (
                    <div
                      key={driver.id}
                      className="flex items-center gap-2 px-3 py-1 bg-vizla-glass rounded-full text-sm"
                    >
                      <div className="w-6 h-6 bg-vizla-brand-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-vizla-brand-primary">
                          {driver.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="text-vizla-text-primary">{driver.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-vizla-text-primary">
                Shift Progress
              </span>
              <span className="text-sm text-vizla-text-muted">
                {progress.actual} of {shift.goalTows}
              </span>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getProgressStatusColorClass(progress.status)}`}>
              {progress.status}
            </span>
          </div>
          
          <div className="w-full bg-vizla-glass rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                progress.status === 'On Track' ? 'bg-green-500' :
                progress.status === 'At Risk' ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, progress.progressPercentage)}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between mt-1 text-xs text-vizla-text-muted">
            <span>Expected: {Math.round(progress.expectedSoFar)} tows</span>
            <span>{Math.round(progress.progressPercentage)}% complete</span>
          </div>
        </div>

        {/* Notes */}
        {shift.notes && (
          <div className="pt-4 border-t border-vizla-glassBorder">
            <div className="text-sm text-vizla-text-muted mb-1">Notes</div>
            <div className="text-sm text-vizla-text-primary">{shift.notes}</div>
          </div>
        )}
      </div>
    </GlassCard>
  );
};
