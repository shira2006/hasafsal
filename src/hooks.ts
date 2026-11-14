import { useEffect, useState } from "react";

export type LatLng = [number, number];

/** מיקום המשתמש בזמן אמת. */
export function useGeolocation(onError: () => void) {
  const [pos, setPos] = useState<LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null); // רדיוס אי-הוודאות של המיקום, במטרים
  useEffect(() => {
    // לפיתוח בלבד (לא נכלל בגרסת הפרודקשן): ‎?mockLoc=32.07,34.77[,דיוק]‎ מדמה מיקום, כדי לבדוק בלי GPS
    if (import.meta.env.DEV) {
      const m = new URLSearchParams(location.search).get("mockLoc")?.split(",").map(Number);
      if (m && m.length >= 2 && m.every(Number.isFinite)) { setPos([m[0], m[1]]); setAccuracy(m[2] ?? 5); return; }
    }
    if (!("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (p) => { setPos([p.coords.latitude, p.coords.longitude]); setAccuracy(p.coords.accuracy); },
      onError,
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { pos, accuracy };
}

/** true רק אם הדגל נשאר דלוק יותר מ-ms. כדי שמציין טעינה לא יבהב בטעינות מהירות. */
export function useDelayedFlag(flag: boolean, ms = 400) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!flag) { setShown(false); return; }
    const t = setTimeout(() => setShown(true), ms);
    return () => clearTimeout(t);
  }, [flag, ms]);
  return shown;
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
