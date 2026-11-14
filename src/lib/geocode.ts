import type { Bounds } from "../types";

export interface GeoResult { lat: number; lng: number; label: string }

/**
 * חיפוש כתובת בשירות Nominatim של OpenStreetMap (חינמי, למגבלות שימוש ראו https://operations.osmfoundation.org/policies/nominatim/ :
 * בקשה אחת בכל פעם, רק לפי פעולת משתמש, בלי השלמה אוטומטית). לפני השקה ציבורית כדאי לעבור לספק ייעודי.
 * הצבעה על ישראל בלבד כרגע.
 */
export async function geocode(query: string, near: Bounds | null): Promise<GeoResult | null> {
  const params = new URLSearchParams({ format: "jsonv2", q: query, limit: "1", addressdetails: "1", "accept-language": "he", countrycodes: "il" });
  if (near) params.set("viewbox", `${near.west},${near.north},${near.east},${near.south}`);
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
  if (!res.ok) throw new Error(`חיפוש כתובת נכשל (${res.status})`);
  type Addr = { road?: string; house_number?: string; city?: string; town?: string; village?: string; suburb?: string };
  const list = (await res.json()) as { lat: string; lon: string; display_name: string; address?: Addr }[];
  const r = list[0];
  if (!r) return null;
  const a = r.address ?? {};
  const street = [a.road, a.house_number].filter(Boolean).join(" ");
  const city = a.city ?? a.town ?? a.village ?? a.suburb;
  const label = [street, city].filter(Boolean).join(", ") || r.display_name.split(",").slice(0, 2).join(",").trim();
  return { lat: Number(r.lat), lng: Number(r.lon), label };
}
