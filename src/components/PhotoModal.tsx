import { useEffect } from "react";

interface Props {
  src: string;
  alt: string;
  onClose: () => void;
}

/** תמונה בגדול, מעל הכול. נסגרת בהקשה על הרקע, בכפתור, או ב-Escape. */
export default function PhotoModal({ src, alt, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="photo-modal" role="dialog" aria-modal="true" aria-label={alt} onClick={onClose}>
      <button type="button" className="close photo-modal-close" onClick={onClose} aria-label="סגירה">✕</button>
      <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
