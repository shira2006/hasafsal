import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// האתר מוגש מהשורש של הדומיין (www.hasafsal.net), ולכן base הוא "/"
export default defineConfig({
  plugins: [react()],
  base: "/",
});
