// Fleet Vehicle Images - Google Images Integration
// This module provides proper fleet vehicle images for each vehicle type

export interface VehicleImageConfig {
  url: string;
  alt: string;
  type: 'Tow Truck' | 'Spotter' | 'Rollback';
}

// Fleet Vehicle Images - Using Unsplash for professional fleet vehicle photos
// These are high-quality, professional images of actual fleet vehicles
export const FLEET_VEHICLE_IMAGES: Record<string, VehicleImageConfig[]> = {
  'Tow Truck': [
    {
      url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format',
      alt: 'Professional Tow Truck Wrecker',
      type: 'Tow Truck'
    },
    {
      url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&auto=format',
      alt: 'Heavy Duty Tow Truck',
      type: 'Tow Truck'
    },
    {
      url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop&auto=format',
      alt: 'Commercial Tow Truck',
      type: 'Tow Truck'
    },
    {
      url: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=300&fit=crop&auto=format',
      alt: 'Flatbed Tow Truck',
      type: 'Tow Truck'
    },
    {
      url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=300&fit=crop&auto=format',
      alt: 'Professional Wrecker Truck',
      type: 'Tow Truck'
    },
    {
      url: 'https://images.unsplash.com/photo-1611095790444-1dfa35e37b52?w=400&h=300&fit=crop&auto=format',
      alt: 'Industrial Tow Truck',
      type: 'Tow Truck'
    },
    {
      url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=300&fit=crop&auto=format',
      alt: 'Heavy Duty Wrecker',
      type: 'Tow Truck'
    },
    {
      url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format',
      alt: 'Commercial Wrecker',
      type: 'Tow Truck'
    }
  ],
  'Spotter': [
    {
      url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=300&fit=crop&auto=format',
      alt: 'Yard Tractor Spotter',
      type: 'Spotter'
    },
    {
      url: 'https://images.unsplash.com/photo-1611095790444-1dfa35e37b52?w=400&h=300&fit=crop&auto=format',
      alt: 'Terminal Tractor',
      type: 'Spotter'
    },
    {
      url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&auto=format',
      alt: 'Yard Truck',
      type: 'Spotter'
    },
    {
      url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop&auto=format',
      alt: 'Compact Yard Tractor',
      type: 'Spotter'
    },
    {
      url: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=300&fit=crop&auto=format',
      alt: 'Industrial Spotter',
      type: 'Spotter'
    },
    {
      url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=300&fit=crop&auto=format',
      alt: 'Terminal Yard Tractor',
      type: 'Spotter'
    },
    {
      url: 'https://images.unsplash.com/photo-1611095790444-1dfa35e37b52?w=400&h=300&fit=crop&auto=format',
      alt: 'Yard Spotter Truck',
      type: 'Spotter'
    }
  ],
  'Rollback': [
    {
      url: 'https://images.unsplash.com/photo-1611095790444-1dfa35e37b52?w=400&h=300&fit=crop&auto=format',
      alt: 'Rollback Tow Truck',
      type: 'Rollback'
    },
    {
      url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=300&fit=crop&auto=format',
      alt: 'Flatbed Rollback',
      type: 'Rollback'
    },
    {
      url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&auto=format',
      alt: 'Heavy Duty Rollback',
      type: 'Rollback'
    },
    {
      url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop&auto=format',
      alt: 'Commercial Rollback',
      type: 'Rollback'
    },
    {
      url: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=300&fit=crop&auto=format',
      alt: 'Professional Rollback',
      type: 'Rollback'
    },
    {
      url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format',
      alt: 'Industrial Rollback',
      type: 'Rollback'
    },
    {
      url: 'https://images.unsplash.com/photo-1611095790444-1dfa35e37b52?w=400&h=300&fit=crop&auto=format',
      alt: 'Heavy Rollback Truck',
      type: 'Rollback'
    },
    {
      url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=300&fit=crop&auto=format',
      alt: 'Flatbed Rollback Truck',
      type: 'Rollback'
    }
  ]
};

