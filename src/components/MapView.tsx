import { useCallback, useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { Bounds, Item } from "../types";
import type { LatLng } from "../hooks";

const DEFAULT_CENTER: LatLng = [32.0853, 34.7818]; // תל אביב, עד שנמצא מיקום

// סמן הפריט: לב ורוד (קהילה ונתינה), בלי עיגול ובלי מסגרת שחורה. הקצה התחתון של הלב מצביע על המיקום.
// הגודל מתאים את עצמו לרמת הזום (משתנה CSS --pin-scale), כדי שהלבבות לא יציפו את המפה כשמרחיקים.
const HEART = '<svg viewBox="0 0 32 30" width="34" height="32" aria-hidden="true"><path d="M16 28.5C6 20.5 2 14.5 2 9.2 2 4.8 5.4 2 9.4 2c3 0 5.5 1.7 6.6 4.5C17.1 3.7 19.6 2 22.6 2 26.6 2 30 4.8 30 9.2c0 5.3-4 11.3-14 19.3Z"/></svg>';
const heartIcon = (cls: string) => L.divIcon({ className: "", html: `<div class="pin ${cls}">${HEART}</div>`, iconSize: [34, 32], iconAnchor: [17, 30] });
const pinIcon = heartIcon("");
const pinIconSelected = heartIcon("sel");
const pinIconPick = heartIcon("sel pick");
const meIcon = L.divIcon({ className: "", html: '<div class="me"></div>', iconSize: [16, 16], iconAnchor: [8, 8] });

function Events({ onBounds, appMove }: { onBounds: (b: Bounds, byApp: boolean) => void; appMove: React.MutableRefObject<boolean> }) {
  const map = useMap();
  const emit = () => {
    const b = map.getBounds();
    const byApp = appMove.current; // האם האפליקציה עצמה הזיזה את המפה (ולא המשתמש בגרירה/זום)
    appMove.current = false;
    onBounds({ south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() }, byApp);
  };
  useMapEvents({ moveend: emit });
  useEffect(emit, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** מעדכן את גודל הלבבות לפי רמת הזום: 1 בזום 17, קטן יותר כשמרחיקים, מעט גדול יותר כשמקרבים. */
function PinScale() {
  const map = useMap();
  const apply = () => {
    const s = Math.min(1.15, Math.max(0.4, 1 - (17 - map.getZoom()) * 0.15));
    map.getContainer().style.setProperty("--pin-scale", String(s));
  };
  useMapEvents({ zoom: apply });
  useEffect(apply, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** במצב גרירה אפשר גם להקיש על המפה כדי להניח את הלב במקום. */
function TapToPlace({ active, onPlace }: { active: boolean; onPlace: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => { if (active) onPlace([e.latlng.lat, e.latlng.lng]); } });
  return null;
}

/** כשגודל המפה משתנה (למשל פאנל הפרטים נפתח לצדה בדסקטופ) מעדכנים את Leaflet. */
function ResizeWatcher({ markAppMove }: { markAppMove: () => void }) {
  const map = useMap();
  useEffect(() => {
    const ro = new ResizeObserver(() => { markAppMove(); map.invalidateSize(); });
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map, markAppMove]);
  return null;
}

export interface Focus { pos: LatLng; n: number }

/**
 * מזיז את המפה כך שנקודה מסוימת תהיה גלויה: פריט שנבחר, תוצאת חיפוש או סמן פרסום חדש.
 * במובייל הגיליון התחתון מכסה את החלק התחתון, ולכן הנקודה מוצבת מעל מרכז המפה.
 */
function FocusOn({ focus, markAppMove }: { focus: Focus | null; markAppMove: () => void }) {
  const map = useMap();
  useEffect(() => {
    if (!focus) return;
    const zoom = Math.max(map.getZoom(), 16);
    const mobile = window.matchMedia("(max-width: 899px)").matches;
    const shift = mobile ? map.getSize().y * 0.2 : 0;
    const target = map.unproject(map.project(focus.pos, zoom).add([0, shift]), zoom);
    markAppMove();
    map.setView(target, zoom);
  }, [focus?.n]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** ממרכז את המפה פעם אחת כשהמיקום הראשון מתקבל, ובכל לחיצה על כפתור המיקום. */
function Recenter({ me, trigger, markAppMove, skipFirst }: { me: LatLng | null; trigger: number; markAppMove: () => void; skipFirst: boolean }) {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    // כשנכנסו מקישור לספסל, המפה כבר ממורכזת עליו: לא מזיזים אותה למיקום שלנו
    if (me && first.current) { first.current = false; if (!skipFirst) { markAppMove(); map.setView(me, 17); } }
  }, [me, map]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (trigger && me) { markAppMove(); map.setView(me, 17); }
  }, [trigger]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

interface Props {
  items: Item[];
  me: LatLng | null;
  recenter: number;
  pick: LatLng | null;
  selectedId: string | null;
  focus: Focus | null;
  dragMode: boolean;
  /** נכנסו מקישור לספסל: לא למרכז למיקום הראשון שמתקבל */
  skipFirstCenter?: boolean;
  onPickMove: (p: LatLng) => void;
  onSelect: (id: string) => void;
  /** byApp = true כשהאפליקציה עצמה הזיזה את המפה (לחיצה על לב, מרכוז, שינוי גודל), ולא המשתמש */
  onBounds: (b: Bounds, byApp: boolean) => void;
}

export default function MapView({ items, me, recenter, pick, selectedId, focus, dragMode, skipFirstCenter = false, onPickMove, onSelect, onBounds }: Props) {
  const pickHandlers = useMemo(
    () => ({ dragend: (e: L.LeafletEvent) => { const l = (e.target as L.Marker).getLatLng(); onPickMove([l.lat, l.lng]); } }),
    [onPickMove]
  );
  // מסמנים תזוזה שהאפליקציה יזמה, כדי שהאירוע moveend שיבוא אחריה יידע שזו לא גרירה או זום של המשתמש.
  // (אם בסוף לא הייתה תזוזה, הסימון נמחק לבד אחרי שנייה.)
  const appMove = useRef(false);
  const appMoveTimer = useRef<ReturnType<typeof setTimeout>>();
  const markAppMove = useCallback(() => {
    appMove.current = true;
    clearTimeout(appMoveTimer.current);
    appMoveTimer.current = setTimeout(() => { appMove.current = false; }, 1000);
  }, []);
  return (
    <MapContainer center={DEFAULT_CENTER} zoom={16} zoomControl={false} className="map">
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} attribution="© OpenStreetMap" />
      <Events onBounds={onBounds} appMove={appMove} />
      <ResizeWatcher markAppMove={markAppMove} />
      <PinScale />
      <TapToPlace active={dragMode && !!pick} onPlace={onPickMove} />
      <FocusOn focus={focus} markAppMove={markAppMove} />
      <Recenter me={me} trigger={recenter} markAppMove={markAppMove} skipFirst={skipFirstCenter} />
      {me && <Marker position={me} icon={meIcon} interactive={false} />}
      {items.map((it) => (
        <Marker key={it.id} position={[it.lat, it.lng]} icon={it.id === selectedId ? pinIconSelected : pinIcon} eventHandlers={{ click: () => onSelect(it.id) }} />
      ))}
      {pick && <Marker position={pick} icon={pinIconPick} draggable={dragMode} eventHandlers={pickHandlers} zIndexOffset={1000} />}
    </MapContainer>
  );
}
