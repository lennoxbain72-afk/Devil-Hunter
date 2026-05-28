import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Local dev config — Mocha plugins and Cloudflare auxiliary worker removed.
// The game is 100% client-side; the worker (src/worker/index.ts) is empty.
// To run on Cloudflare Workers again, restore @cloudflare/vite-plugin and
// @getmocha/vite-plugins.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
