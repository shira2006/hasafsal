import { useCallback, useEffect, useRef, useState } from "react";
import MapView, { type Focus } from "./components/MapView";
import ItemSheet from "./components/ItemSheet";
import AddSheet from "./components/AddSheet";
import Navbar from "./components/Navbar";
import FloatingMenu from "./components/FloatingMenu";
import AboutPage from "./components/AboutPage";
import { useGeolocation, useToast, useView, type LatLng } from "./hooks";
import { createItem, fetchItemsInBounds, removeItem, subscribeItems } from "./lib/items";
import { geocode } from "./lib/geocode";
import type { Bounds, Item } from "./types";

const errText = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? String(e));

export default function App() {
  const [toast, setToast] = useToast();
  const view = useView();
  const me = useGeolocation(() => setToast("אין גישה למיקום. אשרו מיקום בדפדפן"));
  const [items, setItems] = useState<Map<string, Item>>(new Map());
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pick, setPick] = useState<LatLng | null>(null);
  const [pickLabel, setPickLabel] = useState("");
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
    try { await removeItem(item); setSelectedId(null); setToast("תודה! הפריט הוסר מהמפה"); }
    catch (e) { setToast("שגיאה בהסרה: " + errText(e)); }
  }

  async function publish(p: { blob: Blob | null; description: string }) {
    if (!pick) return;
    try {
      await createItem({ ...p, lat: pick[0], lng: pick[1] });
      setPick(null);
      setToast("הפריט פורסם!");
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
    setPickLabel(me ? "המיקום הנוכחי שלי" : "מרכז המפה");
    focusOn(start);
  }

  const onPickMove = useCallback((p: LatLng) => { setPick(p); setPickLabel("מיקום שנבחר במפה"); }, []);

  async function searchAddress(q: string) {
    const r = await geocode(q, boundsRef.current);
    if (!r) return false;
    setPick([r.lat, r.lng]);
    setPickLabel(r.label);
    focusOn([r.lat, r.lng]);
    return true;
  }

  function useMyLocation() {
    if (!me) return;
    setPick(me);
    setPickLabel("המיקום הנוכחי שלי");
    focusOn(me);
  }

  return (
    <div className="app">
      <Navbar view={view} />
      <div className={`stage${selected || pick ? " has-sheet" : ""}`}>
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
            onPickMove={onPickMove}
            onSelect={(id) => {
              setPick(null);
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
        </div>
        {selected && <ItemSheet item={selected} me={me} onTook={took} onClose={() => setSelectedId(null)} />}
        {pick && (
          <AddSheet
            locationLabel={pickLabel}
            canUseMyLocation={!!me}
            onSubmit={publish}
            onSearch={searchAddress}
            onUseMyLocation={useMyLocation}
            onClose={() => setPick(null)}
            onError={setToast}
          />
        )}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
