import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@myai/api-client",
    "@myai/design-tokens",
    "@myai/shared-schemas",
    "@myai/shared-types",
  ],
};

export default nextConfig;
