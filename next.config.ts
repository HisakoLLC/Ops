import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/500",
        destination: "/error/500",
      },
      {
        source: "/502",
        destination: "/error/502",
      },
      {
        source: "/503",
        destination: "/error/503",
      },
      {
        source: "/504",
        destination: "/error/504",
      },
    ];
  },
};

export default nextConfig;
