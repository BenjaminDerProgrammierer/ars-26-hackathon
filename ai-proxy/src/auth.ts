import { betterAuth } from "better-auth";
import { config } from "./config.js";
import { db } from "./runtime.js";

export const auth = betterAuth({
  appName: "Ars Hackathon AI Proxy",
  baseURL: config.baseUrl,
  basePath: "/api/auth",
  secret: config.authSecret,
  database: db,
  trustedOrigins: [config.baseUrl],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  advanced: {
    useSecureCookies: config.nodeEnv === "production",
  },
});
