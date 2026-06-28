import { createApp } from "./app";
import { getEnv } from "./config/env";

const env = getEnv();
const app = createApp(env).listen(env.port);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
