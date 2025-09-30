import type { NextConfig } from "next";

const nextConfig: NextConfig = {
eslint: {
    ignoreDuringBuilds: true, // ESLint tidak akan memblokir build
  },
};

export default nextConfig;