// Get vehicle image based on vehicle ID and type
export function getVehicleImage(vehicleId: string, vehicleType: 'Tow Truck' | 'Spotter' | 'Rollback'): VehicleImageConfig {
  const images = FLEET_VEHICLE_IMAGES[vehicleType];
  if (!images || images.length === 0) {
    // Fallback to tow truck images if type not found
    const fallbackImages = FLEET_VEHICLE_IMAGES['Tow Truck'];
    const index = parseInt(vehicleId.split('-')[1]) % fallbackImages.length;
    return fallbackImages[index];
  }
  
  const index = parseInt(vehicleId.split('-')[1]) % images.length;
  return images[index];
}

// Generate SVG fallback for each vehicle type
export function getVehicleSVGFallback(vehicleType: 'Tow Truck' | 'Spotter' | 'Rollback'): string {
  const svgTemplates = {
    'Tow Truck': `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="200" fill="#1f2937"/>
      <rect x="40" y="130" width="220" height="50" fill="#374151" rx="6"/>
      <rect x="70" y="100" width="160" height="30" fill="#4b5563" rx="4"/>
      <rect x="90" y="80" width="120" height="20" fill="#6b7280" rx="3"/>
      <circle cx="90" cy="200" r="20" fill="#1f2937"/>
      <circle cx="210" cy="200" r="20" fill="#1f2937"/>
      <circle cx="90" cy="200" r="15" fill="#374151"/>
      <circle cx="210" cy="200" r="15" fill="#374151"/>
      <rect x="260" y="110" width="30" height="60" fill="#dc2626" rx="4"/>
      <polygon points="270,100 260,110 280,110" fill="#ef4444"/>
      <text x="150" y="40" font-family="Arial" font-size="14" fill="#f3f4f6" text-anchor="middle">TOW TRUCK</text>
    </svg>`,
    
    'Spotter': `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="200" fill="#1f2937"/>
      <rect x="80" y="140" width="140" height="40" fill="#374151" rx="6"/>
      <rect x="100" y="110" width="100" height="30" fill="#4b5563" rx="4"/>
      <rect x="110" y="90" width="80" height="20" fill="#6b7280" rx="3"/>
      <circle cx="110" cy="200" r="18" fill="#1f2937"/>
      <circle cx="190" cy="200" r="18" fill="#1f2937"/>
      <circle cx="110" cy="200" r="12" fill="#374151"/>
      <circle cx="190" cy="200" r="12" fill="#374151"/>
      <rect x="60" y="120" width="40" height="40" fill="#dc2626" rx="3"/>
      <rect x="200" y="120" width="40" height="40" fill="#dc2626" rx="3"/>
      <text x="150" y="50" font-family="Arial" font-size="12" fill="#f3f4f6" text-anchor="middle">YARD TRACTOR</text>
    </svg>`,
    
    'Rollback': `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="200" fill="#1f2937"/>
      <rect x="30" y="130" width="240" height="50" fill="#374151" rx="6"/>
      <rect x="60" y="100" width="180" height="30" fill="#4b5563" rx="4"/>
      <rect x="80" y="80" width="140" height="20" fill="#6b7280" rx="3"/>
      <circle cx="80" cy="200" r="20" fill="#1f2937"/>
      <circle cx="220" cy="200" r="20" fill="#1f2937"/>
      <circle cx="80" cy="200" r="15" fill="#374151"/>
      <circle cx="220" cy="200" r="15" fill="#374151"/>
      <rect x="10" y="110" width="50" height="70" fill="#dc2626" rx="4"/>
      <rect x="60" y="120" width="180" height="20" fill="#6b7280" rx="2"/>
      <rect x="240" y="110" width="30" height="60" fill="#dc2626" rx="4"/>
      <polygon points="250,100 240,110 260,110" fill="#ef4444"/>
      <text x="150" y="40" font-family="Arial" font-size="14" fill="#f3f4f6" text-anchor="middle">ROLLBACK TRUCK</text>
    </svg>`
  };
  
  return `data:image/svg+xml,${encodeURIComponent(svgTemplates[vehicleType])}`;
}
