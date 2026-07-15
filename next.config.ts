import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV !== "production";
// Soft launch: hide individual question pages (/questions/<slug>) from the index
// while keeping the /questions hub indexable. Default true; set
// BLOCK_QUESTIONS_INDEXING=false (then rebuild) to also index question pages.
const blockQuestionsIndexing = process.env.BLOCK_QUESTIONS_INDEXING !== "false";
const scriptSrc = `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://mc.yandex.ru https://yastatic.net`;

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  },
  async redirects() {
    return [
      // Страница /generator/ удалена: генератор встроен в страницу документа.
      // 301 сохраняет старые внешние ссылки/закладки (?variant= переносится сам).
      {
        source: "/documents/:documentSlug/generator",
        destination: "/documents/:documentSlug/",
        permanent: true
      },
      {
        source: "/documents/:documentSlug/generator/",
        destination: "/documents/:documentSlug/",
        permanent: true
      },
      {
        source: "/how-rating-works/",
        destination: "/lawyers/",
        permanent: true
      },
      {
        source: "/for-lawyers/",
        destination: "/lawyer-cabinet/",
        permanent: false
      },
      {
        source: "/blog/:path*",
        destination: "/problems/",
        permanent: false
      },
      {
        source: "/calculators/:path*",
        destination: "/tools/",
        permanent: false
      },
      {
        source: "/cases/:path*",
        destination: "/problems/",
        permanent: false
      },
      {
        source: "/checklist/:path*",
        destination: "/documents/",
        permanent: false
      },
      {
        source: "/services/:path*",
        destination: "/problems/",
        permanent: false
      },
      {
        source: "/specializations/:path*",
        destination: "/lawyers/",
        permanent: false
      },
      {
        source: "/cities/:path*",
        destination: "/lawyers/",
        permanent: false
      },
      {
        source: "/video/:path*",
        destination: "/problems/",
        permanent: false
      },
      {
        source: "/reestr-advokatov/:path*",
        destination: "/lawyers/",
        permanent: false
      },
      {
        source: "/proverka-advokata/",
        destination: "/lawyers/",
        permanent: false
      },
      {
        source: "/yuristy/:path*",
        destination: "/lawyers/:path*",
        permanent: false
      }
    ];
  },
  async headers() {
    const securityHeaders = [
      {
        key: "Content-Security-Policy",
        value: `default-src 'self'; ${scriptSrc}; connect-src 'self' https://mc.yandex.ru https://*.mc.yandex.ru wss://mc.yandex.ru wss://*.mc.yandex.ru https://yastatic.net; img-src 'self' data: blob: https://mc.yandex.ru https://images.unsplash.com https://yastatic.net; style-src 'self' 'unsafe-inline' https://yastatic.net; font-src 'self' data:; frame-src https://mc.yandex.ru; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests`
      },
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" }
    ];

    return [
      {
        source: "/:path*",
        headers: securityHeaders
      },
      // Soft launch: hide individual question pages from the index, but keep the
      // /questions/ hub (landing page) indexable. ":slug+" matches one or more
      // segments after /questions/, so the hub itself (zero segments) stays open.
      ...(blockQuestionsIndexing
        ? [{ source: "/questions/:slug+", headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }] }]
        : []),
      {
        source: "/admin/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, private" }]
      },
      {
        source: "/lawyer-cabinet/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, private" }]
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, private" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" }
        ]
      }
    ];
  }
};

export default nextConfig;
