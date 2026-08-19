import type { MetadataRoute } from "next";
import { APP_CONFIG } from "@/lib/utils/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_CONFIG.name,
    short_name: APP_CONFIG.name,
    description: APP_CONFIG.description,
    start_url: "/",
    display: "standalone",
    background_color: "#13201e",
    theme_color: "#38e1a6",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
