// בטלפון (מסך מגע) מוסיפים קישור קטן לבחירה מהגלריה. במחשב רק הכפתור הראשי (חלון בחירת קובץ).
const IS_TOUCH = typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches;

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" /><circle cx="12" cy="13" r="3.5" />
  </svg>
);

interface Props {
  /** כבר יש תמונה (ואז הכפתור מחליף אותה) */
  replacing: boolean;
  onFile: (f?: File) => void;
}

/**
 * הוספת תמונה: הכפתור הראשי פותח קודם כל את המצלמה (capture), ומתחתיו קישור קטן לבחירה מהגלריה.
 * (באנדרואיד, קלט קובץ רגיל מציג לפעמים רק את הגלריה, ולכן המצלמה נפתחת במפורש.)
 */
export default function PhotoPicker({ replacing, onFile }: Props) {
  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = ""; // כדי שאפשר יהיה לבחור שוב את אותו קובץ
    onFile(f);
  };
  const label = replacing ? (IS_TOUCH ? "צילום חדש" : "החלפת תמונה") : "הוספת תמונה";
  return (
    <div className="photo-pick">
      <label className="btn small yellow">
        <CameraIcon /> {label}
        <input type="file" accept="image/*" capture="environment" hidden onChange={pick} />
      </label>
      {IS_TOUCH && (
        <label className="photo-link">
          או בחירה מהגלריה
          <input type="file" accept="image/*" hidden onChange={pick} />
        </label>
      )}
    </div>
  );
}
