import { useState } from "react";
import { sendSuggestion } from "../lib/suggestions";

const MAX = 1000;

/** דף "המשימה שלנו": הסיפור, והצעות לשיפור. (נוסח ראשוני, לעריכה.) */
export default function AboutPage() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = text.trim().length >= 3;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      await sendSuggestion(text);
      setSent(true);
      setText("");
    } catch {
      setError("לא הצלחנו לשלוח. נסו שוב בעוד רגע");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="page">
      <div className="page-inner">
        <h1>המשימה שלנו</h1>

        <p>
          הכול התחיל מספסל אחד, ממש מתחת לבית שלי. אני תמיד מניחה עליו דברים והוא תמיד מחזיר בחזרה.
        </p>
        <p>
          אני אוהבת להסתובב בשכונה ולגלות את הדברים הטובים שאנשים משאירים ברחוב. מתוך האהבה הזו רציתי ליצור
          מקום מנוהל: שבו אנשים יוכלו לשתף בקלות כשהם משאירים משהו, ושייתן לנו אפשרות – גם כשמגיעים לאזור
          חדש – לבדוק במפה איפה יש ספסלים קרובים ולראות אילו אוצרות אנשים פרסמו.
        </p>
        <p>
          אני באמת מאמינה שהכול כבר נמצא בעולם, ושקיימות אמיתית מתחילה ממש ברחוב שלנו. פשוט צריך למצוא את
          הספסל הנכון, לחבר בין שכנים בלי כסף ובלי סיבוכים, ולתת לדברים טובים בית חדש במקום שיסיימו בפח.
        </p>
        <p className="closing">
          יש אצלכם משהו שעדיין שימושי? פרסמו אותו בספסל, ותנו למי שצריך למצוא אותו.
        </p>

        <form className="suggest" onSubmit={submit}>
          <h2>יש לכם רעיון?</h2>
          <p className="meta">ספרו לנו מה היה עוזר לכם, מה חסר, או מה לשפר. אנחנו קוראים הכול.</p>
          <textarea
            rows={4}
            maxLength={MAX}
            value={text}
            onChange={(e) => { setText(e.target.value); setSent(false); }}
            placeholder="כתבו כאן..."
            aria-label="ההצעה שלכם"
          />
          <div className="suggest-row">
            <button className="btn" type="submit" disabled={!valid || busy}>{busy ? "שולחים..." : "שליחה"}</button>
            {sent && <span role="status">תודה! ההצעה התקבלה 💛</span>}
            {error && <span role="alert" className="err">{error}</span>}
          </div>
        </form>

        <p className="credit">הלוגו כתוב באותיות "דנה יד", עיצוב: אאא בית לטיפוגרפיה עברית.</p>
      </div>
    </article>
  );
}
