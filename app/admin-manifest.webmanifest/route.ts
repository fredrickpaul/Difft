export async function GET() {
  const manifest = {
    id: "/admin",
    name: "DIFFT Admin",
    short_name: "Difft Admin",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    background_color: "#f5f6fb",
    theme_color: "#0f5c5c",
    icons: [
      { src: "/admin-icon?s=192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/admin-icon?s=512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/admin-icon?s=512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
