import { useCallback, useEffect, useRef, useState } from "react";
import MapView, { type Focus } from "./components/MapView";
import ItemSheet from "./components/ItemSheet";
import AddSheet from "./components/AddSheet";
import Navbar from "./components/Navbar";
import FloatingMenu from "./components/FloatingMenu";
import AboutPage from "./components/AboutPage";
import { useGeolocation, useToast, useView, type LatLng } from "./hooks";
import { createItem, fetchItemsInBounds, removeItem, subscribeItems } from "./lib/items";
import { geocode, reverseGeocode } from "./lib/geocode";
import { distanceMeters } from "./lib/geo";
import type { Bounds, Item } from "./types";

const CURRENT_LABEL = "המיקום הנוכחי";
const errText =(e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? String(e));

export default function App() {
  const [toast, setToast] = useToast();
  const view = useView();
  const { pos: me, accuracy: meAccuracy } = useGeolocation(() => setToast("אין גישה למיקום. אשרו מיקום בדפדפן"));
  const meAccuracyRef = useRef<number | null>(null);
  meAccuracyRef.current = meAccuracy;
  const [items, setItems] = useState<Map<string, Item>>(new Map());
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pick, setPick] = useState<LatLng | null>(null);
  const [pickSource, setPickSource] = useState<"current" | "map" | "search">("map"); // איך נבחר המיקום
  const [pickAddress, setPickAddress] = useState<string | null>(null); // כתובת אמיתית של המיקום הנבחר, אם כבר ידועה
  const [dragging, setDragging] = useState(false); // מצב גרירה: אפשר להזיז את הלב על המפה
  const [focus, setFocus] = useState<Focus | null>(null);
  const [recenter, setRecenter] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const boundsRef = useRef<Bounds | null>(null);
  boundsRef.current = bounds;

  // טעינת פריטים לפי האזור שמוצג במפה. הטעינה מחליפה את הרשימה, כך שפריטים שנלקחו בזמן שהאפליקציה
  // הייתה ברקע נעלמים, ופריטים רחוקים לא נשארים בזיכרון.
  useEffect(() => {
    if (!bounds) return;
    const t = setTimeout(async () => {
      try {
        const list = await fetchItemsInBounds(bounds);
        setItems(new Map(list.map((i) => [i.id, i])));
      } catch (e) { setToast("שגיאה בטעינה: " + errText(e)); }
    }, 300);
    return () => clearTimeout(t);
  }, [bounds, refreshKey, setToast]);

  // Realtime: מחוברים רק כשהאפליקציה מוצגת על המסך (חוסך חיבורים מהמגבלה של 200),
  // ומתעלמים מפריטים חדשים שמחוץ לאזור שמוצג. בחזרה לחזית טוענים מחדש.
  useEffect(() => {
    let unsub: (() => void) | null = null;
    const start = () => {
      if (unsub) return;
      unsub = subscribeItems(
        (i) => {
          const b = boundsRef.current;
          if (b && (i.lat < b.south || i.lat > b.north || i.lng < b.west || i.lng > b.east)) return;
          setItems((p) => new Map(p).set(i.id, i));
        },
        (id) => {
          setItems((p) => { const m = new Map(p); m.delete(id); return m; });
          setSelectedId((cur) => (cur === id ? null : cur));
        }
      );
    };
    const stop = () => { unsub?.(); unsub = null; };
    const onVis = () => {
      if (document.visibilityState === "visible") { start(); setRefreshKey((k) => k + 1); }
      else stop();
    };
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVis);
    return () => { document.removeEventListener("visibilitychange", onVis); stop(); };
  }, []);

  const onBounds = useCallback((b: Bounds) => setBounds(b), []);
  const selected = selectedId ? items.get(selectedId) ?? null : null;

  async function took(item: Item) {
    try { await removeItem(item); setSelectedId(null); setToast("תודה! עדכנו את המפה"); }
    catch (e) { setToast("שגיאה בהסרה: " + errText(e)); }
  }

  function closeAdd() { setPick(null); setDragging(false); }

  async function publish(p: { blob: Blob | null; description: string }) {
    if (!pick) return;
    try {
      // שומרים את הכתובת רק אם כבר זוהתה (לא את הטקסט הכללי "המיקום הנוכחי")
      await createItem({ ...p, address: pickAddress, lat: pick[0], lng: pick[1] });
      closeAdd();
      setToast("תודה! הפריט עלה למפה");
    } catch (e) { setToast("שגיאה בפרסום: " + errText(e)); }
  }

  const focusOn = (pos: LatLng) => setFocus((f) => ({ pos, n: (f?.n ?? 0) + 1 }));

  // ברירת המחדל: המיקום הנוכחי. אפשר לשנות בגרירת הסמן או בחיפוש כתובת.
  function startAdd() {
    setSelectedId(null);
    const center: LatLng | null = bounds ? [(bounds.south + bounds.north) / 2, (bounds.west + bounds.east) / 2] : null;
    const start = me ?? center;
    if (!start) return;
    setPick(start);
    setPickSource(me ? "current" : "map");
    setPickAddress(null);
    focusOn(start);
  }

  const onPickMove = useCallback((p: LatLng) => { setPick(p); setPickSource("map"); setPickAddress(null); }, []);

  // מזהים כתובת אמיתית למיקום הנבחר (נוכחי או מהמפה). ממתינים רגע אחרי כל הזזה, ובקשה אחת בכל פעם.
  useEffect(() => {
    if (!pick || pickSource === "search") return;
    const ac = new AbortController();
    let retry: ReturnType<typeof setTimeout> | undefined;
    // כשהמיקום נלקח מה-GPS והדיוק נמוך, מציגים רחוב ועיר בלי מספר בית (המספר יכול להיות של בניין אחר)
    const approximate = pickSource === "current" && (meAccuracyRef.current ?? 0) > 30;
    const lookup = (again: boolean) =>
      reverseGeocode(pick[0], pick[1], ac.signal, { approximate })
        .then((a) => { if (a) setPickAddress(a); })
        .catch(() => { if (again && !ac.signal.aborted) retry = setTimeout(() => lookup(false), 2000); }); // ניסיון חוזר אחד
    const t = setTimeout(() => lookup(true), 500);
    return () => { clearTimeout(t); clearTimeout(retry); ac.abort(); };
  }, [pick, pickSource]);

  // "מיקום נוכחי" ממשיך לעקוב אחרי המיקום העדכני: הקריאה הראשונה של ה-GPS (בעיקר במחשב) לרוב גסה ומשתפרת אחר כך.
  useEffect(() => {
    if (pick && me && pickSource === "current" && distanceMeters(pick, me) > 15) setPick(me);
  }, [me, pick, pickSource]);

  const pickLabel = pickAddress ?? (pickSource === "current" ? CURRENT_LABEL : "מיקום שנבחר במפה");

  async function searchAddress(q: string) {
    const r = await geocode(q, boundsRef.current);
    if (!r) return false;
    setPick([r.lat, r.lng]);
    setPickSource("search");
    setPickAddress(r.label);
    focusOn([r.lat, r.lng]);
    return true;
  }

  function backToCurrentLocation() {
    if (!me) return;
    if (pickSource !== "current") setPickAddress(null); // אם כבר במיקום הנוכחי, שומרים את הכתובת שכבר ידועה
    setPick(me);
    setPickSource("current");
    focusOn(me);
  }

  return (
    <div className="app">
      <Navbar view={view} />
      <div className={`stage${selected || pick ? " has-sheet" : ""}${dragging ? " dragging" : ""}`}>
        {/* הדף מוצג מעל המפה (והמפה נשארת טעונה), כדי שהמיקום והזום לא יאבדו */}
        {view === "about" && <AboutPage />}
        <div className="map-area">
          <MapView
            items={[...items.values()]}
            me={me}
            recenter={recenter}
            pick={pick}
            selectedId={selectedId}
            focus={focus}
            dragMode={dragging}
            onPickMove={onPickMove}
            onSelect={(id) => {
              closeAdd();
              setSelectedId(id);
              const it = items.get(id);
              if (it) focusOn([it.lat, it.lng]);
            }}
            onBounds={onBounds}
          />
          <FloatingMenu
            showAdd={!pick}
            onAdd={startAdd}
            onRecenter={() => (me ? setRecenter((n) => n + 1) : setToast("מחפשים מיקום..."))}
          />
          {dragging && (
            <div className="drag-bar" role="status">
              <span>גוררים את הלב, או מקישים על המפה, למקום המדויק</span>
              <button className="btn small" onClick={() => setDragging(false)}>אישור מיקום</button>
            </div>
          )}
        </div>
        {selected && <ItemSheet item={selected} me={me} onTook={took} onClose={() => setSelectedId(null)} />}
        {pick && (
          <AddSheet
            debugInfo={`pin ${pick[0].toFixed(5)}, ${pick[1].toFixed(5)} | gps ${me ? `${me[0].toFixed(5)}, ${me[1].toFixed(5)}` : "none"} ±${Math.round(meAccuracy ?? 0)}m | source: ${pickSource}`}
            locationLabel={pickLabel}
            isCurrent={pickSource === "current"}
            isMapPick={pickSource === "map"}
            canUseMyLocation={!!me}
            onSubmit={publish}
            onSearch={searchAddress}
            onUseMyLocation={backToCurrentLocation}
            onStartDrag={() => setDragging(true)}
            onClose={closeAdd}
            onError={setToast}
          />
        )}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
