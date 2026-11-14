import { useEffect } from "react";

interface Props {
  /** הספסל ריק: מוחקים אותו */
  onEmpty: () => void;
  /** נשאר משהו: ממשיכים לעדכון הספסל */
  onLeft: () => void;
  onClose: () => void;
}

/** אחרי "לקחתי": שואלים אם נשאר משהו על הספסל. */
export default function LeftoverDialog({ onEmpty, onLeft, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="leftover-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="leftover-title">תתחדש/י! נשאר משהו על הספסל?</h2>
        <div className="dialog-actions">
          <button type="button" className="btn green" onClick={onEmpty}>לא, הספסל ריק</button>
          <button type="button" className="btn yellow" onClick={onLeft}>כן, נשאר משהו</button>
        </div>
        <button type="button" className="link-btn dialog-cancel" onClick={onClose}>ביטול</button>
      </div>
    </div>
  );
}
