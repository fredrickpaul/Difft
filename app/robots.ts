import type { MetadataRoute } from "next";

const SITE = "https://difft.vercel.app"; // change to your own domain later

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/add-funds", "/orders", "/profile", "/notifications"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
