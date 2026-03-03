import fs from "node:fs";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";
import rateLimit from "@fastify/rate-limit";
import { env } from "./config/env.js";
import { authRoutes } from "./routes/auth.routes.js";
import { filesRoutes } from "./routes/files.routes.js";
import { mediaRoutes } from "./routes/media.routes.js";
import { devRoutes } from "./routes/dev.routes.js";
import { dashboardRoutes } from "./routes/dashboard.routes.js";
import { logsSocketRoute } from "./sockets/logs.socket.js";
import { loadRuntimePlugins } from "./services/plugin-loader.service.js";
import { liveLogs } from "./services/log.service.js";

if (!fs.existsSync(env.uploadDir)) {
  fs.mkdirSync(env.uploadDir, { recursive: true });
}

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: (origin, callback) => {
    // Allow server-to-server calls and CLI tools without an origin header.
    if (!origin || env.corsOrigin.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("CORS origin denied"));
  },
  credentials: true
});

await app.register(rateLimit, {
  max: 120,
  timeWindow: "1 minute"
});

await app.register(jwt, {
  secret: env.jwtAccessSecret
});

await app.register(websocket);

app.addHook("onResponse", async (request, reply) => {
  liveLogs.push({
    level: "info",
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode
  });
});

await app.register(async (api) => {
  api.get("/health", async () => ({ ok: true, service: "devcloud-server" }));
  await api.register(authRoutes, { prefix: "/api" });
  await api.register(filesRoutes, { prefix: "/api" });
  await api.register(mediaRoutes, { prefix: "/api" });
  await api.register(devRoutes, { prefix: "/api" });
  await api.register(dashboardRoutes, { prefix: "/api" });
  await api.register(logsSocketRoute, { prefix: "/api" });
});

const loadedPlugins = await loadRuntimePlugins(app);
if (loadedPlugins.length > 0) {
  app.log.info({ loadedPlugins }, "Runtime plugins loaded");
}

try {
  await app.listen({ port: env.port, host: "0.0.0.0" });
  app.log.info(`DevCloud API running on :${env.port}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
