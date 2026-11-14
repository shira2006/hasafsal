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

export default function ItemSheet({ item, me, onTook, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const d = me ? ` · ${formatDistance(distanceMeters(me, [item.lat, item.lng]))} ממך` : "";
  const when = new Date(item.created_at).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="sheet">
      <button className="close" onClick={onClose} aria-label="סגירה">✕</button>
      <img src={item.photo_url} alt="תמונת הפריט" />
      <p>{item.description || "ללא תיאור"}</p>
      <p className="meta">פורסם {when}{d}</p>
      <div className="row">
        <a
          className="btn secondary"
          target="_blank"
          rel="noopener noreferrer"
          href={`https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}&travelmode=walking`}
        >
          ניווט
        </a>
        <button
          className="btn primary"
          disabled={busy}
          onClick={async () => { setBusy(true); try { await onTook(item); } finally { setBusy(false); } }}
        >
          לקחתי ✔
        </button>
      </div>
    </div>
  );
}
