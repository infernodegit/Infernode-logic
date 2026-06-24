// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    server: {
      host: "0.0.0.0",
      port: 5000,
      allowedHosts: true,
    },
    preview: {
      host: "0.0.0.0",
      port: 5000,
      strictPort: true,
      allowedHosts: true,
    },
    // Solana web3.js needs a browser Buffer in the CLIENT bundle. The trailing
    // slash forces Vite to resolve the npm `buffer` shim instead of the Node
    // builtin. We scope this to the client only — on the server the native
    // Node `Buffer` is used (the CJS shim would break the SSR ESM runner).
    optimizeDeps: {
      include: ["buffer"],
    },
    // Per-environment `resolve.alias` works at runtime but isn't in Vite's
    // exported types yet, so cast to keep the SSR/client split type-safe.
    environments: {
      client: {
        resolve: {
          alias: {
            buffer: "buffer/",
          },
        } as Record<string, unknown>,
      },
    },
  },
});
