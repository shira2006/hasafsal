import { useState } from "react";
import { sendSuggestion } from "../lib/suggestions";
import { friendlyError } from "../lib/errors";
import { useToasts } from "./Toasts";
import BenchLoader from "./BenchLoader";
import ShareIcon from "./ShareIcon";
import { shareLink } from "../lib/share";

const MAX = 1000;

/** דף "המשימה שלנו": הסיפור, והצעות לשיפור. (נוסח ראשוני, לעריכה.) */
export default function AboutPage() {
  const toast = useToasts();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const valid = text.trim().length >= 3;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    try {
      await sendSuggestion(text);
      setText("");
      toast.success("תודה! ההצעה שלכם התקבלה");
    } catch (err) {
      toast.error(friendlyError(err, "לא הצלחנו לשלוח. נסו שוב בעוד רגע"));
    } finally {
      setBusy(false);
    }
  }

  async function shareSite() {
    try {
      const r = await shareLink(`${location.origin}/`, "הספסל: מצאו או השאירו דברים לאחרים, ממש ליד הבית");
      if (r === "copied") toast.success("הקישור הועתק");
    } catch {
      toast.error("לא הצלחנו לשתף. נסו שוב");
    }
  }

  return (
    <article className="page">
      <div className="page-inner">
        <h1>עוד על הספסל</h1>

        <p>
          הכול התחיל מספסל אחד, ממש מתחת לבית שלי. אני תמיד מניחה עליו דברים והוא תמיד מחזיר בחזרה.
        </p>
        <p>
          אני באמת מאמינה שהכול כבר נמצא בעולם, ושקיימות אמיתית מתחילה ממש ברחוב שלנו. פשוט צריך למצוא את
          הספסל הנכון, לחבר בין שכנים בלי כסף ובלי סיבוכים, ולתת לדברים טובים בית חדש במקום שיסיימו בפח.
        </p>
        <p className="closing">
          יש אצלכם משהו שעדיין שימושי? פרסמו אותו בספסל, ותנו למי שצריך למצוא אותו.
        </p>

        <section className="share-card">
          <h2>ספרו לשכנים</h2>
          <p>ככל שיותר אנשים מכירים את הספסל, יותר דברים טובים מוצאים בית. שלחו את הקישור לחברים, לקבוצה של הבניין או של השכונה.</p>
          <button type="button" className="btn added" onClick={shareSite}><ShareIcon /> שיתוף הספסל</button>
        </section>

        <form className="suggest" onSubmit={submit}>
          <h2>יש לכם רעיון?</h2>
          <p className="meta">ספרו לנו מה היה עוזר לכם, מה חסר, או מה לשפר. אנחנו קוראים הכול.</p>
          <textarea
            rows={4}
            maxLength={MAX}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="כתבו כאן..."
            aria-label="ההצעה שלכם"
          />
          <div className="suggest-row">
            <button className="btn" type="submit" disabled={!valid || busy}>{busy ? <><BenchLoader size={18} label="שולחים" /> שולחים...</> : "שליחה"}</button>
          </div>
        </form>

        <p className="credit">הלוגו כתוב באותיות "דנה יד", עיצוב: אאא בית לטיפוגרפיה עברית.</p>
      </div>
    </article>
  );
}
