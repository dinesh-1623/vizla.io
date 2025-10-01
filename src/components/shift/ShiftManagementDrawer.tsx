import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, Target, MapPin, FileText } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Shift, Market, Zone, Driver, ShiftFormData } from '@/lib/shift/types';
import { saveShift, updateShift } from '@/lib/shift/store';
import { 
  calculateShiftLength, 
  deriveShiftType, 
  validateShiftForm
} from '@/lib/shift/utils';
import { getZonesByMarket } from '@/lib/shift/seed';

interface ShiftManagementDrawerProps {
  shift?: Shift | null;
  onClose: () => void;
  markets: Market[];
  zones: Zone[];
  drivers: Driver[];
}

export const ShiftManagementDrawer: React.FC<ShiftManagementDrawerProps> = ({
  shift,
  onClose,
  markets,
  zones,
  drivers
}) => {
  const isEditing = !!shift;
  
  // Form state
  const [formData, setFormData] = useState<ShiftFormData>({
    marketId: '',
    zoneId: '',
    startDateTime: '',
    endDateTime: '',
    shiftType: 'Day',
    capacity: 1,
    goalTows: 0,
    startingPoint: {
      type: 'Not Fixed'
    },
    storageLot: '',
    assignedDriverIds: [],
    notes: ''
  });
  
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form data
  useEffect(() => {
    if (shift) {
      setFormData({
        marketId: shift.marketId,
        zoneId: shift.zoneId,
        startDateTime: shift.startISO,
        endDateTime: shift.endISO,
        shiftType: shift.shiftType,
        capacity: shift.capacity,
        goalTows: shift.goalTows,
        startingPoint: shift.startingPoint,
        storageLot: shift.storageLot,
        assignedDriverIds: shift.assignedDriverIds,
        notes: shift.notes || ''
      });
    } else {
      // Set default values for new shift
      const now = new Date();
      const startTime = new Date(now);
      startTime.setHours(6, 0, 0, 0);
      const endTime = new Date(startTime);
      endTime.setHours(14, 0, 0, 0);
      
      setFormData({
        marketId: '',
        zoneId: '',
        startDateTime: startTime.toISOString(),
        endDateTime: endTime.toISOString(),
        shiftType: 'Day',
        capacity: 1,
        goalTows: 0,
        startingPoint: {
          type: 'Not Fixed'
        },
        storageLot: '',
        assignedDriverIds: [],
        notes: ''
      });
    }
  }, [shift]);
  
  // Get zones filtered by selected market
  const filteredZones = formData.marketId 
    ? getZonesByMarket(formData.marketId)
    : zones;
  
  // Calculate shift length when times change
  const shiftLength = formData.startDateTime && formData.endDateTime
    ? calculateShiftLength(formData.startDateTime, formData.endDateTime)
    : 0;
  
  // Derive shift type when start time changes
  useEffect(() => {
    if (formData.startDateTime) {
      const derivedType = deriveShiftType(formData.startDateTime);
      setFormData(prev => ({ ...prev, shiftType: derivedType }));
    }
  }, [formData.startDateTime]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateShiftForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    setIsSubmitting(true);
    setErrors([]);
    
    try {
      const shiftData: Shift = {
        id: shift?.id || `shift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        marketId: formData.marketId,
        zoneId: formData.zoneId,
        startISO: formData.startDateTime,
        endISO: formData.endDateTime,
        lengthMin: shiftLength,
        shiftType: formData.shiftType,
        capacity: formData.capacity,
        goalTows: formData.goalTows,
        startingPoint: formData.startingPoint,
        storageLot: formData.storageLot,
        assignedDriverIds: formData.assignedDriverIds,
        notes: formData.notes,
        createdAt: shift?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      if (isEditing) {
        updateShift(shift.id, shiftData);
      } else {
        saveShift(shiftData);
      }
      
      // Show success message (you could add a toast here)
      onClose();
    } catch (error) {
      console.error('Error saving shift:', error);
      setErrors(['Failed to save shift. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle input changes
  const handleInputChange = (field: keyof ShiftFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear zone when market changes
    if (field === 'marketId') {
      setFormData(prev => ({
        ...prev,
        marketId: value,
        zoneId: ''
      }));
    }
  };
  
  // Handle starting point change
  const handleStartingPointChange = (type: 'Fixed' | 'Not Fixed', address?: string) => {
    setFormData(prev => ({
      ...prev,
      startingPoint: {
        type,
        address: type === 'Fixed' ? address : undefined
      }
    }));
  };
  
  // Handle driver selection
  const handleDriverToggle = (driverId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedDriverIds: prev.assignedDriverIds.includes(driverId)
        ? prev.assignedDriverIds.filter(id => id !== driverId)
        : [...prev.assignedDriverIds, driverId]
    }));
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl h-full bg-vizla-elev1/95 backdrop-blur-md ring-1 ring-vizla-glassBorder overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-vizla-text-primary">
              {isEditing ? 'Edit Shift' : 'Create Shift'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-vizla-glass text-vizla-text-secondary hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <ul className="text-sm text-red-400">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Market and Zone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-vizla-text-primary mb-2">
                  Market *
                </label>
                <select
                  value={formData.marketId}
                  onChange={(e) => handleInputChange('marketId', e.target.value)}
                  className="w-full px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus"
                  required
                >
                  <option value="">Select Market</option>
                  {markets.map((market) => (
                    <option key={market.id} value={market.id}>
                      {market.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-vizla-text-primary mb-2">
                  Zone *
                </label>
                <select
                  value={formData.zoneId}
                  onChange={(e) => handleInputChange('zoneId', e.target.value)}
                  className="w-full px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus"
                  required
                  disabled={!formData.marketId}
                >
                  <option value="">Select Zone</option>
                  {filteredZones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Start and End Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-vizla-text-primary mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Shift Start *
                </label>
                <input
                  type="datetime-local"
                  value={formData.startDateTime ? new Date(formData.startDateTime).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleInputChange('startDateTime', e.target.value ? new Date(e.target.value).toISOString() : '')}
                  className="w-full px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-vizla-text-primary mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Shift End *
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDateTime ? new Date(formData.endDateTime).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleInputChange('endDateTime', e.target.value ? new Date(e.target.value).toISOString() : '')}
                  className="w-full px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus"
                  required
                />
              </div>
            </div>
            
            {/* Length and Shift Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-vizla-text-primary mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Length (auto-calculated)
                </label>
                <input
                  type="text"
                  value={shiftLength > 0 ? `${Math.floor(shiftLength / 60)}h ${shiftLength % 60}m` : ''}
                  className="w-full px-3 py-2 bg-vizla-elev1 border border-vizla-glassBorder rounded-lg text-vizla-text-muted"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-vizla-text-primary mb-2">
                  Shift Type (auto-derived)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleInputChange('shiftType', 'Day')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.shiftType === 'Day'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-vizla-glass text-vizla-text-secondary border border-vizla-glassBorder'
                    }`}
                  >
                    Day
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('shiftType', 'Night')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.shiftType === 'Night'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-vizla-glass text-vizla-text-secondary border border-vizla-glassBorder'
                    }`}
                  >
                    Night
                  </button>
                </div>
              </div>
            </div>
            
            {/* Capacity and Goal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-vizla-text-primary mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Capacity (trucks) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-vizla-text-primary mb-2">
                  <Target className="w-4 h-4 inline mr-1" />
                  Goal (tows) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.goalTows}
                  onChange={(e) => handleInputChange('goalTows', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus"
                  required
                />
              </div>
            </div>
            
            {/* Starting Point */}
            <div>
              <label className="block text-sm font-medium text-vizla-text-primary mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Starting Point *
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartingPointChange('Not Fixed')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.startingPoint.type === 'Not Fixed'
                        ? 'bg-vizla-brand-primary/20 text-vizla-brand-primary border border-vizla-brand-primary/30'
                        : 'bg-vizla-glass text-vizla-text-secondary border border-vizla-glassBorder'
                    }`}
                  >
                    Not Fixed
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartingPointChange('Fixed')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.startingPoint.type === 'Fixed'
                        ? 'bg-vizla-brand-primary/20 text-vizla-brand-primary border border-vizla-brand-primary/30'
                        : 'bg-vizla-glass text-vizla-text-secondary border border-vizla-glassBorder'
                    }`}
                  >
                    Fixed
                  </button>
                </div>
                
                {formData.startingPoint.type === 'Fixed' && (
                  <input
                    type="text"
                    placeholder="Enter starting address"
                    value={formData.startingPoint.address || ''}
                    onChange={(e) => handleStartingPointChange('Fixed', e.target.value)}
                    className="w-full px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus"
                    required
                  />
                )}
              </div>
            </div>
            
            {/* Storage Lot */}
            <div>
              <label className="block text-sm font-medium text-vizla-text-primary mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Storage Lot *
              </label>
              <input
                type="text"
                placeholder="Enter storage lot address"
                value={formData.storageLot}
                onChange={(e) => handleInputChange('storageLot', e.target.value)}
                className="w-full px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus"
                required
              />
            </div>
            
            {/* Assign Drivers */}
            <div>
              <label className="block text-sm font-medium text-vizla-text-primary mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Assign Drivers
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {drivers.map((driver) => (
                  <label
                    key={driver.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-vizla-glass hover:bg-vizla-glassElev cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.assignedDriverIds.includes(driver.id)}
                      onChange={() => handleDriverToggle(driver.id)}
                      className="w-4 h-4 text-vizla-brand-primary bg-vizla-glass border-vizla-glassBorder rounded focus:ring-vizla-ring-focus"
                    />
                    <span className="text-sm text-vizla-text-primary">{driver.name}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-vizla-text-primary mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Notes (optional)
              </label>
              <textarea
                placeholder="Add any additional notes..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-vizla-glass border border-vizla-glassBorder rounded-lg text-vizla-text-primary focus:ring-2 focus:ring-vizla-ring-focus focus:border-vizla-ring-focus resize-none"
              />
            </div>
            
            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-vizla-glassBorder">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-vizla-text-secondary hover:text-vizla-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-vizla-brand-primary text-white rounded-lg hover:bg-vizla-brand-primary/80 focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : isEditing ? 'Update Shift' : 'Create Shift'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
