import type { NextConfig } from "next";

function getSupabaseOrigin() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").origin;
  } catch {
    return "";
  }
}

const supabaseOrigin = getSupabaseOrigin();

const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: "/(.*)",
      headers: [{
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' https://web.squarecdn.com",
          "frame-src 'self' https://web.squarecdn.com",
          ["connect-src 'self' https://web.squarecdn.com https://pci-connect.squareup.com https://o160250.ingest.sentry.io", supabaseOrigin].filter(Boolean).join(" "),
          "style-src 'self' 'unsafe-inline' https://web.squarecdn.com",
          "font-src 'self' https://square-fonts-production-f.squarecdn.com https://d1g145x70srn7h.cloudfront.net",
          ["img-src 'self' data: blob:", supabaseOrigin].filter(Boolean).join(" "),
        ].join("; "),
      }],
    }];
  },
};

export default nextConfig;
