export type ServerConfig = {
  host: string;
  port: number;
};

export function readServerConfig(environment: NodeJS.ProcessEnv = process.env): ServerConfig {
  const host = environment.HOST?.trim() || "127.0.0.1";
  const portValue = environment.PORT?.trim() || "3000";

  if (!/^\d+$/.test(portValue)) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  const port = Number(portValue);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  return { host, port };
}
