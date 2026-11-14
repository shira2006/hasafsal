import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// האתר מוגש מהדומיין hasafsal.net (שורש), ולכן base הוא "/"
export default defineConfig({
  plugins: [react()],
  base: "/",
});
