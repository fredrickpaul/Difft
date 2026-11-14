import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DIFFT Social Growth",
    short_name: "DIFFT",
    description: "Social media growth services for Kenya. Pay with M-Pesa.",
    start_url: "/order",
    display: "standalone",
    background_color: "#f5f6fb",
    theme_color: "#4f46e5",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
