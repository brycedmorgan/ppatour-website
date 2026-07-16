import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Player headshots served by the Pickleball.com partner API (rankings feed).
    remotePatterns: [
      { protocol: "https", hostname: "images.pickleball.com" },
    ],
  },
};

export default nextConfig;
