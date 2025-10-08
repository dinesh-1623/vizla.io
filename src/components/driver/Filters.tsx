import React from 'react';
import { X } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-vizla-text-muted uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-vizla-glass text-vizla-text-primary ring-1 ring-vizla-glassBorder rounded-xl px-3 py-2 pr-8 text-sm shadow-sm placeholder:text-vizla-text-muted focus:outline-none focus:ring-2 focus:ring-vizla-ring-focus transition-all appearance-none"
          style={{
            // Ensure dropdown appears above other elements and is not clipped
            zIndex: 9999,
            position: 'relative'
          }}
          aria-label={label}
        >
          <option value="" className="bg-vizla-elev1">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-vizla-elev1">
              {option.label}
            </option>
          ))}
        </select>
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-vizla-text-muted hover:text-vizla-text-primary transition-colors z-10"
            aria-label={`Clear ${label} filter`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

interface FiltersProps {
  weekRange: string;
  setWeekRange: (value: string) => void;
  client: string;
  setClient: (value: string) => void;
  zone: string;
  setZone: (value: string) => void;
  timeLocated: string;
  setTimeLocated: (value: string) => void;
  vizlaRoute: string;
  setVizlaRoute: (value: string) => void;
  assignedDriver: string;
  setAssignedDriver: (value: string) => void;
  clients: string[];
  drivers: string[];
}

export const Filters: React.FC<FiltersProps> = ({
  weekRange,
  setWeekRange,
  client,
  setClient,
  zone,
  setZone,
  timeLocated,
  setTimeLocated,
  vizlaRoute,
  setVizlaRoute,
  assignedDriver,
  setAssignedDriver,
  clients,
  drivers,
}) => {
  const weekOptions: FilterOption[] = [
    { value: 'this-week', label: 'This week' },
    { value: 'previous-week', label: 'Previous week' },
  ];

  const clientOptions: FilterOption[] = clients.map((c) => ({ value: c, label: c }));
  const driverOptions: FilterOption[] = drivers.map((d) => ({ value: d, label: d }));

  const zoneOptions: FilterOption[] = [
    { value: 'Dallas-North', label: 'Dallas-North' },
    { value: 'Dallas-East', label: 'Dallas-East' },
    { value: 'Dallas-South', label: 'Dallas-South' },
    { value: 'Dallas-West', label: 'Dallas-West' },
  ];

  const timeOptions: FilterOption[] = [
    { value: 'Less than 1 hour', label: 'Less than 1 hour' },
    { value: 'Over 1 hour', label: 'Over 1 hour' },
    { value: 'Over 2 hours', label: 'Over 2 hours' },
    { value: '5+ hours', label: '5+ hours' },
  ];

  const vizlaOptions: FilterOption[] = [
    { value: 'Storage Lot Destination', label: 'Storage Lot Destination' },
    { value: 'Cache Destination', label: 'Cache Destination' },
  ];

  return (
    <div className="rounded-2xl bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder p-4" style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4" style={{ overflow: 'visible' }}>
        <FilterSelect
          label="Week range"
          value={weekRange}
          onChange={setWeekRange}
          options={weekOptions}
          placeholder="Select week range"
        />
        <FilterSelect
          label="Client"
          value={client}
          onChange={setClient}
          options={clientOptions}
          placeholder="Select client"
        />
        <FilterSelect
          label="Zone"
          value={zone}
          onChange={setZone}
          options={zoneOptions}
          placeholder="Select zone"
        />
        <FilterSelect
          label="Length of time"
          value={timeLocated}
          onChange={setTimeLocated}
          options={timeOptions}
          placeholder="Select time"
        />
        <FilterSelect
          label="Vizla Route"
          value={vizlaRoute}
          onChange={setVizlaRoute}
          options={vizlaOptions}
          placeholder="Select route"
        />
        <FilterSelect
          label="Assigned Driver"
          value={assignedDriver}
          onChange={setAssignedDriver}
          options={driverOptions}
          placeholder="Select driver"
        />
      </div>
    </div>
  );
};