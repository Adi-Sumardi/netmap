import type { NextConfig } from "next";

// Development only: proxy the Laravel routes so the browser sees one origin, like Caddy does in production.
const backendUrl = process.env.NETMAP_BACKEND_URL;
const backendPaths = ["/api/:path*", "/auth/:path*", "/sanctum/:path*", "/broadcasting/:path*"];

const nextConfig: NextConfig = {
  // Self-contained server for the Docker image (infra/frontend.Dockerfile).
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    if (!backendUrl) {
      return [];
    }

    return backendPaths.map((source) => ({ source, destination: `${backendUrl}${source}` }));
  },
};

export default nextConfig;
