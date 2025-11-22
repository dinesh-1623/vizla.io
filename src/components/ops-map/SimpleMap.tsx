import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface SimpleMapProps {
  className?: string;
}

export default function SimpleMap({ className = '' }: SimpleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAJH6A6pkOEkVjtjQo80qDRVHSIafPdUxQ&callback=initMap`;
    script.async = true;
    script.defer = true;

    // Set up callback
    window.initMap = initializeMap;

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      delete window.initMap;
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !window.google || !window.google.maps) {
      console.log('Map container or Google Maps not ready');
      return;
    }

    try {
      console.log('Initializing simple map...');
      
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 39.8283, lng: -98.5795 }, // Center of USA
        zoom: 4,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP
      });

      // Add a simple marker
      const marker = new window.google.maps.Marker({
        position: { lat: 39.8283, lng: -98.5795 },
        map: map,
        title: 'Test Marker'
      });

      console.log('✅ Simple map initialized successfully!');
      
      // Add click listener
      marker.addListener('click', () => {
        alert('Marker clicked! Map is working!');
      });

    } catch (error) {
      console.error('Error initializing map:', error);
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






