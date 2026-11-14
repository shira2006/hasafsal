import { useCallback, useEffect, useRef, useState } from "react";
import MapView from "./components/MapView";
import ItemSheet from "./components/ItemSheet";
import AddSheet from "./components/AddSheet";
import Navbar from "./components/Navbar";
import FloatingMenu from "./components/FloatingMenu";
import { useGeolocation, useToast, type LatLng } from "./hooks";
import { createItem, fetchItemsInBounds, removeItem, subscribeItems } from "./lib/items";
import type { Bounds, Item } from "./types";

const errText = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? String(e));

export default function App() {
  const [toast, setToast] = useToast();
  const me = useGeolocation(() => setToast("אין גישה למיקום. אשרו מיקום בדפדפן"));
  const [items, setItems] = useState<Map<string, Item>>(new Map());
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pick, setPick] = useState<LatLng | null>(null);
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

  async function publish(p: { blob: Blob; description: string }) {
    if (!pick) return;
    try {
      await createItem({ ...p, lat: pick[0], lng: pick[1] });
      setPick(null);
      setToast("הפריט פורסם!");
    } catch (e) { setToast("שגיאה בפרסום: " + errText(e)); }
  }

  function startAdd() {
    setSelectedId(null);
    setPick(me ?? (bounds ? [(bounds.south + bounds.north) / 2, (bounds.west + bounds.east) / 2] : null));
  }

  return (
    <div className="app">
      <Navbar />
      <div className={`stage${selected || pick ? " has-sheet" : ""}`}>
        <div className="map-area">
          <MapView
            items={[...items.values()]}
            me={me}
            recenter={recenter}
            pick={pick}
            selectedId={selectedId}
            onPickMove={setPick}
            onSelect={(id) => { setPick(null); setSelectedId(id); }}
            onBounds={onBounds}
          />
          <FloatingMenu
            showAdd={!pick}
            onAdd={startAdd}
            onRecenter={() => (me ? setRecenter((n) => n + 1) : setToast("מחפשים מיקום..."))}
          />
        </div>
        {selected && <ItemSheet item={selected} me={me} onTook={took} onClose={() => setSelectedId(null)} />}
        {pick && <AddSheet onSubmit={publish} onClose={() => setPick(null)} onError={setToast} />}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
