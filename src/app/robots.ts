import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const host = siteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/login",
        "/logout",
        "/register",
        "/account/",
        "/lk",
        "/lawyer-cabinet/",
        "/admin",
        "/api",
        "/debug",
        "/dev",
        "/__dev",
        "/fallback",
        "/leads",
        "/chat",
        "/payment",
        "/test",
        "/__test",
        "/uploads/private",
        "/*?sort=",
        "/*?filter=",
        "/*?city=",
        "/*?service=",
        "/*?price=",
        "/*?online=",
        "/*?rating=",
        "/*?page=",
        "/*?utm_",
        "/*dev-city-lawyer"
      ]
    },
    sitemap: `${host}/sitemap.xml`
  };
}
