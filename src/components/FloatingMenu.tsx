interface Props {
  onRecenter: () => void;
  onAdd: () => void;
  showAdd: boolean;
}

/** תפריט צף: הוספת ספסל במיקום הנוכחי (פלוס), ומרכוז על המיקום הנוכחי (אייקון מרכוז גנרי). */
export default function FloatingMenu({ onRecenter, onAdd, showAdd }: Props) {
  return (
    <div className="fabs">
      {showAdd && (
        <button className="fab add" onClick={onAdd} aria-label="הוספת ספסל במיקום שלי" title="הוספת ספסל כאן">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}
      <button className="fab" onClick={onRecenter} aria-label="המיקום שלי" title="המיקום שלי">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="6.5" />
          <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      </button>
    </div>
  );
}
