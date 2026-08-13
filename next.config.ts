import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts", "@base-ui/react"],
  },
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
