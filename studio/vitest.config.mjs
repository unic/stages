import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./test/setup.js",
    css: true,
    include: ["components/**/*.test.{js,jsx}"],
    coverage: {
      reporter: ["text", "html"],
    },
  },
});
