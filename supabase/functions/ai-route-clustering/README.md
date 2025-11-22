# AI Route Clustering Edge Function

## Overview
AI-powered route clustering for vehicle repossession operations. Intelligently groups vehicles into optimal routes based on geographic proximity, zone matching, priority, and driver capacity.

## Endpoint
`POST /functions/v1/ai-route-clustering`

## Request Body

```json
{
  "vehicles": [
    {
      "id": "vehicle-1",
      "lat": 39.2904,
      "lng": -76.6122,
      "priority": "now",
      "status": "located",
      "client": "ABC Towing",
      "zone": "Zone A",
      "market": "Baltimore",
      "address": "123 Main St",
      "year": 2020,
      "make": "Toyota",
      "model": "Camry"
    }
  ],
  "drivers": [
    {
      "id": "driver-1",
      "name": "John Doe",
      "zone": "Zone A",
      "market": "Baltimore",
      "location": { "lat": 39.2904, "lng": -76.6122 },
      "capacity": 10,
      "currentLoad": 3,
      "status": "active"
    }
  ],
  "clusteringOptions": {
    "maxVehiclesPerRoute": 10,
    "maxDistanceKm": 50,
    "preferZoneMatching": true,
    "considerPriority": true,
    "considerDriverCapacity": true
  },
  "storageLots": [
    {
      "id": "lot-1",
      "name": "Main Storage",
      "lat": 39.2904,
      "lng": -76.6122
    }
  ]
}
```

## Response

```json
{
  "success": true,
  "clusters": [
    {
      "clusterId": "cluster-1",
      "vehicles": [...],
      "centerPoint": { "lat": 39.2904, "lng": -76.6122 },
      "estimatedRouteTime": 120,
      "estimatedDistance": 25.5,
      "priority": "now",
      "recommendedDriverId": "driver-1",
      "recommendedDriverName": "John Doe",
      "assignmentReason": "Zone match, low utilization",
      "confidenceScore": 0.92,
      "routeOrder": 1,
      "aiInsights": {
        "riskFactors": [],
        "recommendations": ["Start early morning"],
        "optimalStartTime": "08:00"
      }
    }
  ],
  "unclusteredVehicles": [],
  "summary": {
    "totalVehicles": 20,
    "clusteredCount": 18,
    "unclusteredCount": 2,
    "totalRoutes": 3,
    "averageVehiclesPerRoute": 6,
    "averageRouteTime": 90,
    "averageRouteDistance": 20,
    "processingTimeMs": 1500
  },
  "recommendations": [
    "Cluster 1 should be dispatched first (high priority)"
  ],
  "tokenUsage": {
    "totalTokens": 2500,
    "promptTokens": 2000,
    "completionTokens": 500,
    "estimatedCostUsd": 0.0015
  }
}
```

## Environment Variables
- `OPENAI_API_KEY` - Required. OpenAI API key for GPT-4o-mini model.

## Features
- **Intelligent Clustering**: Groups vehicles by proximity, zone, and priority
- **Route Optimization**: Calculates optimal route order and time estimates
- **Driver Assignment**: Suggests best driver for each cluster
- **AI Insights**: Provides risk factors and recommendations
- **Cost Tracking**: Logs token usage and estimated costs

## Usage Example

```typescript
const result = await supabase.functions.invoke('ai-route-clustering', {
  body: {
    vehicles: vehiclesWithCoords,
    clusteringOptions: {
      maxVehiclesPerRoute: 10,
      maxDistanceKm: 50,
      preferZoneMatching: true,
      considerPriority: true,
    },
  },
});
```

## Error Handling
Returns `success: false` with error message if:
- No vehicles provided
- No vehicles with valid coordinates
- OpenAI API error
- Invalid request format


