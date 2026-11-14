import type { MetadataRoute } from "next";

const SITE = "https://difft.vercel.app"; // change to your own domain later

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/order", "/login", "/support"].map((p) => ({
    url: `${SITE}${p}`,
    lastModified: new Date(),
  }));
}
