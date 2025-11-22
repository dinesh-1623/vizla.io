import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    L: any;
  }
}

interface LeafletMapProps {
  className?: string;
}

export default function LeafletMap({ className = '' }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = initializeMap;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !window.L) {
      console.log('Map container or Leaflet not ready');
      return;
    }

    try {
      console.log('Initializing Leaflet map...');
      
      // Initialize map
      const map = window.L.map(mapRef.current).setView([39.8283, -98.5795], 4);
      mapInstanceRef.current = map;

      // Add OpenStreetMap tiles
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add a marker
      const marker = window.L.marker([39.8283, -98.5795]).addTo(map);
      marker.bindPopup('Test Marker - Map is working!').openPopup();

      console.log('✅ Leaflet map initialized successfully!');
      
      // Add click listener
      marker.on('click', () => {
        alert('Marker clicked! Leaflet map is working!');
      });

    } catch (error) {
      console.error('Error initializing Leaflet map:', error);
    }
  };

  return (
    <div className={`w-full h-full ${className}`}>
      <div 
        ref={mapRef} 
        className="w-full h-full"
        style={{ 
          minHeight: '500px',
          backgroundColor: '#1e293b'
        }}
      />
    </div>
  );
}






