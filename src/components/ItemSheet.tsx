import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Item } from "../types";
import type { LatLng } from "../hooks";
import { distanceMeters, formatDistance } from "../lib/geo";
import { reverseGeocode } from "../lib/geocode";
import bench from "../assets/bench-generic.svg";
import BenchLoader from "./BenchLoader";
import PhotoModal from "./PhotoModal";

interface Props {
  item: Item;
  me: LatLng | null;
  onTook: (item: Item) => Promise<void>;
  onMissing: (item: Item) => Promise<void>; // "זה לא כאן": הפריט כבר לא במקום
  onClose: () => void;
}

/** תמונת הפריט. הקשה עליה פותחת אותה בגדול. בלי תמונה (או אם היא לא נטענת): ציור הספסל שלנו והודעה. */
function ItemPhoto({ item }: { item: Item }) {
  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  if (!item.photo_url || broken) {
    return (
      <div className="no-photo">
        <img src={bench} alt="" />
        <span>אין תמונה, תצטרכו ללכת לשם לגלות</span>
      </div>
    );
  }
  return (
    <>
      <button type="button" className={`photo-wrap${loaded ? " loaded" : ""}`} onClick={() => setOpen(true)} aria-label="הגדלת התמונה" disabled={!loaded}>
        {!loaded && <BenchLoader size={36} label="טוענים תמונה" />}
        <img className="photo" src={item.photo_url} alt="תמונת הפריט" onLoad={() => setLoaded(true)} onError={() => setBroken(true)} />
      </button>
      {open && <PhotoModal src={item.photo_url} alt="תמונת הפריט" onClose={() => setOpen(false)} />}
    </>
  );
}

/** תיאור: מקוצר לכמה שורות עם "קראו עוד", כדי שהגיליון לא יצטרך לגלול. */
function Description({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && !expanded) setClamped(el.scrollHeight > el.clientHeight + 1);
  }, [text, expanded]);
  return (
    <>
      <p ref={ref} className={`description${expanded ? "" : " clamp"}`}>{text}</p>
      {(clamped || expanded) && (
        <button type="button" className="link-btn" onClick={() => setExpanded((e) => !e)}>
          {expanded ? "הצגת פחות" : "קראו עוד"}
        </button>
      )}
    </>
  );
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
  const address = item.address ?? found ?? null;
  return { address, loading: !address && found === undefined };
}

/** פרצוף עצוב מצויר (SVG, בצבעי האתר), במקום אימוג'י */
function SadFace() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9.6v.4M15 9.6v.4" strokeWidth="2.6" />
      <path d="M8.6 16.2c1-1.5 2.1-2.2 3.4-2.2s2.4.7 3.4 2.2" />
    </svg>
  );
}

export default function ItemSheet({ item, me, onTook, onMissing, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  async function run(action: (item: Item) => Promise<void>) {
    setBusy(true);
    try { await action(item); } finally { setBusy(false); }
  }
  const { address, loading: addressLoading } = useAddress(item);
  const distance = me ? formatDistance(distanceMeters(me, [item.lat, item.lng])) : null;
  const when = new Date(item.created_at).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });
  // בפריטים ישנים שנשמרה בהם הערת מיקום נפרדת, היא מוצגת כהמשך התיאור
  const text = [item.description, item.location_note].filter(Boolean).join("\n") || "ללא תיאור";

  return (
    <div className="sheet item-sheet">
      {/* שורה עליונה: בצד ימין התקציר (מתי פורסם, וכמה זה רחוק ממני), ובצד שמאל סגירה. ה-X מחוץ לתמונה, כדי שלא ייראה כמחיקה שלה */}
      <div className="sheet-head">
        <div className="summary">
          <span className="posted">פורסם {when}</span>
          {distance && <span className="posted">{distance} ממך</span>}
        </div>
        <button className="close" onClick={onClose} aria-label="סגירה">✕</button>
      </div>

      <ItemPhoto key={item.id} item={item} />

      <div className="field">
        <span className="label">תיאור</span>
        <div className="card"><Description key={item.id} text={text} /></div>
      </div>

      {/* מיקום: הכתובת וכפתור הניווט באותה שורה */}
      <div className="field">
        <span className="label">מיקום</span>
        <div className="card loc-card">
          <p className="address">{address ?? (addressLoading ? <BenchLoader size={22} label="מחפשים כתובת" /> : "הכתובת לא זמינה")}</p>
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

      {/* "לקחתי": הפעולה המרכזית. לצדה "זה לא כאן" (הפריט כבר לא שם). צמודות לתחתית */}
      <div className="actions">
        <button className="btn took" disabled={busy} onClick={() => run(onTook)}>
          לקחתי ✔
        </button>
        <button className="btn missing" disabled={busy} onClick={() => run(onMissing)}>
          <SadFace /> זה לא כאן
        </button>
      </div>
    </div>
  );
}
