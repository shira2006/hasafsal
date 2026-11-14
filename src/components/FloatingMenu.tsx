interface Props {
  onRecenter: () => void;
  onNearest: () => void;
  onAdd: () => void;
  showAdd: boolean;
}

/** תפריט צף: הוספת ספסל במיקום הנוכחי (פלוס), הספסל הקרוב ביותר (לב), ומרכוז על המיקום הנוכחי (אייקון מרכוז גנרי). */
export default function FloatingMenu({ onRecenter, onNearest, onAdd, showAdd }: Props) {
  return (
    <div className="fabs">
      {showAdd && (
        <button className="fab add" onClick={onAdd} aria-label="הוספת ספסל במיקום שלי" title="הוספת ספסל כאן">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}
      <button className="fab heart" onClick={onNearest} aria-label="הספסל הקרוב אליי" title="הספסל הקרוב אליי">
        <svg viewBox="0 0 32 30" width="24" height="23" fill="currentColor" aria-hidden="true">
          <path d="M16 28.5C6 20.5 2 14.5 2 9.2 2 4.8 5.4 2 9.4 2c3 0 5.5 1.7 6.6 4.5C17.1 3.7 19.6 2 22.6 2 26.6 2 30 4.8 30 9.2c0 5.3-4 11.3-14 19.3Z" />
        </svg>
      </button>
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
