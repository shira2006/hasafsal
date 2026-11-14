// התחברות: כרגע אין (כולם אנונימיים). להוספת Google:
// 1) להפעיל Google ב-Supabase -> Authentication -> Providers
// 2) לממש signIn עם supabase.auth.signInWithOAuth({ provider: "google" })
// 3) להחליף את מדיניות ה-RLS ב-supabase.sql לתנאים עם auth.uid()
import { supabase } from "./supabase";

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}
export async function signIn() { /* TODO: Google login */ }
export async function signOut() { /* TODO */ }
