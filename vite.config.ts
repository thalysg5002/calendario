import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  publicDir: 'public',
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["..", "./client", "./shared", "./node_modules", "./public"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve",
    configureServer(server) {
      const app = createServer();
      return () => {
        server.middlewares.use((req, res, next) => {
          // Skip HMR and Vite internals
          if (req.url.startsWith('/@')) return next();
          if (req.url.includes('?t=')) return next();
          // Skip HTML files (Vite handles index.html)
          if (req.url.endsWith('.html') && !req.url.includes('/api')) return next();
          // Skip static assets that Vite should handle
          if (req.url.match(/\.(js|ts|css|woff2?|ttf|otf|eot)(?:\?|$)/)) return next();
          console.log('[vite] → express:', req.method, req.url);
          app(req, res, next);
        });
      };
    },
  };
}
