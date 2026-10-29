import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
      { key: "Strict-Transport-Security", value: "max-age=31536000" },
      { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'" },
    ] }, {source:'/offline.html',headers:[
      {key:'Cache-Control',value:'public, max-age=0, must-revalidate, no-transform'},
    ]}];
  },
  serverExternalPackages: ["ffmpeg-static", "sharp"],
  sassOptions: {
    // An embedded Sass BOM becomes part of the first selector when CSS chunks merge.
    charset: false,
    quietDeps: true,
    silenceDeprecations: ["import", "legacy-js-api"],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'media.thewedmarket.com' },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
