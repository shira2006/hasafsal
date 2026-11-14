import bench from "../assets/bench-generic.svg";

interface Props {
  title: string;
  text?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

/** כרטיס שגיאה מעוצב: ספסל, כותרת, הסבר וכפתור ניסיון חוזר. */
export default function ErrorCard({ title, text, retryLabel = "ניסיון נוסף", onRetry }: Props) {
  return (
    <div className="error-card" role="alert">
      <img src={bench} alt="" />
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {onRetry && <button type="button" className="btn small" onClick={onRetry}>{retryLabel}</button>}
    </div>
  );
}
