import React from 'react';
import StaticMap from '../components/ops-map/StaticMap';

export default function StaticMapTest() {
  return (
    <div className="h-screen w-screen bg-gray-900">
      <div className="p-4 bg-purple-600 text-white">
        <h1 className="text-2xl font-bold">Static Map Test</h1>
        <p className="text-sm">No external APIs required - Pure CSS/SVG implementation</p>
      </div>
      <div className="h-[calc(100vh-80px)]">
        <StaticMap />
      </div>
    </div>
  );
}






