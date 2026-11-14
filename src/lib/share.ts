/** קישור לספסל ספציפי: פותח את המפה ממורכזת עליו, והוא כבר נבחר. */
export const itemLink = (id: string) => `${location.origin}/#/b/${id}`;

/** מזהה הספסל מתוך הקישור (#/b/<id>), או null. */
export function itemIdFromHash(hash = location.hash): string | null {
  const m = /^#\/b\/([0-9a-f-]{36})$/i.exec(hash);
  return m ? m[1] : null;
}

/** משתף דרך חלון השיתוף של המכשיר, ואם אין כזה מעתיק את הקישור. מחזיר "copied" אם הועתק, "shared" אם שותף, "cancelled" אם בוטל. */
export async function shareLink(url: string, text: string): Promise<"shared" | "copied" | "cancelled"> {
  if (navigator.share) {
    try {
      await navigator.share({ title: "הספסל", text, url });
      return "shared";
    } catch (e) {
      if ((e as DOMException).name === "AbortError") return "cancelled";
      // נופלים להעתקה
    }
  }
  await navigator.clipboard.writeText(url);
  return "copied";
}
