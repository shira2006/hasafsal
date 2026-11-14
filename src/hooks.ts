import { useEffect, useState } from "react";

export type LatLng = [number, number];

/** מיקום המשתמש בזמן אמת. */
export function useGeolocation(onError: () => void) {
  const [pos, setPos] = useState<LatLng | null>(null);
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setPos([p.coords.latitude, p.coords.longitude]),
      onError,
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return pos;
}

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3000);
    return () => clearTimeout(t);
  }, [msg]);
  return [msg, setMsg] as const;
}
