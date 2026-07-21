// @ts-check

import node from "@astrojs/node";
import react from "@astrojs/react";
import { defineConfig, fontProviders } from "astro/config";

const isPagesPreview = process.env.DEPLOY_TARGET === "github-pages";
const productionSite = "https://arselectronicahackathon-web.azurewebsites.net";

// https://astro.build/config
export default defineConfig({
  site:
    process.env.SITE_URL ||
    (isPagesPreview
      ? "https://benjaminderprogrammierer.github.io"
      : productionSite),
  base: isPagesPreview ? "/ars-26-hackathon" : "/",
  adapter: node({ mode: "standalone" }),
  integrations: [react()],
  trailingSlash: "always",
  security: {
    allowedDomains: [
      {
        hostname: "arselectronicahackathon-web.azurewebsites.net",
        protocol: "https",
      },
    ],
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "de"],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: true,
    },
  },
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "IBM Plex Sans",
      cssVariable: "--font-plex",
      weights: [400, 500, 600, 700],
      styles: ["normal", "italic"],
      subsets: ["latin", "latin-ext"],
      fallbacks: ["sans-serif"],
    },
  ],
});
