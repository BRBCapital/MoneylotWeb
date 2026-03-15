import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mlotdev.azurewebsites.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname:
          "moneylotv2webapi-aedchvaqddhaaneb.southafricanorth-01.azurewebsites.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
