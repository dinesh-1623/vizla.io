import React from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SegmentedToggle } from '@/components/dashboard/SegmentedToggle';
import { 
  HEATMAP_PALETTES, 
  getColorForCount, 
  getPaletteOptions,
  type PaletteType 
} from '@/lib/palette';

interface LegendProps {
  maxCount: number;
  currentPalette: PaletteType;
  onPaletteChange: (palette: PaletteType) => void;
  className?: string;
}

export const Legend: React.FC<LegendProps> = ({ 
  maxCount, 
  currentPalette, 
  onPaletteChange,
  className 
}) => {
  const palette = HEATMAP_PALETTES[currentPalette];
  const steps = [0, Math.ceil(maxCount * 0.17), Math.ceil(maxCount * 0.33), Math.ceil(maxCount * 0.5), Math.ceil(maxCount * 0.67), Math.ceil(maxCount * 0.83), maxCount];
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Palette Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-vizla-text-muted uppercase tracking-wider">
          Heatmap Palette:
        </span>
        <SegmentedToggle
          options={getPaletteOptions()}
          value={currentPalette}
          onChange={onPaletteChange}
        />
      </div>

      {/* Compact Legend */}
      <div className="flex items-center gap-4">
        <span className="text-xs font-medium text-vizla-text-muted uppercase tracking-wider">
          Count Scale:
        </span>
        
        <div className="flex items-center gap-1">
          {steps.map((value, index) => {
            const colorData = getColorForCount(value, maxCount, currentPalette);
            return (
              <div key={value} className="flex flex-col items-center gap-1">
                <div
                  className="w-5 h-5 rounded border border-vizla-glassBorder flex items-center justify-center"
                  style={{
                    backgroundColor: colorData.color
                  }}
                >
                  <span 
                    className="text-[10px] font-medium"
                    style={{ color: colorData.textColor }}
                  >
                    {value}
                  </span>
                </div>
                <span className="text-[10px] text-vizla-text-muted">
                  {index === 0 ? 'Min' : index === steps.length - 1 ? 'Max' : ''}
                </span>
              </div>
            );
          })}
        </div>

        {/* Help */}
        <div className="flex items-center gap-2 text-xs text-vizla-text-muted ml-auto">
          <HelpCircle className="w-3 h-3" />
          <span>
            Click cells to filter • Use arrow keys to navigate • Enter to select
          </span>
        </div>
      </div>
    </div>
  );
};
