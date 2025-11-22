/**
 * Polygon Utilities
 * Helper functions for working with zone polygons
 */

export interface Point {
  lat: number;
  lng: number;
}

/**
 * Calculate the centroid (center point) of a polygon
 */
export function calculatePolygonCentroid(points: Point[]): Point {
  if (points.length === 0) {
    return { lat: 0, lng: 0 };
  }

  if (points.length === 1) {
    return points[0];
  }

  let sumLat = 0;
  let sumLng = 0;

  points.forEach(point => {
    sumLat += point.lat;
    sumLng += point.lng;
  });

  return {
    lat: sumLat / points.length,
    lng: sumLng / points.length
  };
}

/**
 * Calculate the area of a polygon using the shoelace formula
 */
export function calculatePolygonArea(points: Point[]): number {
  if (points.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].lng * points[j].lat;
    area -= points[j].lng * points[i].lat;
  }
  return Math.abs(area / 2);
}

/**
 * Check if a point is inside a polygon
 */
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;
    
    const intersect = ((yi > point.lat) !== (yj > point.lat)) &&
      (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Distribute points evenly within a polygon for label placement
 * Returns multiple points to avoid overlap
 */
export function distributePointsInPolygon(polygon: Point[], count: number = 1): Point[] {
  if (count <= 1) {
    return [calculatePolygonCentroid(polygon)];
  }

  const centroid = calculatePolygonCentroid(polygon);
  const points: Point[] = [centroid];

  // Calculate bounding box
  const lats = polygon.map(p => p.lat);
  const lngs = polygon.map(p => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // Add additional points around the centroid
  for (let i = 1; i < count; i++) {
    const angle = (2 * Math.PI * i) / count;
    const radius = Math.min(maxLat - minLat, maxLng - minLng) * 0.2;
    
    const point: Point = {
      lat: centroid.lat + radius * Math.cos(angle),
      lng: centroid.lng + radius * Math.sin(angle)
    };

    // Only add if point is inside polygon
    if (pointInPolygon(point, polygon)) {
      points.push(point);
    }
  }

  return points;
}

