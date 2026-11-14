import { BUCKET, supabase } from "./supabase";
import type { Bounds, Item } from "../types";

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

export async function createItem(p: { blob: Blob; description: string; lat: number; lng: number }) {
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const up = await supabase.storage.from(BUCKET).upload(path, p.blob, { contentType: "image/jpeg" });
  if (up.error) throw up.error;
  const photo_url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const { error } = await supabase.from("items").insert({
    lat: p.lat, lng: p.lng, description: p.description || null, photo_url, photo_path: path,
  });
  if (error) {
    supabase.storage.from(BUCKET).remove([path]);
    throw error;
  }
}

export async function removeItem(item: Item) {
  const { error } = await supabase.from("items").delete().eq("id", item.id);
  if (error) throw error;
  if (item.photo_path) supabase.storage.from(BUCKET).remove([item.photo_path]);
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
