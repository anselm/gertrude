import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  server: { host: true, port: 5173, proxy: { "/socket.io": { target: "http://127.0.0.1:8070", ws: true } } },
  build: { outDir: "dist", emptyOutDir: true },
});
