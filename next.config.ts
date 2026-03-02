import { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wow.zamimg.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
