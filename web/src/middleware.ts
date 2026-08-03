import { defineMiddleware } from "astro:middleware";

/** Keep locale routing explicit so the root browser-language page can render. */
export const onRequest = defineMiddleware((_context, next) => next());
