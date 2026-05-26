import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma engine must not be bundled by Turbopack.
  serverExternalPackages: ["@prisma/client", "prisma"],
  images: {
    remotePatterns: [
      // Vercel Blob storage — admin-uploaded logos, hero images, etc.
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
