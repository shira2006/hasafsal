(() => {
  const cfg = window.APP_CONFIG;
  const $ = (id) => document.getElementById(id);
  const live = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
  const client = live ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  Auth.init(client);
  $("mode").textContent = live ? "" : "מצב דמו (נשמר רק במכשיר)";

  // ---------- שכבת נתונים ----------
  const store = live ? {
    async list() {
      const { data, error } = await client.from("items").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data;
    },
    async add({ blob, description, lat, lng }) {
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const up = await client.storage.from(cfg.BUCKET).upload(path, blob, { contentType: "image/jpeg" });
      if (up.error) throw up.error;
      const photo_url = client.storage.from(cfg.BUCKET).getPublicUrl(path).data.publicUrl;
      const { error } = await client.from("items").insert({ lat, lng, description, photo_url, photo_path: path });
      if (error) throw error;
    },
    async remove(item) {
      const { error } = await client.from("items").delete().eq("id", item.id);
      if (error) throw error;
      if (item.photo_path) client.storage.from(cfg.BUCKET).remove([item.photo_path]);
    },
    subscribe(onInsert, onDelete) {
      client.channel("items")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "items" }, (p) => onInsert(p.new))
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "items" }, (p) => onDelete(p.old.id))
        .subscribe();
    },
  } : (() => {
    const K = "hasafsal-demo";
    const read = () => JSON.parse(localStorage.getItem(K) || "[]");
    const write = (v) => localStorage.setItem(K, JSON.stringify(v));
    const toDataUrl = (b) => new Promise((r) => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
    return {
      async list() { return read(); },
      async add({ blob, description, lat, lng }) {
        write([{ id: String(Date.now()), lat, lng, description, photo_url: await toDataUrl(blob), created_at: new Date().toISOString() }, ...read()]);
      },
      async remove(item) { write(read().filter((i) => i.id !== item.id)); },
      subscribe() {},
    };
  })();

  // ---------- מפה ----------
  const map = L.map("map", { zoomControl: false }).setView(cfg.DEFAULT_CENTER, 16);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);

  const pinIcon = L.divIcon({ className: "", html: '<div class="pin">🪑</div>', iconSize: [28, 28], iconAnchor: [14, 26] });
  const meIcon = L.divIcon({ className: "", html: '<div class="me"></div>', iconSize: [16, 16], iconAnchor: [8, 8] });
  let me = null, meMarker = null, centered = false;
  const markers = new Map(), items = new Map();

  function toast(msg) {
    const t = $("toast"); t.textContent = msg; t.classList.remove("hidden");
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add("hidden"), 2800);
  }
  function dist(a, b) { return map.distance(a, b); }
  function fmt(m) { return m < 1000 ? `${Math.round(m)} מ'` : `${(m / 1000).toFixed(1)} ק"מ`; }

  function addMarker(it) {
    if (markers.has(it.id)) return;
    items.set(it.id, it);
    const m = L.marker([it.lat, it.lng], { icon: pinIcon }).addTo(map).on("click", () => openItem(it.id));
    markers.set(it.id, m);
  }
  function removeMarker(id) {
    markers.get(id)?.remove(); markers.delete(id); items.delete(id);
    if (current === id) { closeSheets(); current = null; }
  }

  // ---------- כרטיס פריט ----------
  let current = null;
  function openItem(id) {
    const it = items.get(id); if (!it) return;
    closeSheets(); current = id;
    $("item-photo").src = it.photo_url;
    $("item-desc").textContent = it.description || "ללא תיאור";
    const d = me ? ` · ${fmt(dist(me, [it.lat, it.lng]))} ממך` : "";
    $("item-meta").textContent = "פורסם " + new Date(it.created_at).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" }) + d;
    $("item-nav").href = `https://www.google.com/maps/dir/?api=1&destination=${it.lat},${it.lng}&travelmode=walking`;
    $("sheet-item").classList.remove("hidden");
  }
  $("item-took").onclick = async () => {
    const it = items.get(current); if (!it) return;
    $("item-took").disabled = true;
    try { await store.remove(it); removeMarker(it.id); toast("תודה! הפריט הוסר מהמפה"); }
    catch (e) { console.error(e); toast("לא הצלחנו להסיר, נסו שוב"); }
    $("item-took").disabled = false;
  };

  // ---------- פרסום פריט ----------
  let blob = null, pickMarker = null;
  $("add").onclick = () => {
    closeSheets(); current = null;
    blob = null; $("add-file").value = ""; $("add-desc").value = "";
    $("add-preview").classList.add("hidden"); $("add-submit").disabled = true;
    const pos = me || [map.getCenter().lat, map.getCenter().lng];
    pickMarker?.remove();
    pickMarker = L.marker(pos, { icon: pinIcon, draggable: true, zIndexOffset: 1000 }).addTo(map);
    map.panTo(pos);
    $("sheet-add").classList.remove("hidden");
  };
  $("add-file").onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    blob = await shrink(f);
    $("add-preview").src = URL.createObjectURL(blob);
    $("add-preview").classList.remove("hidden");
    $("add-submit").disabled = false;
  };
  $("add-submit").onclick = async () => {
    if (!blob || !pickMarker) return;
    const { lat, lng } = pickMarker.getLatLng();
    $("add-submit").disabled = true; $("add-submit").textContent = "מעלה...";
    try {
      await store.add({ blob, description: $("add-desc").value.trim(), lat, lng });
      closeSheets(); toast("הפריט פורסם!");
      if (!live) refresh();
    } catch (e) { console.error(e); toast("שגיאה בפרסום, נסו שוב"); }
    $("add-submit").textContent = "פרסום";
  };

  function shrink(file, max = 1280) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob"))), "image/jpeg", 0.82);
      };
      img.onerror = rej;
      img.src = URL.createObjectURL(file);
    });
  }

  function closeSheets() {
    $("sheet-item").classList.add("hidden");
    $("sheet-add").classList.add("hidden");
    pickMarker?.remove(); pickMarker = null;
  }
  document.querySelectorAll("[data-close]").forEach((b) => (b.onclick = () => { closeSheets(); current = null; }));

  // ---------- מיקום ----------
  $("locate").onclick = () => { if (me) map.setView(me, 17); else toast("מחפשים מיקום..."); };
  if ("geolocation" in navigator) {
    navigator.geolocation.watchPosition((p) => {
      me = [p.coords.latitude, p.coords.longitude];
      if (!meMarker) meMarker = L.marker(me, { icon: meIcon, interactive: false }).addTo(map);
      else meMarker.setLatLng(me);
      if (!centered) { centered = true; map.setView(me, 17); }
    }, () => toast("אין גישה למיקום. אשרו מיקום בדפדפן"), { enableHighAccuracy: true, maximumAge: 5000 });
  }

  // ---------- טעינה ----------
  async function refresh() {
    try { (await store.list()).forEach(addMarker); }
    catch (e) { console.error(e); toast("שגיאה בטעינת הפריטים"); }
  }
  refresh();
  store.subscribe(addMarker, removeMarker);
  // גיבוי אם החיבור בזמן אמת נפל
  if (live) setInterval(async () => {
    try {
      const list = await store.list(); const ids = new Set(list.map((i) => i.id));
      [...markers.keys()].forEach((id) => !ids.has(id) && removeMarker(id));
      list.forEach(addMarker);
    } catch {}
  }, 30000);

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
