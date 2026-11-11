import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": fileURLToPath(new URL("../rraabbiitt-react-components/src", import.meta.url)),
    },
    dedupe: ["react", "react-dom"],
  },
  server: { host: "127.0.0.1" },
  preview: { host: "127.0.0.1" },
});
