import { useState } from "react";
import type { Item } from "../types";
import type { LatLng } from "../hooks";
import { distanceMeters, formatDistance } from "../lib/geo";
import noPhoto from "../assets/no-photo.svg";

interface Props {
  item: Item;
  me: LatLng | null;
  onTook: (item: Item) => Promise<void>;
  onClose: () => void;
}

export default function ItemSheet({ item, me, onTook, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const distance = me ? formatDistance(distanceMeters(me, [item.lat, item.lng])) : null;
  const when = new Date(item.created_at).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="sheet item-sheet">
      {/* כותרת: שם הפריט ולצדו סגירה. ה-X מחוץ לתמונה, כדי שלא ייראה כמחיקה שלה */}
      <div className="sheet-head">
        <h2>{item.description || "ללא תיאור"}</h2>
        <button className="close" onClick={onClose} aria-label="סגירה">✕</button>
      </div>
      <img
        key={item.id}
        src={item.photo_url ?? noPhoto}
        alt={item.photo_url ? "תמונת הפריט" : "ללא תמונה"}
        onError={(e) => { if (!e.currentTarget.src.endsWith(noPhoto)) e.currentTarget.src = noPhoto; }}
      />
      {item.location_note && <p className="note"><span className="label">פירוט על המיקום</span>{item.location_note}</p>}
      <p className="meta">פורסם {when}</p>

      {/* פעולות: ניווט (עם המרחק, כי הוא שייך לניווט), ומתחתיו "לקחתי", הפעולה המרכזית */}
      <div className="actions">
        <a
          className="btn secondary nav-btn"
          target="_blank"
          rel="noopener noreferrer"
          href={`https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}&travelmode=walking`}
        >
          <span>ניווט</span>
          {distance && <span className="dist">{distance} ממך</span>}
        </a>
        <button
          className="btn took"
          disabled={busy}
          onClick={async () => { setBusy(true); try { await onTook(item); } finally { setBusy(false); } }}
        >
          לקחתי ✔
        </button>
      </div>
    </div>
  );
}
