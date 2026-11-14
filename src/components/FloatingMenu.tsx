interface Props {
  onRecenter: () => void;
  onAdd: () => void;
  showAdd: boolean;
}

/** תפריט צף: מרכוז על המיקום הנוכחי, והוספת ספסל במיקום הנוכחי. */
export default function FloatingMenu({ onRecenter, onAdd, showAdd }: Props) {
  return (
    <div className="fabs">
      {showAdd && (
        <button className="fab add" onClick={onAdd}>
          <span className="ico" aria-hidden="true">＋</span>
          הוספת ספסל כאן
        </button>
      )}
      <button className="fab" onClick={onRecenter} aria-label="המיקום שלי" title="המיקום שלי">
        <span className="ico" aria-hidden="true">📍</span>
      </button>
    </div>
  );
}
