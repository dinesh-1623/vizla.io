import React from 'react';

interface StaticMapProps {
  className?: string;
}

export default function StaticMap({ className = '' }: StaticMapProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <div 
        className="w-full h-full relative overflow-hidden"
        style={{ 
          minHeight: '500px',
          backgroundColor: '#1e293b',
          backgroundImage: `
            linear-gradient(45deg, #374151 25%, transparent 25%),
            linear-gradient(-45deg, #374151 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #374151 75%),
            linear-gradient(-45deg, transparent 75%, #374151 75%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }}
      >
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#64748b" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Center marker */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>

        {/* Info panel */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <h3 className="font-semibold text-gray-900">Static Map View</h3>
          <p className="text-sm text-gray-600">Center of USA</p>
          <p className="text-xs text-gray-500">Lat: 39.8283, Lng: -98.5795</p>
        </div>

        {/* Controls */}
        <div className="absolute top-4 right-4 space-y-2">
          <button className="bg-white/90 backdrop-blur-sm rounded p-2 shadow-lg hover:bg-white transition-colors">
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button className="bg-white/90 backdrop-blur-sm rounded p-2 shadow-lg hover:bg-white transition-colors">
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4m8-8v16" />
            </svg>
          </button>
        </div>

        {/* Status */}
        <div className="absolute bottom-4 left-4 bg-green-500/90 backdrop-blur-sm text-white rounded-lg px-3 py-2 shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Map Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}






