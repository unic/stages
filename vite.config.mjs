import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // The root public/ directory belongs to the historical demo application and
  // must not be copied into the published library artifact.
  publicDir: false,
  plugins: [
    react({
      include: /src\/.*\.[jt]sx?$/,
    }),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: "src/lib/index.js",
      name: "ReactStages",
      formats: ["es", "umd"],
      fileName: (format) => format === "es" ? "lib.module.js" : "lib.umd.js",
    },
    rollupOptions: {
      external: ["react", "react/jsx-runtime"],
      output: {
        globals: {
          react: "React",
          "react/jsx-runtime": "ReactJSXRuntime",
        },
      },
    },
  },
});
