import { useCallback, useEffect, useRef, useState } from "react";
import MapView, { type Focus } from "./components/MapView";
import ItemSheet from "./components/ItemSheet";
import AddSheet from "./components/AddSheet";
import Navbar from "./components/Navbar";
import FloatingMenu from "./components/FloatingMenu";
import AboutPage from "./components/AboutPage";
import { useToasts } from "./components/Toasts";
import { friendlyError } from "./lib/errors";
import BenchLoader from "./components/BenchLoader";
import ErrorCard from "./components/ErrorCard";
import { useDelayedFlag, useGeolocation, useView, type LatLng } from "./hooks";
import { createItem, fetchItemsInBounds, removeItem, subscribeItems } from "./lib/items";
import { geocode, reverseGeocode } from "./lib/geocode";
import { distanceMeters } from "./lib/geo";
import type { Bounds, Item } from "./types";

const CURRENT_LABEL = "המיקום הנוכחי";

export default function App() {
  const toast = useToasts();
  const view = useView();
  const { pos: me, accuracy: meAccuracy } = useGeolocation(() => toast.info("אין גישה למיקום. אשרו מיקום בדפדפן"));
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
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadError, setLoadError] = useState(false); // לא הצלחנו לטעון את הספסלים
  const [lookingUp, setLookingUp] = useState(false); // מחפשים כתובת למיקום הנבחר
  const showLoading = useDelayedFlag(loadingItems, 400);
  const boundsRef = useRef<Bounds | null>(null);
  boundsRef.current = bounds;
  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;
  const tookByMe = useRef(new Set<string>()); // פריטים שאנחנו עצמנו לקחנו (לא להציג הודעה על המחיקה שלהם)

  // טעינת פריטים לפי האזור שמוצג במפה. הטעינה מחליפה את הרשימה, כך שפריטים שנלקחו בזמן שהאפליקציה
  // הייתה ברקע נעלמים, ופריטים רחוקים לא נשארים בזיכרון.
  useEffect(() => {
    if (!bounds) return;
    let cancelled = false; // תשובה ישנה לא דורסת תשובה חדשה יותר
    const t = setTimeout(async () => {
      setLoadingItems(true);
      try {
        const list = await fetchItemsInBounds(bounds);
        if (cancelled) return;
        setItems(new Map(list.map((i) => [i.id, i])));
        setLoadError(false);
        setLoadingItems(false);
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setLoadError(true);
        setLoadingItems(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [bounds, refreshKey]);

  // מתריעים כשהחיבור נופל, ובחזרתו טוענים מחדש
  useEffect(() => {
    const off = () => toast.error("אין חיבור לאינטרנט");
    const on = () => { toast.success("החיבור חזר"); setRefreshKey((k) => k + 1); };
    window.addEventListener("offline", off);
    window.addEventListener("online", on);
    return () => { window.removeEventListener("offline", off); window.removeEventListener("online", on); };
  }, [toast]);

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
          // אם מישהו אחר לקח את הפריט שאנחנו מסתכלים עליו, מסבירים למה הוא נעלם
          if (selectedIdRef.current === id && !tookByMe.current.has(id)) toast.info("ממש מצטערים, כנראה שזה נפל לנו בין הכסאות");
          tookByMe.current.delete(id);
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

  // "לקחתי" ו"זה לא כאן": בשני המקרים הפריט יורד מהמפה אצל כולם. ההודעה שונה.
  const took = (item: Item) => leave(item, "תתחדש/י!", "success");
  const missing = (item: Item) => leave(item, "ממש מצטערים שלא מצאתם. הסרנו אותו מהמפה", "info");

  async function leave(item: Item, successMessage: string, kind: "success" | "info") {
    tookByMe.current.add(item.id); // כדי שהעדכון בזמן אמת על המחיקה שלנו לא יציג הודעה נוספת
    try {
      const removed = await removeItem(item);
      setSelectedId(null);
      if (removed) toast[kind](successMessage);
      else toast.info("ממש מצטערים, כנראה שזה נפל לנו בין הכסאות");
    } catch (e) {
      tookByMe.current.delete(item.id);
      toast.error(friendlyError(e, "לא הצלחנו להסיר את הפריט. נסו שוב"));
    }
  }

  function closeAdd() { setPick(null); setDragging(false); }

  async function publish(p: { blob: Blob | null; description: string }) {
    if (!pick) return;
    try {
      // שומרים את הכתובת רק אם כבר זוהתה (לא את הטקסט הכללי "המיקום הנוכחי")
      await createItem({ ...p, address: pickAddress, lat: pick[0], lng: pick[1] });
      closeAdd();
      toast.success("מלכ/ה כבר נדאג למצוא לפריט בית חדש");
    } catch (e) { toast.error(friendlyError(e, "לא הצלחנו לפרסם את הפריט. נסו שוב")); }
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
    if (!pick || pickSource === "search") { setLookingUp(false); return; }
    const ac = new AbortController();
    let retry: ReturnType<typeof setTimeout> | undefined;
    setLookingUp(true);
    // כשהמיקום נלקח מה-GPS והדיוק נמוך, מציגים רחוב ועיר בלי מספר בית (המספר יכול להיות של בניין אחר)
    const approximate = pickSource === "current" && (meAccuracyRef.current ?? 0) > 30;
    const lookup = (again: boolean) =>
      reverseGeocode(pick[0], pick[1], ac.signal, { approximate })
        .then((a) => { if (a) setPickAddress(a); setLookingUp(false); })
        .catch(() => {
          if (ac.signal.aborted) return;
          if (again) retry = setTimeout(() => lookup(false), 2000); // ניסיון חוזר אחד
          else setLookingUp(false);
        });
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
            onRecenter={() => (me ? setRecenter((n) => n + 1) : toast.info("מחפשים מיקום..."))}
          />
          {/* טעינת ספסלים: מציין קטן (רק אם הטעינה מתארכת), ואם נכשלה: כרטיס שגיאה עם ניסיון חוזר */}
          {showLoading && !loadError && (
            <div className="map-status"><BenchLoader size={26} label="טוענים ספסלים..." showLabel /></div>
          )}
          {loadError && (
            <ErrorCard
              title="לא הצלחנו לטעון את הספסלים"
              text="בדקו את החיבור ונסו שוב"
              onRetry={() => { setLoadError(false); setRefreshKey((k) => k + 1); }}
            />
          )}
          {dragging && (
            <div className="drag-bar" role="status">
              <span>גוררים את הלב, או מקישים על המפה, למקום המדויק</span>
              <button className="btn small" onClick={() => setDragging(false)}>אישור מיקום</button>
            </div>
          )}
        </div>
        {selected && <ItemSheet item={selected} me={me} onTook={took} onMissing={missing} onClose={() => setSelectedId(null)} />}
        {pick && (
          <AddSheet
            debugInfo={`pin ${pick[0].toFixed(5)}, ${pick[1].toFixed(5)} | gps ${me ? `${me[0].toFixed(5)}, ${me[1].toFixed(5)}` : "none"} ±${Math.round(meAccuracy ?? 0)}m | source: ${pickSource}`}
            locationLabel={pickLabel}
            resolving={lookingUp && pickAddress === null}
            isCurrent={pickSource === "current"}
            isMapPick={pickSource === "map"}
            canUseMyLocation={!!me}
            onSubmit={publish}
            onSearch={searchAddress}
            onUseMyLocation={backToCurrentLocation}
            onStartDrag={() => setDragging(true)}
            onClose={closeAdd}
            onError={(msg) => toast.error(msg)}
          />
        )}
      </div>
    </div>
  );
}
