import { useEffect, useState } from "react";
import { itemLink, shareLink } from "../lib/share";
import { useToasts } from "./Toasts";
import ShareIcon from "./ShareIcon";

interface Props {
  /** הספסל שפורסם או עודכן */
  itemId: string;
  /** כותרת התודה (אותו נוסח כמו בהודעת ההצלחה) */
  message: string;
  onClose: () => void;
}

/** מיד אחרי פרסום או עדכון: מציעים לשתף את הספסל הספציפי. */
export default function ShareDialog({ itemId, message, onClose }: Props) {
  const toast = useToasts();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function share() {
    if (busy) return;
    setBusy(true);
    try {
      const r = await shareLink(itemLink(itemId), "יש ספסל חדש עם משהו למסירה! ככה אפשר למצוא אותו:");
      if (r === "copied") toast.success("הקישור הועתק");
      if (r !== "cancelled") onClose();
    } catch {
      toast.error("לא הצלחנו לשתף. נסו שוב");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="share-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="share-title">{message}</h2>
        <p className="dialog-text">רוצים לספר לחברים ולשכנים? שולחים להם קישור ישר לספסל הזה.</p>
        <div className="dialog-actions">
          <button type="button" className="btn added" onClick={share} disabled={busy}><ShareIcon /> שיתוף הספסל</button>
        </div>
        <button type="button" className="link-btn dialog-cancel" onClick={onClose}>לא עכשיו</button>
      </div>
    </div>
  );
}
