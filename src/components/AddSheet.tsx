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
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

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
    const q = query.trim();
    if (!q || searching) return;
    setSearching(true);
    setNotFound(false);
    try {
      const ok = await onSearch(q);
      setNotFound(!ok);
      if (ok) setQuery("");
    } catch (err) {
      onError(err instanceof Error ? err.message : "חיפוש כתובת נכשל");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="sheet">
      <div className="sheet-head">
        <h2>משהו לשכנים?</h2>
        <div className="head-actions">
          <button className="btn small" disabled={!canPublish} onClick={publish}>{busy ? "מעלים..." : "פרסום"}</button>
          <button className="close" onClick={onClose} aria-label="סגירה">✕</button>
        </div>
      </div>

      {/* מיקום: למעלה. ברירת המחדל היא המיקום הנוכחי. */}
      <div className="field">
        <span className="label">מיקום</span>
        <div className="loc-row">
          <p className="loc-now">
            <strong>{locationLabel}</strong>
            {canUseMyLocation && !isCurrent && <button type="button" className="link" onClick={onUseMyLocation}>מיקום נוכחי</button>}
          </p>
          <button type="button" className="btn small secondary" onClick={onStartDrag}>גרירה על המפה</button>
        </div>
        <form className="loc-search" onSubmit={search}>
          <input id="addr" type="search" aria-label="חיפוש כתובת" placeholder="חיפוש כתובת" value={query} onChange={(e) => { setQuery(e.target.value); setNotFound(false); }} />
          <button className="btn small secondary" type="submit" disabled={!query.trim() || searching}>{searching ? "מחפשים..." : "חיפוש"}</button>
        </form>
        {notFound && <p className="hint err">לא מצאנו את הכתובת. אפשר לנסח אחרת, או לגרור על המפה.</p>}
        <label className="label" htmlFor="note">איך מוצאים אותו?</label>
        <textarea id="note" rows={2} maxLength={300} placeholder="למשל: על הספסל ליד הכניסה לגינה" value={locationNote} onChange={(e) => setLocationNote(e.target.value)} />
        <p className="hint">לא חובה, אבל זה עוזר לשכנים למצוא את הפריט.</p>
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
        <label className="label" htmlFor="desc">מה משאירים? <span className="req">*</span></label>
        <textarea id="desc" rows={2} placeholder="למשל: כיסא עץ במצב טוב" value={description} onChange={(e) => setDescription(e.target.value)} />
        <p className="hint">* תמונה או תיאור, אחד מהם מספיק.</p>
      </div>
    </div>
  );
}
