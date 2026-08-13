import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PITCH / ONE",
    short_name: "PITCH / ONE",
    description: "サッカー選手キャリアゲーム",
    start_url: "/",
    display: "standalone",
    orientation: "landscape",
    background_color: "#050a09",
    theme_color: "#050a09",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
  };
}
