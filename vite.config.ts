import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig, type Plugin } from "vite";

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

/**
 * Ensures client assets (`/assets/*`) are served properly in `vinext start` and
 * standalone production builds when `basePath` is configured (`/{basepath}/assets/*`).
 */
function vinextBasePathAssetsPlugin(): Plugin {
  return {
    name: "vinext-basepath-assets",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const base = server.config.base.replace(/\/+$/, "");
        if (base && req.url) {
          const [pathname, search] = req.url.split("?");
          if (pathname === base) {
            req.url = `${base}/${search ? `?${search}` : ""}`;
          }
        }
        next();
      });
    },
    transform(code, id) {
      if (id.includes("vinext/dist/server/request-pipeline.js")) {
        return code.replace(
          "if (!options.publicFiles.has(options.cleanPathname)) return null;",
          'if (!options.publicFiles.has(options.cleanPathname) && !options.cleanPathname.startsWith("/assets/")) return null;',
        );
      }
      return undefined;
    },
  };
}

export default defineConfig({
  server: {
    port: Number.parseInt(process.env.PORT ?? "3000", 10),
    ...(isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : {}),
  },
  plugins: [
    vinextBasePathAssetsPlugin(),
    vinext(),
    cloudflare({
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
    }),
  ],
});
