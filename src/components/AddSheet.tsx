import { useEffect, useState } from "react";
import { shrinkImage } from "../lib/image";

interface Props {
  locationLabel: string;
  isCurrent: boolean;
  canUseMyLocation: boolean;
  onSubmit: (p: { blob: Blob | null; description: string; locationNote: string }) => Promise<void>;
  onSearch: (query: string) => Promise<boolean>;
  onUseMyLocation: () => void;
  onStartDrag: () => void;
  onClose: () => void;
  onError: (msg: string) => void;
}

export default function AddSheet({ locationLabel, isCurrent, canUseMyLocation, onSubmit, onSearch, onUseMyLocation, onStartDrag, onClose, onError }: Props) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [locationNote, setLocationNote] = useState("");
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
      onError(e instanceof Error ? e.message : "שגיאה בתמונה");
    }
  }

  function removePhoto() { setBlob(null); setPreview(null); }

  async function publish() {
    setBusy(true);
    try { await onSubmit({ blob, description: description.trim(), locationNote: locationNote.trim() }); }
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
      onError(err instanceof Error ? err.message : "חיפוש כתובת נכשל");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="sheet">
      <div className="sheet-head">
        <h2>מצאת ספסל?</h2>
        <div className="head-actions">
          <button className="btn small" disabled={!canPublish} onClick={publish}>{busy ? "מעלים..." : "פרסום"}</button>
          <button className="close" onClick={onClose} aria-label="סגירה">✕</button>
        </div>
      </div>

      {/* מיקום: שדה אחד שאפשר להקליד בו כתובת, כפתור חזרה למיקום נוכחי, וגרירה על המפה */}
      <div className="field">
        <label className="label" htmlFor="addr">מיקום</label>
        <div className="loc-row">
          <form className="loc-field" onSubmit={search}>
            {isCurrent && (
              <span className="lead" title="מיקום נוכחי" role="img" aria-label="מיקום נוכחי">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="6.5" /><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                </svg>
              </span>
            )}
            <input
              id="addr"
              className={isCurrent ? "has-lead" : undefined}
              type="search"
              enterKeyHint="search"
              placeholder="הקלידו כתובת"
              value={locText}
              onChange={(e) => { setLocText(e.target.value); setNotFound(false); }}
              onFocus={(e) => e.currentTarget.select()}
              onBlur={() => { if (!searching) setLocText(locationLabel); }}
            />
            {canUseMyLocation && !isCurrent && (
              <button type="button" className="icon-btn" onClick={onUseMyLocation} aria-label="מיקום נוכחי" title="מיקום נוכחי">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="6.5" /><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                </svg>
              </button>
            )}
          </form>
          <button type="button" className="btn small secondary nowrap" onClick={onStartDrag}>גרירה על המפה</button>
        </div>
        {notFound && <p className="hint err">לא מצאנו את הכתובת. אפשר לנסח אחרת, או לגרור על המפה.</p>}
      </div>

      <div className="field">
        <label className="label" htmlFor="note">פירוט על המיקום</label>
        <textarea id="note" rows={2} maxLength={300} placeholder="ליד הגינה. מאוד יעזור למי שצריך למצוא" value={locationNote} onChange={(e) => setLocationNote(e.target.value)} />
      </div>

      {/* תמונה: בלי תמונה רואים רק כפתור הוספה */}
      <div className="field">
        <span className="label">תמונה <span className="req">*</span></span>
        {preview ? (
          <>
            <img className="preview" src={preview} alt="תצוגה מקדימה" />
            <div className="row">
              <label className="btn small secondary">
                החלפה
                <input type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
              </label>
              <button type="button" className="btn small" onClick={removePhoto}>הסרה</button>
            </div>
          </>
        ) : (
          <label className="btn small secondary add-photo">
            הוספת תמונה
            <input type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        )}
      </div>

      <div className="field">
        <label className="label" htmlFor="desc">תיאור הפריט <span className="req">*</span></label>
        <textarea id="desc" rows={2} placeholder="למשל: כיסא עץ במצב טוב" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
    </div>
  );
}
