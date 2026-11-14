import { useEffect, useState } from "react";
import { shrinkImage } from "../lib/image";
import { friendlyError } from "../lib/errors";
import BenchLoader from "./BenchLoader";

interface Props {
  debugInfo?: string; // לפיתוח בלבד: קואורדינטות, דיוק ומקור המיקום
  locationLabel: string;
  resolving: boolean; // מחפשים כתובת למיקום הנבחר
  isCurrent: boolean;
  isMapPick: boolean; // המיקום נבחר על המפה (גרירה או הקשה)
  canUseMyLocation: boolean;
  onSubmit: (p: { blob: Blob | null; description: string }) => Promise<void>;
  onSearch: (query: string) => Promise<boolean>;
  onUseMyLocation: () => void;
  onStartDrag: () => void;
  onClose: () => void;
  onError: (msg: string) => void;
}

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" /><circle cx="12" cy="13" r="3.5" />
  </svg>
);

/**
 * כפתור אחד לכל המכשירים. בטלפון, בלי capture, המערכת עצמה מציגה את הבחירה הרגילה (מצלמה או גלריה).
 * במחשב נפתח חלון בחירת קובץ.
 */
function PhotoButton({ replacing, onFile }: { replacing: boolean; onFile: (f?: File) => void }) {
  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = ""; // כדי שאפשר יהיה לבחור שוב את אותו קובץ
    onFile(f);
  };
  return (
    <label className="btn small secondary">
      <CameraIcon /> {replacing ? "החלפת תמונה" : "הוספת תמונה"}
      <input type="file" accept="image/*" hidden onChange={pick} />
    </label>
  );
}

export default function AddSheet({ debugInfo, locationLabel, resolving, isCurrent, isMapPick, canUseMyLocation, onSubmit, onSearch, onUseMyLocation, onStartDrag, onClose, onError }: Props) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [locText, setLocText] = useState(locationLabel); // שדה המיקום: מציג את המיקום הנבחר, ואפשר להקליד בו כתובת
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // כשהמיקום משתנה (גרירה, חיפוש, חזרה למיקום נוכחי) השדה מציג את המיקום החדש
  useEffect(() => { setLocText(locationLabel); setNotFound(false); }, [locationLabel]);

  // משחררים את כתובת התצוגה המקדימה כשהיא מוחלפת או כשהגיליון נסגר
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  // צריך לפחות תמונה או תיאור: אחד מהם מספיק
  const canPublish = (!!blob || description.trim().length > 0) && !busy;

  async function onFile(f?: File) {
    if (!f) return;
    try {
      const b = await shrinkImage(f);
      setBlob(b);
      setPreview(URL.createObjectURL(b));
    } catch (e) {
      onError(friendlyError(e, "לא הצלחנו לטעון את התמונה. נסו תמונה אחרת"));
    }
  }

  function removePhoto() { setBlob(null); setPreview(null); }

  async function publish() {
    setBusy(true);
    try { await onSubmit({ blob, description: description.trim() }); }
    finally { setBusy(false); }
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const q = locText.trim();
    if (!q || q === locationLabel || searching) return;
    setSearching(true);
    setNotFound(false);
    try {
      const ok = await onSearch(q);
      setNotFound(!ok);
    } catch (err) {
      onError(friendlyError(err, "החיפוש לא הצליח. נסו שוב"));
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="sheet">
      <div className="sheet-head">
        <h2>הוספת מיקום לספסל</h2>
        <div className="head-actions">
          <button className="btn small" disabled={!canPublish} onClick={publish}>
            {busy ? <><BenchLoader size={16} label="מעלים" /> מעלים...</> : "פרסום"}
          </button>
          <button className="close" onClick={onClose} aria-label="סגירה">✕</button>
        </div>
      </div>

      {/* תמונה: בלי תמונה רואים רק כפתור הוספה */}
      <div className="field">
        <span className="label">תמונה</span>
        {preview && <img className="preview" src={preview} alt="תצוגה מקדימה" />}
        <div className="row photo-actions">
          <PhotoButton replacing={!!preview} onFile={onFile} />
          {preview && <button type="button" className="btn small" onClick={removePhoto}>הסרה</button>}
        </div>
      </div>

      {/* תיאור: פסקה אחת, גם על הפריטים וגם על המיקום (איפה בדיוק) */}
      <div className="field">
        <label className="label" htmlFor="desc">תיאור</label>
        <textarea
          id="desc"
          rows={3}
          maxLength={500}
          placeholder="תארו את הפריטים. ואם יש מה לספר על המיקום, כתבו איפה בדיוק, כדי לעזור לאחרים למצוא"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* מיקום: למטה. ברירת המחדל היא המיקום הנוכחי. שדה אחד שאפשר להקליד בו כתובת, עם אייקוני מרכוז ומפה */}
      <div className="field">
        <label className="label" htmlFor="addr">מיקום</label>
        <form className="loc-field" onSubmit={search}>
          <input
            id="addr"
            type="search"
            enterKeyHint="search"
            placeholder="הקלידו כתובת"
            value={locText}
            onChange={(e) => { setLocText(e.target.value); setNotFound(false); }}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={() => { if (!searching) setLocText(locationLabel); }}
          />
          {(resolving || searching) && <span className="resolving"><BenchLoader size={20} label="מחפשים כתובת" /></span>}
          <div className="loc-icons">
            <button type="button" className={`icon-btn${isCurrent ? " on" : ""}`} disabled={!canUseMyLocation} onClick={onUseMyLocation} aria-label="מיקום נוכחי" title="מיקום נוכחי">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="6.5" /><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
            </button>
            <button type="button" className={`icon-btn${isMapPick ? " on" : ""}`} onClick={onStartDrag} aria-label="בחירה על המפה" title="בחירה על המפה">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z" /><path d="M9 4v13.5M15 6.5V20" />
              </svg>
            </button>
          </div>
        </form>
        {import.meta.env.DEV && debugInfo && <p className="hint" dir="ltr">dev: {debugInfo}</p>}
        {notFound && <p className="hint err">לא מצאנו את הכתובת. אפשר לנסח אחרת, או לבחור על המפה.</p>}
      </div>
    </div>
  );
}
