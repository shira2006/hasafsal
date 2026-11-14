import { useState } from "react";
import { shrinkImage } from "../lib/image";

interface Props {
  onSubmit: (p: { blob: Blob; description: string }) => Promise<void>;
  onClose: () => void;
  onError: (msg: string) => void;
}

export default function AddSheet({ onSubmit, onClose, onError }: Props) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

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

  return (
    <div className="sheet">
      <button className="close" onClick={onClose} aria-label="סגירה">✕</button>
      <h2>פרסום פריט</h2>
      <label className="btn secondary">
        📷 צילום / בחירת תמונה
        <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      {preview && <img src={preview} alt="תצוגה מקדימה" />}
      <textarea
        rows={2}
        placeholder="תיאור (לא חובה): למשל כיסא עץ במצב טוב"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <p className="meta">הפריט יסומן במיקום שלך. אפשר לגרור את הסמן במפה לתיקון.</p>
      <button
        className="btn primary"
        disabled={!blob || busy}
        onClick={async () => { setBusy(true); try { await onSubmit({ blob: blob!, description: description.trim() }); } finally { setBusy(false); } }}
      >
        {busy ? "מעלה..." : "פרסום"}
      </button>
    </div>
  );
}
