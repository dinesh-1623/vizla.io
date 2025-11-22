import React from 'react';
import LeafletMap from '../components/ops-map/LeafletMap';

export default function LeafletTest() {
  return (
    <div className="h-screen w-screen bg-gray-900">
      <div className="p-4 bg-green-600 text-white">
        <h1 className="text-2xl font-bold">Leaflet Map Test</h1>
        <p className="text-sm">Testing OpenStreetMap with Leaflet (no API key required)</p>
      </div>
      <div className="h-[calc(100vh-80px)]">
        <LeafletMap />
      </div>
    </div>
  );
}






