import { copyFileSync, cpSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const projectRoot = dirname(fileURLToPath(import.meta.url));

function copyExtensionRuntimeFiles() {
  return {
    name: "copy-extension-runtime-files",
    closeBundle() {
      const outputDirectory = resolve(projectRoot, "dist");
      for (const file of ["background.js", "home-button.js", "favicon.ico"]) {
        copyFileSync(resolve(projectRoot, file), resolve(outputDirectory, file));
      }
      const manifest = JSON.parse(readFileSync(resolve(projectRoot, "manifest.json"), "utf8"));
      manifest.chrome_settings_overrides.homepage = "newtab.html";
      writeFileSync(
        resolve(outputDirectory, "manifest.json"),
        `${JSON.stringify(manifest, null, 2)}\n`
      );
      cpSync(resolve(projectRoot, "icons"), resolve(outputDirectory, "icons"), { recursive: true });
    }
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), copyExtensionRuntimeFiles()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(projectRoot, "newtab.html"),
      output: {
        entryFileNames: (chunk) => `assets/${chunk.name.toLowerCase()}.js`,
        chunkFileNames: (chunk) => `assets/${chunk.name.toLowerCase()}.js`,
        assetFileNames: (asset) => `assets/${asset.name.toLowerCase()}`
      }
    }
  }
});
