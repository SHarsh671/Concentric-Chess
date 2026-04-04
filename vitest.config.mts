import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*",
      // DO integration tests run under do/vitest.config.mts (workers pool)
      "do/**",
    ],
    server: {
      deps: {
        // Inline these packages so Vite can transform them (avoids CJS/ESM issues)
        inline: ["@testing-library/jest-dom"],
      },
    },
  },
  resolve: {
    alias: {
      // Stub out Next.js / Cloudflare server-only modules in tests
      "server-only": new URL("./src/test/server-only-mock.ts", import.meta.url)
        .pathname,
      "client-only": new URL("./src/test/server-only-mock.ts", import.meta.url)
        .pathname,
    },
  },
});
