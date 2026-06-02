import type { NextConfig } from "next";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
}
const supabaseHostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // unsafe-eval chỉ cần trong dev (Next.js fast refresh); production dùng unsafe-inline sẵn
              // TODO: migrate sang nonce-based CSP để bỏ unsafe-inline
              isDev
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
                : "script-src 'self' 'unsafe-inline'",
              `img-src 'self' data: https://${supabaseHostname}`,
              `connect-src 'self' https://${supabaseHostname} wss://${supabaseHostname}`,
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self'",
              "frame-ancestors 'none'",
              // base-uri không được cover bởi default-src trong bất kỳ browser nào
              "base-uri 'self'",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
