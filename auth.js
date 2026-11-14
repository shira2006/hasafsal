// מודול התחברות נפרד. כרגע אין התחברות (כולם אנונימיים).
// להוספת Google: הפעילו Google ב-Supabase -> Authentication -> Providers,
// ואז מימוש signIn() עם: client.auth.signInWithOAuth({ provider: "google" })
window.Auth = {
  async init(client) { this.client = client; },
  async currentUser() {
    if (!this.client) return null;
    const { data } = await this.client.auth.getUser();
    return data?.user || null;
  },
  async signIn() { /* TODO: Google login */ },
  async signOut() { /* TODO */ },
};
