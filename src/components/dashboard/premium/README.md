# Premium Dashboard Architecture

Enterprise-grade dashboard components following Apple + McKinsey + Palantir design principles.

## Philosophy

**Apple**: Clean, minimal, spacing-driven, high polish  
**McKinsey**: Clear, executive decision-focused data presentation  
**Palantir**: Data-dense, information-rich, analytical

## Architecture

### Component Structure

```
premium/
├── DashboardShell.tsx      # Main container component
├── DashboardTopBar.tsx     # Premium navigation bar
├── DashboardFilters.tsx    # Executive filter controls
├── DashboardMetrics.tsx    # KPI metrics section
├── MetricTile.tsx          # Individual metric card
├── DashboardContent.tsx    # Content container + sections
├── DateRangePicker.tsx     # Premium date range selector
└── index.ts                # Exports
```

### Design Principles

1. **Spacing-Driven Design**
   - Consistent 8px base unit
   - Generous whitespace (Apple-style)
   - Clear visual hierarchy through spacing

2. **Typography Hierarchy**
   - Executive-focused headings
   - Tabular numbers for metrics
   - Clear label/value relationships

3. **Minimal Visual Noise**
   - Subtle borders (`vizla-glassBorder`)
   - Soft shadows only on hover
   - Neutral color palette

4. **Enterprise Interactions**
   - Smooth transitions (200ms)
   - Clear focus states
   - Keyboard navigation support

## Usage

### Basic Implementation

```tsx
import { DashboardShell, DashboardMetrics, type Metric } from '@/components/dashboard/premium';

const metrics: Metric[] = [
  {
    id: 'total',
    label: 'Total Vehicles',
    value: '1,247',
    trend: 'up',
    trendValue: '+12.5%',
    icon: Truck,
  },
];

export const MyDashboard = () => {
  return (
    <DashboardShell title="Operations Dashboard">
      <DashboardMetrics metrics={metrics} />
      {/* Your content */}
    </DashboardShell>
  );
};
```

### Advanced Implementation

See `DashboardPremium.tsx` for a complete example with:
- Filters
- Metrics
- Chart placeholders
- Table placeholders
- Content sections

## Components

### DashboardShell

Main container component that wraps all dashboard content.

**Props:**
- `title`: Page title
- `subtitle`: Optional description
- `showFilters`: Show filter section (default: true)
- `showMetrics`: Show metrics section (default: true)
- `actions`: Custom actions in top bar

### DashboardMetrics

Grid of KPI metric tiles.

**Props:**
- `metrics`: Array of Metric objects
- `columns`: Responsive column configuration
- `isLoading`: Loading state

**Metric Interface:**
```typescript
interface Metric {
  id: string;
  label: string;
  value: string | number;
  formattedValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  subtitle?: string;
  icon?: React.ComponentType;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}
```

### DashboardFilters

Executive filter controls with dropdowns and date range.

**Props:**
- `markets`, `zones`, `statuses`, `clients`: Filter option arrays
- `values`: Current filter selections
- `onChange`: Change handler
- `showClearAll`: Show clear all button

### DashboardContent

Main content container with optimal spacing.

**Props:**
- `maxWidth`: Content width constraint
- `className`: Custom styles

### ContentSection

Organizes content into distinct sections.

**Props:**
- `title`: Section title
- `subtitle`: Section description
- `actions`: Section header actions

### PlaceholderCard

Placeholder for charts and tables.

**Props:**
- `title`: Card title
- `description`: Card description
- `height`: Minimum height
- `children`: Custom content

## Styling

All components use Vizla design tokens:
- `vizla-canvas`: Background
- `vizla-elev1`, `vizla-elev2`: Surface elevations
- `vizla-glassBorder`: Subtle borders
- `vizla-text-primary`, `vizla-text-secondary`, `vizla-text-muted`: Text hierarchy
- `vizla-brand-primary`: Accent color

## Responsive Design

- Mobile: Single column, stacked layout
- Tablet: 2-3 columns
- Desktop: 4-6 columns for metrics
- Large screens: Optimal max-width (1920px)

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus indicators
- Semantic HTML structure

## Next Steps

1. **Replace placeholders with real charts**
   - Use Recharts or ECharts
   - Maintain clean, minimal styling

2. **Add real data loading**
   - Connect to your API/store
   - Handle loading states
   - Error boundaries

3. **Enhance interactions**
   - Add Framer Motion for micro-animations
   - Smooth transitions between states
   - Loading skeletons

4. **Extend components**
   - Add more filter types
   - Custom metric variants
   - Additional content sections

## Best Practices

1. **Always use the design tokens** - Don't hardcode colors
2. **Maintain spacing consistency** - Use the 8px grid
3. **Keep it minimal** - Remove unnecessary visual elements
4. **Focus on data** - Make information easy to scan
5. **Test accessibility** - Keyboard nav and screen readers




