import React from 'react';
import { GoogleMapsOperations } from '../components/ops-map/GoogleMapsOperations';

export default function OperationsMapPage() {
  return (
    <div className="h-screen overflow-hidden">
      <GoogleMapsOperations />
    </div>
  );
}
