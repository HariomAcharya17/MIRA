import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

/**
 * Dev-only: serves /api/* by running the same handlers Vercel deploys
 * (api/<name>.ts, Web Request -> Response), so local dev matches production.
 */
function vercelApiDev(): Plugin {
  return {
    name: "mira-vercel-api-dev",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        const match = url.match(/^\/api\/([A-Za-z0-9_-]+)(?:[/?]|$)/);
        if (!match) return next();
        const file = path.resolve(__dirname, "api", `${match[1]}.ts`);
        if (!fs.existsSync(file)) return next();

        const controller = new AbortController();
        res.on("close", () => {
          if (!res.writableEnded) controller.abort();
        });
        try {
          const mod = await server.ssrLoadModule(file);
          const chunks: Buffer[] = [];
          if (req.method !== "GET" && req.method !== "HEAD") {
            for await (const c of req) chunks.push(c as Buffer);
          }
          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) {
            if (typeof v === "string") headers.set(k, v);
            else if (Array.isArray(v)) headers.set(k, v.join(", "));
          }
          const request = new Request(`http://${req.headers.host}${url}`, {
            method: req.method,
            headers,
            body: chunks.length ? Buffer.concat(chunks) : undefined,
            signal: controller.signal,
          });
          const response: Response = await mod.default(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          if (!response.body) return res.end();
          const reader = response.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        } catch (e) {
          if (controller.signal.aborted) return;
          console.error("[api dev]", e);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
          }
          res.end(JSON.stringify({ error: "Dev API handler crashed. See terminal." }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Make server-only secrets (GROQ_API_KEY, ...) visible to the dev API
  // handlers via process.env. Vite still only exposes VITE_* to the browser.
  const env = loadEnv(mode, process.cwd(), "");
  for (const [k, v] of Object.entries(env)) if (process.env[k] === undefined) process.env[k] = v;

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), vercelApiDev()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            markdown: ["react-markdown", "remark-gfm", "rehype-highlight"],
          },
        },
      },
    },
  };
});
