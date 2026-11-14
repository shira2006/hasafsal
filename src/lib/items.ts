import { BUCKET, supabase } from "./supabase";
import type { Bounds, Item } from "../types";
import { distanceMeters } from "./geo";

/** טוען רק פריטים שנמצאים באזור שמוצג במפה. */
export async function fetchItemsInBounds(b: Bounds): Promise<Item[]> {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .gte("lat", b.south).lte("lat", b.north)
    .gte("lng", b.west).lte("lng", b.east)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data as Item[];
}

async function uploadPhoto(blob: Blob): Promise<{ path: string; url: string }> {
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const up = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" });
  if (up.error) throw up.error;
  return { path, url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
}

/** התמונה אופציונלית, אבל צריך לפחות תמונה או תיאור (נאכף גם במסד הנתונים). */
export async function createItem(p: { blob: Blob | null; description: string; address: string | null; lat: number; lng: number }): Promise<string> {
  const photo = p.blob ? await uploadPhoto(p.blob) : null;
  const { data, error } = await supabase.from("items").insert({
    lat: p.lat, lng: p.lng, description: p.description || null, address: p.address || null,
    photo_url: photo?.url ?? null, photo_path: photo?.path ?? null,
  }).select("id").single();
  if (error) {
    if (photo) supabase.storage.from(BUCKET).remove([photo.path]);
    throw error;
  }
  return data.id as string;
}

/**
 * הספסל הקרוב ביותר לנקודה, גם אם הוא רחוק מהמפה שמוצגת. מחפשים ברדיוס שמתרחב (1, 5, 20, 100, 500 ק"מ)
 * ומחזירים את הקרוב ביותר שנמצא. null אם אין בכלל ספסלים באזור.
 */
export async function fetchNearestItem(lat: number, lng: number): Promise<{ item: Item; meters: number } | null> {
  for (const km of [1, 5, 20, 100, 500]) {
    const dLat = km / 111;
    const dLng = km / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.2));
    const list = await fetchItemsInBounds({ south: lat - dLat, north: lat + dLat, west: lng - dLng, east: lng + dLng });
    if (list.length === 0) continue;
    let best = list[0], bestM = distanceMeters([lat, lng], [best.lat, best.lng]);
    for (const i of list) {
      const m = distanceMeters([lat, lng], [i.lat, i.lng]);
      if (m < bestM) { best = i; bestM = m; }
    }
    // התיבה היא ריבוע: ספסל בפינה עשוי להיות רחוק מהרדיוס, לכן מקבלים רק מי שבתוך הרדיוס (או את הקרוב בסבב האחרון)
    if (bestM <= km * 1000 || km === 500) return { item: best, meters: bestM };
  }
  return null;
}

/** טוען ספסל בודד לפי מזהה (לקישור שיתוף). null אם כבר לא קיים. */
export async function fetchItemById(id: string): Promise<Item | null> {
  const { data, error } = await supabase.from("items").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Item | null) ?? null;
}

/**
 * מחליף ספסל קיים בספסל חדש באותו מקום (אותה כתובת): תיאור חדש, ותמונה חדשה או הישנה (keepPhoto).
 * קודם יוצרים את החדש, ורק אחר כך מוחקים את הישן. אם היצירה נכשלת, הישן נשאר כמו שהיה.
 */
export async function replaceItem(old: Item, p: { blob: Blob | null; keepPhoto: boolean; description: string }): Promise<string> {
  const uploaded = p.blob ? await uploadPhoto(p.blob) : null;
  const reuse = !uploaded && p.keepPhoto && !!old.photo_url;
  const photo_url = uploaded?.url ?? (reuse ? old.photo_url : null);
  const photo_path = uploaded?.path ?? (reuse ? old.photo_path : null);

  const { data, error } = await supabase.from("items").insert({
    lat: old.lat, lng: old.lng, description: p.description || null, address: old.address, photo_url, photo_path,
  }).select("id").single();
  if (error) {
    if (uploaded) supabase.storage.from(BUCKET).remove([uploaded.path]);
    throw error;
  }

  // הספסל החדש כבר על המפה. מסירים את הישן (ואת התמונה הישנה, אם היא לא נשארה בשימוש).
  const del = await supabase.from("items").delete().eq("id", old.id);
  if (del.error) { console.error(del.error); return data.id as string; } // נשארה גרסה ישנה: לא מכשילים את הפעולה, החדש כבר פורסם
  if (old.photo_path && old.photo_path !== photo_path) supabase.storage.from(BUCKET).remove([old.photo_path]);
  return data.id as string;
}

/** מוחק את הפריט. מחזיר false אם הוא כבר לא היה קיים (מישהו אחר כבר לקח אותו). */
export async function removeItem(item: Item): Promise<boolean> {
  const { data, error } = await supabase.from("items").delete().eq("id", item.id).select("id");
  if (error) throw error;
  if (!data || data.length === 0) return false;
  if (item.photo_path) supabase.storage.from(BUCKET).remove([item.photo_path]);
  return true;
}

/** מאזין בזמן אמת להוספה/הסרה של פריטים אצל כל המשתמשים. מחזיר פונקציית ניקוי. */
export function subscribeItems(onInsert: (i: Item) => void, onDelete: (id: string) => void) {
  const ch = supabase
    .channel("items")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "items" }, (p) => onInsert(p.new as Item))
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "items" }, (p) => onDelete((p.old as { id: string }).id))
    .subscribe();
  return () => { supabase.removeChannel(ch); };
}
