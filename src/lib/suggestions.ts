import { supabase } from "./supabase";

/** שולח הצעה לשיפור. הטבלה מאפשרת הוספה בלבד, ולכן אי אפשר לקרוא אותה מהדפדפן. */
export async function sendSuggestion(message: string) {
  const { error } = await supabase.from("suggestions").insert({ message: message.trim() });
  if (error) throw error;
}
