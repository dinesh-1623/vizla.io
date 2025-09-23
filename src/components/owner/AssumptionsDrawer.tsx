import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Settings, X } from 'lucide-react';

export interface Assumptions {
  hookTimeMin: number;
  unloadTimeMin: number;
  averageMph: number;
  driverCostPerHour: number;
  revenuePerTow: number;
  avgMinPerTow: number;
}

interface AssumptionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  assumptions: Assumptions;
  onAssumptionsChange: (assumptions: Assumptions) => void;
  className?: string;
}

const DEFAULT_ASSUMPTIONS: Assumptions = {
  hookTimeMin: 15,
  unloadTimeMin: 10,
  averageMph: 25,
  driverCostPerHour: 35,
  revenuePerTow: 150,
  avgMinPerTow: 45,
};

const AssumptionsDrawer: React.FC<AssumptionsDrawerProps> = ({
  isOpen,
  onClose,
  assumptions,
  onAssumptionsChange,
  className
}) => {
  const [formData, setFormData] = useState<Assumptions>(assumptions);
  const [errors, setErrors] = useState<Partial<Record<keyof Assumptions, string>>>({});

  // Update form data when assumptions prop changes
  useEffect(() => {
    setFormData(assumptions);
  }, [assumptions]);

  // Validate input values
  const validateInput = (key: keyof Assumptions, value: number): string => {
    switch (key) {
      case 'hookTimeMin':
      case 'unloadTimeMin':
      case 'avgMinPerTow':
        return value < 0 || value > 120 ? 'Must be between 0 and 120 minutes' : '';
      case 'averageMph':
        return value < 1 || value > 100 ? 'Must be between 1 and 100 mph' : '';
      case 'driverCostPerHour':
        return value < 10 || value > 200 ? 'Must be between $10 and $200 per hour' : '';
      case 'revenuePerTow':
        return value < 50 || value > 1000 ? 'Must be between $50 and $1000 per tow' : '';
      default:
        return '';
    }
  };

  // Handle input changes
  const handleInputChange = (key: keyof Assumptions, value: string) => {
    const numValue = parseFloat(value);
    
    if (isNaN(numValue) && value !== '') {
      return; // Don't update if not a valid number
    }

    const newFormData = { ...formData, [key]: numValue };
    setFormData(newFormData);

    // Validate the input
    const error = validateInput(key, numValue);
    setErrors(prev => ({
      ...prev,
      [key]: error
    }));

    // Update parent if valid
    if (!error && !isNaN(numValue)) {
      onAssumptionsChange(newFormData);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    setFormData(DEFAULT_ASSUMPTIONS);
    setErrors({});
    onAssumptionsChange(DEFAULT_ASSUMPTIONS);
  };

  // Check if form has errors
  const hasErrors = Object.values(errors).some(error => error !== '');

  return (
    <>
      {/* Scrim */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[50] bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div className={cn(
        "fixed top-0 right-0 z-[60] h-full w-80 bg-vizla-elev1/95 backdrop-blur-md ring-1 ring-vizla-glassBorder text-vizla-text-secondary transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-vizla-borderSubtle">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-vizla-brand-primary" />
            <h2 className="text-lg font-semibold text-vizla-text-primary">
              Route Assumptions
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-vizla-glassElev transition-colors focus-visible:ring-2 focus-visible:ring-vizla-ring-focus"
            aria-label="Close assumptions drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 overflow-y-auto h-full pb-20">
          {/* Hook Time */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-vizla-text-primary">
              Hook Time (minutes)
            </label>
            <input
              type="number"
              value={formData.hookTimeMin}
              onChange={(e) => handleInputChange('hookTimeMin', e.target.value)}
              className={cn(
                "w-full px-3 py-2 rounded-lg bg-vizla-glass text-vizla-text-primary ring-1 ring-vizla-glassBorder placeholder:text-vizla-text-muted focus:ring-2 focus:ring-vizla-ring-focus focus:outline-none transition-colors",
                errors.hookTimeMin && "ring-vizla-danger"
              )}
              placeholder="15"
              min="0"
              max="120"
              step="1"
            />
            {errors.hookTimeMin && (
              <p className="text-xs text-vizla-danger">{errors.hookTimeMin}</p>
            )}
          </div>

          {/* Unload Time */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-vizla-text-primary">
              Unload Time (minutes)
            </label>
            <input
              type="number"
              value={formData.unloadTimeMin}
              onChange={(e) => handleInputChange('unloadTimeMin', e.target.value)}
              className={cn(
                "w-full px-3 py-2 rounded-lg bg-vizla-glass text-vizla-text-primary ring-1 ring-vizla-glassBorder placeholder:text-vizla-text-muted focus:ring-2 focus:ring-vizla-ring-focus focus:outline-none transition-colors",
                errors.unloadTimeMin && "ring-vizla-danger"
              )}
              placeholder="10"
              min="0"
              max="120"
              step="1"
            />
            {errors.unloadTimeMin && (
              <p className="text-xs text-vizla-danger">{errors.unloadTimeMin}</p>
            )}
          </div>

          {/* Average MPH */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-vizla-text-primary">
              Average MPH
            </label>
            <input
              type="number"
              value={formData.averageMph}
              onChange={(e) => handleInputChange('averageMph', e.target.value)}
              className={cn(
                "w-full px-3 py-2 rounded-lg bg-vizla-glass text-vizla-text-primary ring-1 ring-vizla-glassBorder placeholder:text-vizla-text-muted focus:ring-2 focus:ring-vizla-ring-focus focus:outline-none transition-colors",
                errors.averageMph && "ring-vizla-danger"
              )}
              placeholder="25"
              min="1"
              max="100"
              step="1"
            />
            {errors.averageMph && (
              <p className="text-xs text-vizla-danger">{errors.averageMph}</p>
            )}
          </div>

          {/* Driver Cost Per Hour */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-vizla-text-primary">
              Driver Cost ($/hour)
            </label>
            <input
              type="number"
              value={formData.driverCostPerHour}
              onChange={(e) => handleInputChange('driverCostPerHour', e.target.value)}
              className={cn(
                "w-full px-3 py-2 rounded-lg bg-vizla-glass text-vizla-text-primary ring-1 ring-vizla-glassBorder placeholder:text-vizla-text-muted focus:ring-2 focus:ring-vizla-ring-focus focus:outline-none transition-colors",
                errors.driverCostPerHour && "ring-vizla-danger"
              )}
              placeholder="35"
              min="10"
              max="200"
              step="1"
            />
            {errors.driverCostPerHour && (
              <p className="text-xs text-vizla-danger">{errors.driverCostPerHour}</p>
            )}
          </div>

          {/* Revenue Per Tow */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-vizla-text-primary">
              Revenue Per Tow ($)
            </label>
            <input
              type="number"
              value={formData.revenuePerTow}
              onChange={(e) => handleInputChange('revenuePerTow', e.target.value)}
              className={cn(
                "w-full px-3 py-2 rounded-lg bg-vizla-glass text-vizla-text-primary ring-1 ring-vizla-glassBorder placeholder:text-vizla-text-muted focus:ring-2 focus:ring-vizla-ring-focus focus:outline-none transition-colors",
                errors.revenuePerTow && "ring-vizla-danger"
              )}
              placeholder="150"
              min="50"
              max="1000"
              step="1"
            />
            {errors.revenuePerTow && (
              <p className="text-xs text-vizla-danger">{errors.revenuePerTow}</p>
            )}
          </div>

          {/* Average Minutes Per Tow */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-vizla-text-primary">
              Avg Minutes Per Tow
            </label>
            <input
              type="number"
              value={formData.avgMinPerTow}
              onChange={(e) => handleInputChange('avgMinPerTow', e.target.value)}
              className={cn(
                "w-full px-3 py-2 rounded-lg bg-vizla-glass text-vizla-text-primary ring-1 ring-vizla-glassBorder placeholder:text-vizla-text-muted focus:ring-2 focus:ring-vizla-ring-focus focus:outline-none transition-colors",
                errors.avgMinPerTow && "ring-vizla-danger"
              )}
              placeholder="45"
              min="0"
              max="120"
              step="1"
            />
            {errors.avgMinPerTow && (
              <p className="text-xs text-vizla-danger">{errors.avgMinPerTow}</p>
            )}
          </div>

          {/* Reset Button */}
          <div className="pt-4 border-t border-vizla-borderSubtle">
            <button
              onClick={handleReset}
              className="w-full px-4 py-2 rounded-lg bg-vizla-glass text-vizla-text-secondary ring-1 ring-vizla-glassBorder hover:bg-vizla-glassElev hover:text-vizla-text-primary transition-colors focus-visible:ring-2 focus-visible:ring-vizla-ring-focus"
            >
              Reset to Defaults
            </button>
          </div>

          {/* Status Indicator */}
          {hasErrors && (
            <div className="p-3 rounded-lg bg-vizla-danger/10 border border-vizla-danger/20">
              <p className="text-xs text-vizla-danger">
                Please fix validation errors above to update calculations.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AssumptionsDrawer;
