import type { LatLng } from "../hooks";

/** מרחק בקירוב (Haversine) במטרים. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad, dLng = (b[1] - a[1]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m)} מ'` : `${(m / 1000).toFixed(1)} ק"מ`;
}
