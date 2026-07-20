import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import express, { type ErrorRequestHandler } from "express";
import { readServerConfig } from "./config.js";
import apiRouter from "./routes/api.js";

const PUBLIC_DIRECTORY = fileURLToPath(new URL("../public", import.meta.url));
const LUCIDE_SCRIPT = fileURLToPath(
  new URL("../node_modules/lucide/dist/umd/lucide.min.js", import.meta.url),
);
const ENV_FILE = fileURLToPath(new URL("../.env", import.meta.url));

if (existsSync(ENV_FILE)) {
  process.loadEnvFile(ENV_FILE);
}

const { host, port } = readServerConfig();
const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "256kb" }));
app.use("/api", apiRouter);
app.get("/vendor/lucide.js", (_request, response) => {
  response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  response.sendFile(LUCIDE_SCRIPT);
});
app.use(express.static(PUBLIC_DIRECTORY));

app.use((_request, response) => {
  response.status(404).json({ error: "Not found" });
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const statusCode =
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
      ? error.statusCode
      : 500;
  const message = error instanceof Error ? error.message : String(error);

  console.error(`[${statusCode}] ${message}`);
  response.status(statusCode).json({ error: message });
};
app.use(errorHandler);

app.listen(port, host, () => {
  console.log(`OpenRouter Key Manager listening on http://${host}:${port}`);
});
