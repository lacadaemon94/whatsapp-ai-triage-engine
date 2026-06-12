import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output bundles a minimal Node server + only the dependencies
  // actually used at runtime. The Dockerfile copies the .next/standalone tree
  // and runs `node server.js` — no npm/node_modules needed in the runner stage.
  output: "standalone"
};

export default nextConfig;
