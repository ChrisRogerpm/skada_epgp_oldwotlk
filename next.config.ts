import { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    minimumCacheTTL: 2678400, // 31 días: los íconos de items/clases son inmutables
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
