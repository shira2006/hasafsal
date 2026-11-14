import { useCallback, useEffect, useState } from "react";
import MapView from "./components/MapView";
import ItemSheet from "./components/ItemSheet";
import AddSheet from "./components/AddSheet";
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

  // טעינת פריטים לפי האזור שמוצג במפה
  useEffect(() => {
    if (!bounds) return;
    const t = setTimeout(async () => {
      try {
        const list = await fetchItemsInBounds(bounds);
        setItems((prev) => { const m = new Map(prev); list.forEach((i) => m.set(i.id, i)); return m; });
      } catch (e) { setToast("שגיאה בטעינה: " + errText(e)); }
    }, 300);
    return () => clearTimeout(t);
  }, [bounds, setToast]);

  // עדכונים בזמן אמת: פריט שנלקח נעלם מיד אצל כולם
  useEffect(() => subscribeItems(
    (i) => setItems((p) => new Map(p).set(i.id, i)),
    (id) => {
      setItems((p) => { const m = new Map(p); m.delete(id); return m; });
      setSelectedId((cur) => (cur === id ? null : cur));
    }
  ), []);

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
      <header><h1>🪑 הספסל</h1></header>
      <MapView
        items={[...items.values()]}
        me={me}
        recenter={recenter}
        pick={pick}
        onPickMove={setPick}
        onSelect={(id) => { setPick(null); setSelectedId(id); }}
        onBounds={onBounds}
      />
      <button className="fab-locate" onClick={() => (me ? setRecenter((n) => n + 1) : setToast("מחפשים מיקום..."))} aria-label="המיקום שלי">📍</button>
      {!pick && !selected && <button className="fab-add" onClick={startAdd}>＋ פרסום פריט</button>}
      {selected && <ItemSheet item={selected} me={me} onTook={took} onClose={() => setSelectedId(null)} />}
      {pick && <AddSheet onSubmit={publish} onClose={() => setPick(null)} onError={setToast} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
