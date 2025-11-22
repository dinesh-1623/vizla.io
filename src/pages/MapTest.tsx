import React from 'react';
import SimpleMap from '../components/ops-map/SimpleMap';

export default function MapTest() {
  return (
    <div className="h-screen w-screen bg-gray-900">
      <div className="p-4 bg-blue-600 text-white">
        <h1 className="text-2xl font-bold">Google Maps Test</h1>
        <p className="text-sm">Testing if Google Maps API key works</p>
      </div>
      <div className="h-[calc(100vh-80px)]">
        <SimpleMap />
      </div>
    </div>
  );
}






