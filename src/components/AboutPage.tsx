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
          הספסל נולד מהליכה ברחוב. רציתי לעצור קצת, וחיפשתי ספסל קרוב. לא ידעתי איפה יש אחד, ובדרך שמתי לב
          לכמה דברים טובים שאנשים משאירים ברחוב: כיסא, ספרים, מנורה, כולם מחכים למישהו שיצטרך אותם.
        </p>
        <p>
          המשימה שלנו פשוטה: שדברים טובים ימצאו בית חדש, במקום לסיים את דרכם בפח. כל פריט שמישהו לוקח הוא
          פריט שלא נקנה מחדש, לא נהפך לפסולת, ולא עלה משאבים. קיימות אפשר להתחיל מהרחוב שלכם.
        </p>
        <p>
          ומעבר לזה, זו קהילה. שכנים שנותנים לשכנים, בלי כסף ובלי סיבוכים. אם משהו אצלכם עדיין שימושי,
          פרסמו אותו במפה, ותנו למי שצריך למצוא אותו.
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
