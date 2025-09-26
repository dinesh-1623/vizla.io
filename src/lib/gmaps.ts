import { LatLng } from "./geo";

export function asWaypoint(p: LatLng | string) {
  return typeof p === "string" ? p : `${p.lat},${p.lng}`;
}

export function mapsUrl({
  origin, destination, waypoints
}: { origin: LatLng | string; destination: LatLng | string; waypoints: (LatLng | string)[] }) {
  const base = "https://www.google.com/maps/dir/?api=1";
  const wp = waypoints.length
    ? `&waypoints=optimize:true|${waypoints.map(asWaypoint).join("|")}`
    : "";
  return `${base}&origin=${encodeURIComponent(asWaypoint(origin))}` +
         `&destination=${encodeURIComponent(asWaypoint(destination))}${wp}`;
}
