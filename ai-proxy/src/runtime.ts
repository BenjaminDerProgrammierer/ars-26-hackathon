import { config } from "./config.js";
import { createDatabase } from "./db.js";

export const db = createDatabase(config.databasePath);
