import type { Bounds } from "../types";

export interface GeoResult { lat: number; lng: number; label: string }

/**
 * Nominatim של OpenStreetMap (חינמי). מגבלות שימוש: https://operations.osmfoundation.org/policies/nominatim/
 * בקשה אחת בכל פעם, רק בעקבות פעולת משתמש ובלי השלמה אוטומטית בזמן הקלדה. לפני השקה ציבורית כדאי לעבור לספק ייעודי.
 * החיפוש מוגבל לישראל כרגע.
 */
const BASE = "https://nominatim.openstreetmap.org";

type Addr = { road?: string; house_number?: string; city?: string; town?: string; village?: string; suburb?: string };
type Hit = { lat: string; lon: string; name?: string; display_name: string; address?: Addr };

/** "רחוב מספר, עיר", ואם אין רחוב: שם המקום או שני החלקים הראשונים של הכתובת המלאה. */
function labelOf(r: Hit): string {
  const a = r.address ?? {};
  const street = [a.road, a.house_number].filter(Boolean).join(" ");
  const city = a.city ?? a.town ?? a.village ?? a.suburb;
  return [street, city].filter(Boolean).join(", ") || r.name || r.display_name.split(",").slice(0, 2).join(",").trim();
}

/** כתובת → נקודה על המפה. */
export async function geocode(query: string, near: Bounds | null): Promise<GeoResult | null> {
  const params = new URLSearchParams({ format: "jsonv2", q: query, limit: "1", addressdetails: "1", "accept-language": "he", countrycodes: "il" });
  if (near) params.set("viewbox", `${near.west},${near.north},${near.east},${near.south}`);
  const res = await fetch(`${BASE}/search?${params}`);
  if (!res.ok) throw new Error(`חיפוש כתובת נכשל (${res.status})`);
  const r = ((await res.json()) as Hit[])[0];
  return r ? { lat: Number(r.lat), lng: Number(r.lon), label: labelOf(r) } : null;
}

/** נקודה על המפה → כתובת אמיתית (למשל "דיזנגוף 50, תל אביב"). null אם לא נמצאה כתובת. */
export async function reverseGeocode(lat: number, lng: number, signal?: AbortSignal): Promise<string | null> {
  const params = new URLSearchParams({ format: "jsonv2", lat: String(lat), lon: String(lng), zoom: "18", addressdetails: "1", "accept-language": "he" });
  const res = await fetch(`${BASE}/reverse?${params}`, { signal });
  if (!res.ok) throw new Error(`זיהוי כתובת נכשל (${res.status})`);
  const r = (await res.json()) as Hit & { error?: string };
  return r.error ? null : labelOf(r);
}
