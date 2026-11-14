import { useEffect, useState } from "react";

export type LatLng = [number, number];

/** מיקום המשתמש בזמן אמת. */
export function useGeolocation(onError: () => void) {
  const [pos, setPos] = useState<LatLng | null>(null);
  useEffect(() => {
    // לפיתוח בלבד (לא נכלל בגרסת הפרודקשן): ‎?mockLoc=32.07,34.77‎ מדמה מיקום, כדי לבדוק בלי GPS
    if (import.meta.env.DEV) {
      const m = new URLSearchParams(location.search).get("mockLoc")?.split(",").map(Number);
      if (m && m.length === 2 && m.every(Number.isFinite)) { setPos([m[0], m[1]]); return; }
    }
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

export type View = "map" | "about";

/** ניווט פשוט לפי hash (#/about), כך שכפתור "אחורה" עובד ואין צורך בהגדרות שרת. */
export function useView(): View {
  const get = (): View => (location.hash === "#/about" ? "about" : "map");
  const [view, setView] = useState<View>(get);
  useEffect(() => {
    const on = () => setView(get());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return view;
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
