import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/404",
        destination: "/error/404",
      },
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
  async headers() {
    return [
      {
        source: "/api/cms/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS, PUT, DELETE" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
};

export default nextConfig;
