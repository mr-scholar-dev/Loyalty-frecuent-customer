import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Enables `next build` to produce a minimal standalone server for Docker.
  output: "standalone",
  typedRoutes: true,
};

export default nextConfig;
