import { useEffect, useState } from "react";
import { shrinkImage } from "../lib/image";
import noPhoto from "../assets/no-photo.svg";

interface Props {
  locationLabel: string;
  canUseMyLocation: boolean;
  onSubmit: (p: { blob: Blob | null; description: string }) => Promise<void>;
  onSearch: (query: string) => Promise<boolean>;
  onUseMyLocation: () => void;
  onClose: () => void;
  onError: (msg: string) => void;
}

export default function AddSheet({ locationLabel, canUseMyLocation, onSubmit, onSearch, onUseMyLocation, onClose, onError }: Props) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
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

  async function publish() {
    setBusy(true);
    try { await onSubmit({ blob, description: description.trim() }); }
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
        <h2>פרסום פריט</h2>
        <div className="head-actions">
          <button className="btn small" disabled={!canPublish} onClick={publish}>{busy ? "מעלה..." : "פרסום"}</button>
          <button className="close" onClick={onClose} aria-label="סגירה">✕</button>
        </div>
      </div>

      <div className="field">
        <span className="label">תמונה <span className="req">*</span></span>
        <label className="photo-pick">
          <img src={preview ?? noPhoto} alt={preview ? "תצוגה מקדימה" : "ללא תמונה"} />
          <span className="photo-cta">{preview ? "החלפת תמונה" : "הוספת תמונה"}</span>
          <input type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
      </div>

      <div className="field">
        <label className="label" htmlFor="desc">תיאור <span className="req">*</span></label>
        <textarea id="desc" rows={2} placeholder="למשל: כיסא עץ במצב טוב" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <p className="hint">* צריך תמונה או תיאור. אחד מהם מספיק.</p>

      <div className="field">
        <label className="label" htmlFor="addr">מיקום</label>
        <form className="loc-search" onSubmit={search}>
          <input id="addr" type="search" placeholder="חיפוש כתובת" value={query} onChange={(e) => { setQuery(e.target.value); setNotFound(false); }} />
          <button className="btn small secondary" type="submit" disabled={!query.trim() || searching}>{searching ? "מחפשים..." : "חיפוש"}</button>
        </form>
        {notFound && <p className="hint err">לא מצאנו את הכתובת. נסו לנסח אחרת או לגרור את הסמן במפה.</p>}
        <p className="loc-now">
          <span>{locationLabel}</span>
          {canUseMyLocation && <button type="button" className="link" onClick={onUseMyLocation}>חזרה למיקום שלי</button>}
        </p>
        <p className="hint">אפשר גם לגרור את הסמן במפה.</p>
      </div>
    </div>
  );
}
