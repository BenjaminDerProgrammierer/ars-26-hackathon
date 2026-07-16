import { assertProductionConfig, config } from "./config.js";
import { createApp } from "./app.js";

assertProductionConfig();
const app = createApp();

app.listen(config.port, () => {
  console.log(`AI proxy listening at ${config.baseUrl}`);
  if (!config.openRouterApiKey) {
    console.warn("OPENROUTER_API_KEY is not set; model requests will return 503.");
  }
});
