const HEBREW = /[֐-׿]/;

/**
 * הופך שגיאה טכנית להודעה ידידותית בעברית. את השגיאה המקורית רושמים ב-console (למפתחים).
 * הודעה שכבר כתובה בעברית (למשל "לא ניתן לקרוא את התמונה") מוצגת כמו שהיא, אלא אם היא כוללת קוד טכני.
 */
export function friendlyError(e: unknown, fallback = "משהו השתבש. נסו שוב"): string {
  console.error(e);
  const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? String(e);
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "נראה שאין חיבור לאינטרנט";
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(msg)) {
    return "לא הצלחנו להתחבר. בדקו את החיבור ונסו שוב";
  }
  if (HEBREW.test(msg) && !/\(\d{3}\)/.test(msg)) return msg;
  return fallback;
}
