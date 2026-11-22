import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177,
    strictPort: true, // fail loudly instead of silently picking another port
    // Same-origin trick: the browser calls /api on 5177, Vite forwards to the backend,
    // so the session cookie works without any CORS setup.
    proxy: { "/api": "http://localhost:5224" },
  },
});
