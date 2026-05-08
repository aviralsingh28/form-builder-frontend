import type { NextConfig } from "next";

/** Proxies browser calls to `/api/*` → Nest API (default port 3000). */
const nextConfig: NextConfig = {
  async rewrites() {
    const target = process.env.API_PROXY_TARGET ?? "http://localhost:3000";
    return [{ source: "/api/:path*", destination: `${target}/api/:path*` }];
  },
};

export default nextConfig;
