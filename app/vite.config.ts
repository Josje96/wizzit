import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    // Local API (bun run serve). In production set VITE_API_URL to the API's public URL.
    proxy: { "/api": "http://127.0.0.1:8787" },
  },
});
