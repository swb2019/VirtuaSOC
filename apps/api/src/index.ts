import { createApp } from "./server.js";
import { getConfig } from "./config.js";

const config = getConfig();
const app = await createApp();

await app.listen({ port: config.port, host: config.host });
