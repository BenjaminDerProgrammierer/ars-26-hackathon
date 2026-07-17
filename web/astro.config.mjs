// @ts-check
import react from "@astrojs/react";
import { defineConfig, fontProviders } from "astro/config";

const isDevelopment =
  Reflect.get(globalThis, "process").env.NODE_ENV === "development";

// https://astro.build/config
export default defineConfig({
  site: "https://benjaminderprogrammierer.github.io",
  // GitHub Pages serves production under the repository name. Keep local
  // development at the root URL documented in README.md.
  base: isDevelopment ? "/" : "/ars-26-hackathon",
  integrations: [react()],
  trailingSlash: "always",
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
