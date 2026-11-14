// Service worker מינימלי: נדרש להתקנה על מסך הבית. רשת קודם, ללא שמירת נתונים/תמונות.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
