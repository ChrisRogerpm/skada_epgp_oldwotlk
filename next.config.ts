import { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wow.zamimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "wotlk.ultimowow.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
