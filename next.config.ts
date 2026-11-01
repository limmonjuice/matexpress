import type { NextConfig } from "next";

// Not while developing: hot reloading needs eval and a websocket.
const isDev = process.env.NODE_ENV === "development";

// Inline scripts stay allowed because Next.js needs them, and nonces would make every prerendered page render per request.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self' blob: data:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  ...(isDev ? [] : [{ key: "Content-Security-Policy", value: contentSecurityPolicy }]),
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  // Browsers ignore this over plain HTTP. No includeSubDomains: other services on the client's domain may not have HTTPS.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  // A demo's sample sellers, prices and reviews shouldn't turn up in search results. See src/lib/site-mode.ts.
  ...(process.env.SITE_MODE === "demo" ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
