import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "El rincón de Janny",
    short_name: "Mi rincón",
    description: "Janny, hice esto pensando en ti. — Gela",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#faf7ef",
    theme_color: "#faf7ef",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
