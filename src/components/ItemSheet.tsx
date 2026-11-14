import { useEffect, useState } from "react";
import type { Item } from "../types";
import type { LatLng } from "../hooks";
import { distanceMeters, formatDistance } from "../lib/geo";
import { reverseGeocode } from "../lib/geocode";
import bench from "../assets/bench-generic.svg";

interface Props {
  item: Item;
  me: LatLng | null;
  onTook: (item: Item) => Promise<void>;
  onClose: () => void;
}

/** תמונת הפריט. בלי תמונה (או אם היא לא נטענת): ציור הספסל שלנו, ומתחתיו הודעה. */
function ItemPhoto({ item }: { item: Item }) {
  const [broken, setBroken] = useState(false);
  if (!item.photo_url || broken) {
    return (
      <div className="no-photo">
        <img src={bench} alt="" />
        <span>אין תמונה, תצטרכו ללכת לשם לגלות</span>
      </div>
    );
  }
  return <img className="photo" src={item.photo_url} alt="תמונת הפריט" onError={() => setBroken(true)} />;
}

// כתובות שכבר חיפשנו (לפריטים ישנים ששמורים בלי כתובת), כדי לא לפנות לשירות שוב ושוב
const looked = new Map<string, string | null>();

/** כתובת הפריט: השמורה בפריט, ואם אין (פריט ישן) מחפשים לפי המיקום. */
function useAddress(item: Item) {
  const [found, setFound] = useState<string | null | undefined>(looked.get(item.id));
  useEffect(() => {
    if (item.address || looked.has(item.id)) { setFound(looked.get(item.id)); return; }
    setFound(undefined);
    const ac = new AbortController();
    reverseGeocode(item.lat, item.lng, ac.signal)
      .then((a) => { looked.set(item.id, a); setFound(a); })
      .catch(() => {});
    return () => ac.abort();
  }, [item.id, item.address, item.lat, item.lng]);
  return item.address ?? found ?? null;
}

export default function ItemSheet({ item, me, onTook, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const address = useAddress(item);
  const distance = me ? formatDistance(distanceMeters(me, [item.lat, item.lng])) : null;
  const when = new Date(item.created_at).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="sheet item-sheet">
      {/* סגירה: בשורה משלה, מחוץ לתמונה, כדי שלא ייראה כמחיקה שלה */}
      <div className="sheet-head end">
        <button className="close" onClick={onClose} aria-label="סגירה">✕</button>
      </div>

      <ItemPhoto key={item.id} item={item} />

      <div className="item-info">
        <h2>{item.description || "ללא תיאור"}</h2>
        <p className="meta">פורסם {when}</p>
      </div>

      {/* מיקום: כתובת, פירוט, מרחק, וניווט לשם */}
      <div className="loc-card">
        <span className="label">מיקום</span>
        <p className="address">{address ?? " "}</p>
        {item.location_note && <p className="note-text">{item.location_note}</p>}
        <div className="nav-row">
          <span className="dist">{distance ? `${distance} ממך` : ""}</span>
          <a
            className="btn plain small"
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
