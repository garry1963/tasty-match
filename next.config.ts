import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  allowedDevOrigins: [
    "**.run.app",
    "**.aistudio.google.com",
    "**.googleusercontent.com",
    "localhost",
  ],
};

export default nextConfig;
