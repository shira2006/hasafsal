import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { Bounds, Item } from "../types";
import type { LatLng } from "../hooks";

const DEFAULT_CENTER: LatLng = [32.0853, 34.7818]; // תל אביב, עד שנמצא מיקום

const pinIcon = L.divIcon({ className: "", html: '<div class="pin">🪑</div>', iconSize: [34, 34], iconAnchor: [17, 17] });
const pinIconSelected = L.divIcon({ className: "", html: '<div class="pin sel">🪑</div>', iconSize: [34, 34], iconAnchor: [17, 17] });
const meIcon = L.divIcon({ className: "", html: '<div class="me"></div>', iconSize: [16, 16], iconAnchor: [8, 8] });

function Events({ onBounds }: { onBounds: (b: Bounds) => void }) {
  const map = useMap();
  const emit = () => {
    const b = map.getBounds();
    onBounds({ south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() });
  };
  useMapEvents({ moveend: emit });
  useEffect(emit, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** כשגודל המפה משתנה (למשל פאנל הפרטים נפתח לצדה בדסקטופ) מעדכנים את Leaflet. */
function ResizeWatcher() {
  const map = useMap();
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
}

/** ממרכז את המפה פעם אחת כשהמיקום הראשון מתקבל, ובכל לחיצה על כפתור המיקום. */
function Recenter({ me, trigger }: { me: LatLng | null; trigger: number }) {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    if (me && first.current) { first.current = false; map.setView(me, 17); }
  }, [me, map]);
  useEffect(() => {
    if (trigger && me) map.setView(me, 17);
  }, [trigger]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

interface Props {
  items: Item[];
  me: LatLng | null;
  recenter: number;
  pick: LatLng | null;
  selectedId: string | null;
  onPickMove: (p: LatLng) => void;
  onSelect: (id: string) => void;
  onBounds: (b: Bounds) => void;
}

export default function MapView({ items, me, recenter, pick, selectedId, onPickMove, onSelect, onBounds }: Props) {
  const pickHandlers = useMemo(
    () => ({ dragend: (e: L.LeafletEvent) => { const l = (e.target as L.Marker).getLatLng(); onPickMove([l.lat, l.lng]); } }),
    [onPickMove]
  );
  return (
    <MapContainer center={DEFAULT_CENTER} zoom={16} zoomControl={false} className="map">
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} attribution="© OpenStreetMap" />
      <Events onBounds={onBounds} />
      <ResizeWatcher />
      <Recenter me={me} trigger={recenter} />
      {me && <Marker position={me} icon={meIcon} interactive={false} />}
      {items.map((it) => (
        <Marker key={it.id} position={[it.lat, it.lng]} icon={it.id === selectedId ? pinIconSelected : pinIcon} eventHandlers={{ click: () => onSelect(it.id) }} />
      ))}
      {pick && <Marker position={pick} icon={pinIcon} draggable eventHandlers={pickHandlers} zIndexOffset={1000} />}
    </MapContainer>
  );
}
