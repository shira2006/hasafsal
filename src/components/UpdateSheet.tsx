import { useEffect, useState } from "react";
import type { Item } from "../types";
import { shrinkImage } from "../lib/image";
import { friendlyError } from "../lib/errors";
import BenchLoader from "./BenchLoader";
import PhotoPicker from "./PhotoPicker";

interface Props {
  item: Item;
  /** took: לקחו וגם נשאר משהו. added: הוסיפו לספסל והוא נשאר. */
  mode: "took" | "added";
  onSubmit: (p: { blob: Blob | null; keepPhoto: boolean; description: string }) => Promise<void>;
  onClose: () => void;
  onError: (msg: string) => void;
}

/**
 * עדכון ספסל קיים: אותו מקום, תיאור (ותמונה, אם רוצים) חדשים. הספסל הישן מוחלף בחדש.
 * אחרי "לקחתי" מתחילים בלי התמונה הישנה (היא כבר לא נכונה). אחרי "הוספתי" התמונה הישנה נשארת עד שמחליפים אותה.
 */
export default function UpdateSheet({ item, mode, onSubmit, onClose, onError }: Props) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [keepOld, setKeepOld] = useState(mode === "added" && !!item.photo_url);
  const [description, setDescription] = useState(item.description ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const hasPhoto = !!blob || (keepOld && !!item.photo_url);
  const canPublish = (hasPhoto || description.trim().length > 0) && !busy;

  async function onFile(f?: File) {
    if (!f) return;
    try {
      const b = await shrinkImage(f);
      setBlob(b);
      setPreview(URL.createObjectURL(b));
      setKeepOld(false);
    } catch (e) {
      onError(friendlyError(e, "לא הצלחנו לטעון את התמונה. נסו תמונה אחרת"));
    }
  }

  function removePhoto() { setBlob(null); setPreview(null); setKeepOld(false); }

  async function submit() {
    setBusy(true);
    try { await onSubmit({ blob, keepPhoto: keepOld, description: description.trim() }); }
    finally { setBusy(false); }
  }

  const shownPhoto = preview ?? (keepOld ? item.photo_url : null);

  return (
    <div className="sheet update-sheet">
      <div className="sheet-head">
        <h2>{mode === "took" ? "מה נשאר על הספסל?" : "מה הוספת לספסל?"}</h2>
        <div className="head-actions">
          <button className="btn small green" disabled={!canPublish} onClick={submit}>
            {busy ? <><BenchLoader size={16} label="מעדכנים" /> מעדכנים...</> : "עדכון"}
          </button>
          <button className="close" onClick={onClose} aria-label="סגירה">✕</button>
        </div>
      </div>

      <div className="field">
        <span className="label">תמונה</span>
        {shownPhoto && <img className="preview" src={shownPhoto} alt="תמונת הספסל" />}
        <div className="row photo-actions">
          <PhotoPicker replacing={!!shownPhoto} onFile={onFile} />
          {shownPhoto && <button type="button" className="btn small" onClick={removePhoto}>הסרה</button>}
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="upd-desc">תיאור</label>
        <textarea
          id="upd-desc"
          rows={3}
          maxLength={500}
          placeholder="תארו מה יש עכשיו על הספסל"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* המיקום קבוע: הספסל החדש יחליף את הישן באותו מקום */}
      <div className="field">
        <span className="label">מיקום</span>
        <div className="card"><p className="address">{item.address ?? "אותו מקום של הספסל"}</p></div>
      </div>
    </div>
  );
}
