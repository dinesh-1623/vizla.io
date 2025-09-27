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
  
  // Run k-means with seeded centroids for determinism
  const { clusters } = kMeans(points, 4);
  
  // Sort each cluster by distance to centroid for consistent ordering
  const sortedClusters = clusters.map(cluster => {
    const centroid = {
      lat: cluster.reduce((sum, p) => sum + p.lat, 0) / cluster.length,
      lng: cluster.reduce((sum, p) => sum + p.lng, 0) / cluster.length
    };
    
    return cluster.sort((a, b) => {
      const distA = (a.lat - centroid.lat) ** 2 + (a.lng - centroid.lng) ** 2;
      const distB = (b.lat - centroid.lat) ** 2 + (b.lng - centroid.lng) ** 2;
      return distA - distB;
    });
  });
  
  // Balance to exactly 5 each
  const result: Point[][] = [[], [], [], []];
  
  // First, distribute points evenly
  sortedClusters.forEach((cluster, index) => {
    result[index] = [...cluster];
  });
  
  // Balance to exactly 5 each
  while (true) {
    let changed = false;
    
    for (let i = 0; i < 4; i++) {
      if (result[i].length > 5) {
        // Move excess to nearest cluster with < 5
        const excess = result[i].splice(5);
        for (const point of excess) {
          let nearestIndex = -1;
          let minDistance = Infinity;
          
          for (let j = 0; j < 4; j++) {
            if (j !== i && result[j].length < 5) {
              const clusterCentroid = {
                lat: result[j].reduce((sum, p) => sum + p.lat, 0) / (result[j].length || 1),
                lng: result[j].reduce((sum, p) => sum + p.lng, 0) / (result[j].length || 1)
              };
              const distance = (point.lat - clusterCentroid.lat) ** 2 + (point.lng - clusterCentroid.lng) ** 2;
              if (distance < minDistance) {
                minDistance = distance;
                nearestIndex = j;
              }
            }
          }
          
          if (nearestIndex !== -1) {
            result[nearestIndex].push(point);
            changed = true;
          } else {
            result[i].push(point); // Put it back if no space
          }
        }
      }
    }
    
    if (!changed) break;
  }
  
  // Sort clusters by centroid longitude for stable UI order
  const withCentroids = result.map((cluster, index) => ({
    cluster,
    centroid: {
      lat: cluster.reduce((sum, p) => sum + p.lat, 0) / (cluster.length || 1),
      lng: cluster.reduce((sum, p) => sum + p.lng, 0) / (cluster.length || 1)
    },
    index
  }));
  
  withCentroids.sort((a, b) => a.centroid.lng - b.centroid.lng);
  
  return withCentroids.map(item => item.cluster);
}
