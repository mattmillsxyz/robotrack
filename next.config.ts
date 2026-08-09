import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone: the server plus only the node_modules Next traced
  // as actually reachable. Lets the runtime image skip node_modules entirely,
  // which is most of the difference between a 3.3GB image and a small one.
  output: "standalone",
};

export default nextConfig;
