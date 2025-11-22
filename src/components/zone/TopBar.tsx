import React, { useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ZONE_OPTIONS, SORT_OPTIONS, type SortOption } from '@/lib/mockData/zoneCapacity';

interface TopBarProps {
  selectedZones: string[];
  onZonesChange: (zones: string[]) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  selectedZones,
  onZonesChange,
  sortBy,
  onSortChange
}) => {
  const [open, setOpen] = useState(false);

  const handleZoneSelect = (zoneId: string) => {
    const newSelection = selectedZones.includes(zoneId)
      ? selectedZones.filter(id => id !== zoneId)
      : [...selectedZones, zoneId];
    onZonesChange(newSelection);
  };

  const handleRemoveZone = (zoneId: string) => {
    onZonesChange(selectedZones.filter(id => id !== zoneId));
  };

  const selectedZoneLabels = selectedZones.map(zoneId => {
    const zone = ZONE_OPTIONS.find(z => z.value === zoneId);
    return zone?.label || zoneId;
  });

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Multi Search - Zone Selection */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-vizla-text-secondary mb-2">
          Multi Search
        </label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder text-vizla-text-primary hover:bg-vizla-glassElev"
            >
              <div className="flex items-center gap-2 flex-wrap">
                {selectedZones.length === 0 ? (
                  <span className="text-vizla-text-muted">Select Zones</span>
                ) : (
                  selectedZoneLabels.map((label, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1 bg-vizla-elev1 text-vizla-text-primary border-vizla-glassBorder"
                    >
                      {label}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-vizla-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveZone(selectedZones[index]);
                        }}
                      />
                    </Badge>
                  ))
                )}
              </div>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search zones..." />
              <CommandList>
                <CommandEmpty>No zones found.</CommandEmpty>
                <CommandGroup>
                  {ZONE_OPTIONS.map((zone) => (
                    <CommandItem
                      key={zone.value}
                      value={zone.value}
                      onSelect={() => handleZoneSelect(zone.value)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedZones.includes(zone.value) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {zone.label}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Sort By */}
      <div className="sm:w-64">
        <label className="block text-sm font-medium text-vizla-text-secondary mb-2">
          Sort By
        </label>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder text-vizla-text-primary hover:bg-vizla-glassElev">
            <SelectValue placeholder="Select sort option" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
