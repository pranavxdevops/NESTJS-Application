import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {protocol: "https", hostname: "funny-delight-4286f4c57b.media.strapiapp.com"},   
       {protocol: "https", hostname: "funny-delight-4286f4c57b.strapiapp.com" },
      {
        protocol: "https",
        hostname: "www.w3schools.com",
      },
      {protocol: "http", hostname: "localhost"},
      {
        protocol: "http",
        hostname: "192.168.30.*",
      },
      {
        protocol: process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL?.startsWith("https") ? "https" : "http",
        hostname: new URL(process.env.NEXT_PUBLIC_STRAPI_IMAGE_BASE_URL ?? "http://localhost").hostname,
        pathname: '/uploads/**',
      },
      {
        protocol: "https",
        hostname: "www.theonezone.org",
      },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "stwfzouaenorth001.blob.core.windows.net" },
      { protocol: "https", hostname: "api.builder.io" },
      { protocol: "https", hostname: "api.builder.io" },
      { protocol: "https", hostname: "stwfzouaenorth001.blob.core.windows.net" },
      { protocol: "https", hostname: "flagcdn.com" },
      { protocol: "https", hostname: "images.unsplash.com" }, 
    ],
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
