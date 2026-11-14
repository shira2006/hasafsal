import type { CSSProperties } from "react";

// ציור הספסל של הלוגו, קו אחרי קו (אותו סדר שבו מציירים ספסל בעיפרון)
const STROKES = [
  "M34 34 L286 30 L288 92 L36 96 Z",       // משענת
  "M37 38 L283 34",
  "M38 92 L285 88",
  "M22 112 L298 108 L304 132 L20 138 Z",   // ישיבה
  "M26 116 L296 112",
  "M52 138 L46 178",                       // רגליים
  "M268 136 L274 178",
  "M50 96 L52 112",                        // תמיכות
  "M270 92 L268 110",
];
const HEART = "M286 62 C274 53 266 46 266 37 C266 31 271 27 276 27 C280 27 284 29 286 33 C288 29 292 27 296 27 C301 27 306 31 306 37 C306 46 298 53 286 62 Z";

interface Props {
  /** גובה הציור בפיקסלים */
  size?: number;
  /** טקסט לקוראי מסך, ואם showLabel: גם מוצג לצד הציור */
  label?: string;
  showLabel?: boolean;
  /** מצטייר פעם אחת עד הסוף ונשאר שלם (במקום לחזור על עצמו). למציין שמוצג זמן מוגבל. */
  once?: boolean;
  className?: string;
}

/** מציין טעינה: ספסל שמצטייר מחדש ומחדש (או פעם אחת, עם once). בלי תנועה למי שביקש להפחית תנועה (מוצג ספסל מצויר). */
export default function BenchLoader({ size = 40, label = "טוענים", showLabel = false, once = false, className = "" }: Props) {
  const strokeWidth = Math.max(4, (168 / size) * 1.7); // עובי קו קבוע בערך בפיקסלים, בלי קשר לגודל
  return (
    <span className={`bench-loader${once ? " once" : ""} ${className}`} role="status" aria-label={label}>
      <svg viewBox="0 20 324 168" height={size} width={(size * 324) / 168} aria-hidden="true" style={{ "--sw": strokeWidth } as CSSProperties}>
        {STROKES.map((d, i) => (
          <path key={i} d={d} pathLength={1} style={{ "--i": i } as CSSProperties} />
        ))}
        <path className="heart" d={HEART} />
      </svg>
      {showLabel && <span className="bench-loader-label">{label}</span>}
    </span>
  );
}
