import { useState } from "react";
import type { Item } from "../types";
import type { LatLng } from "../hooks";
import { distanceMeters, formatDistance } from "../lib/geo";

interface Props {
  item: Item;
  me: LatLng | null;
  onTook: (item: Item) => Promise<void>;
  onClose: () => void;
}

/** תמונת הפריט. בלי תמונה (או אם היא לא נטענת) מציגים הודעה במקום ציור. */
function ItemPhoto({ item }: { item: Item }) {
  const [broken, setBroken] = useState(false);
  if (!item.photo_url || broken) {
    return <div className="no-photo">אין תמונה, תצטרכו ללכת לשם כדי לגלות</div>;
  }
  return <img src={item.photo_url} alt="תמונת הפריט" onError={() => setBroken(true)} />;
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

      <ItemPhoto key={item.id} item={item} />
      <p className="meta">פורסם {when}</p>

      {/* אזור ניווט: פירוט על המיקום, המרחק, וכפתור ניווט לשם */}
      <div className="nav-area">
        <span className="label">ניווט</span>
        {item.location_note && <p className="note-text">{item.location_note}</p>}
        <div className="nav-row">
          <span className="dist">{distance ? `${distance} ממך` : ""}</span>
          <a
            className="btn secondary small"
            target="_blank"
            rel="noopener noreferrer"
            href={`https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}&travelmode=walking`}
          >
            ניווט לשם
          </a>
        </div>
      </div>

      {/* "לקחתי": הפעולה המרכזית, צמודה לתחתית */}
      <div className="actions">
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
