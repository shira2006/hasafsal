import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base מתאים ל-GitHub Pages בכתובת /hasafsal/
export default defineConfig({
  plugins: [react()],
  base: "/hasafsal/",
});
