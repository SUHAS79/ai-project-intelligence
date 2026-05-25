import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent webpack from trying to bundle Node-only modules used by @libsql/client
  serverExternalPackages: ["@libsql/client"],
};

export default nextConfig;
