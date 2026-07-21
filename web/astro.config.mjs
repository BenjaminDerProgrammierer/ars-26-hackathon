// @ts-check

import node from "@astrojs/node";
import react from "@astrojs/react";
import { defineConfig, fontProviders } from "astro/config";

const productionSite = "https://arselectronicahackathon-web.azurewebsites.net";

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || productionSite,
  base: "/",
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
