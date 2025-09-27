import { type Point } from './routing';

export type ClusterResult = {
  centroids: Array<{ lat: number; lng: number }>;
  clusters: Point[][];
};

// Simple k-means clustering for grouping points
export function kMeans(points: Point[], k: number, maxIterations = 10): ClusterResult {
  if (points.length <= k) {
    return {
      centroids: points.map(p => ({ lat: p.lat, lng: p.lng })),
      clusters: points.map(p => [p])
    };
  }

  // Initialize centroids randomly
  const shuffled = [...points].sort(() => Math.random() - 0.5);
  let centroids = shuffled.slice(0, k).map(p => ({ lat: p.lat, lng: p.lng }));

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Assign points to nearest centroid
    const clusters: Point[][] = Array(k).fill(null).map(() => []);
    
    for (const point of points) {
      let nearestIndex = 0;
      let minDistance = Infinity;
      
      for (let i = 0; i < centroids.length; i++) {
        const distance = (point.lat - centroids[i].lat) ** 2 + (point.lng - centroids[i].lng) ** 2;
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }
      
      clusters[nearestIndex].push(point);
    }

    // Update centroids
    const newCentroids = centroids.map((_, i) => {
      const cluster = clusters[i];
      if (cluster.length === 0) return centroids[i];
      
      const avgLat = cluster.reduce((sum, p) => sum + p.lat, 0) / cluster.length;
      const avgLng = cluster.reduce((sum, p) => sum + p.lng, 0) / cluster.length;
      
      return { lat: avgLat, lng: avgLng };
    });

    // Check convergence
    let converged = true;
    for (let i = 0; i < centroids.length; i++) {
      const distance = Math.sqrt(
        (centroids[i].lat - newCentroids[i].lat) ** 2 + 
        (centroids[i].lng - newCentroids[i].lng) ** 2
      );
      if (distance > 0.001) {
        converged = false;
        break;
      }
    }

    centroids = newCentroids;
    if (converged) break;
  }

  // Final assignment
  const finalClusters: Point[][] = Array(k).fill(null).map(() => []);
  for (const point of points) {
    let nearestIndex = 0;
    let minDistance = Infinity;
    
    for (let i = 0; i < centroids.length; i++) {
      const distance = (point.lat - centroids[i].lat) ** 2 + (point.lng - centroids[i].lng) ** 2;
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }
    
    finalClusters[nearestIndex].push(point);
  }

  return { centroids, clusters: finalClusters };
}

// Balance clusters to exactly targetSize each by moving closest points
export function balanceClusters(clusters: Point[][], targetSize: number): Point[][] {
  const result = clusters.map(cluster => [...cluster]);
  const totalPoints = result.reduce((sum, cluster) => sum + cluster.length, 0);
  
  if (totalPoints === 0) return result;

  // Calculate target sizes (distribute remainder evenly)
  const baseSize = Math.floor(totalPoints / result.length);
  const remainder = totalPoints % result.length;
  const targetSizes = result.map((_, i) => baseSize + (i < remainder ? 1 : 0));

  // Redistribute points
  while (true) {
    let changed = false;

    for (let i = 0; i < result.length; i++) {
      if (result[i].length < targetSizes[i]) {
        // Need more points - find closest point from largest cluster
        let largestIndex = -1;
        let largestSize = 0;
        
        for (let j = 0; j < result.length; j++) {
          if (j !== i && result[j].length > targetSizes[j] && result[j].length > largestSize) {
            largestIndex = j;
            largestSize = result[j].length;
          }
        }

        if (largestIndex !== -1) {
          // Find closest point in largest cluster to current cluster centroid
          const currentCentroid = {
            lat: result[i].reduce((sum, p) => sum + p.lat, 0) / result[i].length,
            lng: result[i].reduce((sum, p) => sum + p.lng, 0) / result[i].length
          };

          let closestIndex = -1;
          let minDistance = Infinity;

          for (let k = 0; k < result[largestIndex].length; k++) {
            const point = result[largestIndex][k];
            const distance = (point.lat - currentCentroid.lat) ** 2 + (point.lng - currentCentroid.lng) ** 2;
            if (distance < minDistance) {
              minDistance = distance;
              closestIndex = k;
            }
          }

          if (closestIndex !== -1) {
            const point = result[largestIndex].splice(closestIndex, 1)[0];
            result[i].push(point);
            changed = true;
          }
        }
      }
    }

    if (!changed) break;
  }

  return result;
}

// Main function to cluster points into days
export function clusterIntoDays(points: Point[], k = 4): Point[][] {
  if (points.length === 0) return [];
  
  const { clusters } = kMeans(points, k);
  const targetSize = Math.ceil(points.length / k);
  
  return balanceClusters(clusters, targetSize);
}

// Enforce exactly 4 days with 5 pickups each
export function clusterIntoFourDays(points: Point[]): Point[][] {
  if (points.length === 0) return [[], [], [], []];
  
  // If we have exactly 20 points, distribute them deterministically
  if (points.length === 20) {
    // Sort points by longitude for consistent ordering
    const sortedPoints = [...points].sort((a, b) => a.lng - b.lng);
    
    // Distribute evenly: first 5, next 5, next 5, last 5
    return [
      sortedPoints.slice(0, 5),
      sortedPoints.slice(5, 10),
      sortedPoints.slice(10, 15),
      sortedPoints.slice(15, 20)
    ];
  }
  
  // For other cases, use k-means but ensure balanced distribution
  const { clusters } = kMeans(points, 4);
  
  // Flatten all points and distribute evenly
  const allPoints = clusters.flat();
  const result: Point[][] = [[], [], [], []];
  
  // Distribute points evenly across 4 days
  allPoints.forEach((point, index) => {
    const dayIndex = index % 4;
    result[dayIndex].push(point);
  });
  
  // Ensure each day has exactly 5 points by redistributing
  while (result.some(day => day.length !== 5)) {
    const overIndex = result.findIndex(day => day.length > 5);
    const underIndex = result.findIndex(day => day.length < 5);
    
    if (overIndex !== -1 && underIndex !== -1) {
      const point = result[overIndex].pop()!;
      result[underIndex].push(point);
    } else {
      break; // Safety break
    }
  }
  
  // Sort each day's points by longitude for consistent ordering
  result.forEach(day => {
    day.sort((a, b) => a.lng - b.lng);
  });
  
  return result;
}
