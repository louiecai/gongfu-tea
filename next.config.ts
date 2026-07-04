import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static — hosted on GitHub Pages, no Node server available.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
