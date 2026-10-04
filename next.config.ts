import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ['192.168.123.11'],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
