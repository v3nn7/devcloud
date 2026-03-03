import fs from "node:fs";
import path from "node:path";
import { liveLogs } from "./log.service.js";

export async function loadRuntimePlugins(fastify) {
  const pluginsDir = path.resolve(process.cwd(), "plugins");
  if (!fs.existsSync(pluginsDir)) {
    return [];
  }

  const entries = fs.readdirSync(pluginsDir).filter((entry) => entry.endsWith(".js"));
  const loaded = [];

  for (const file of entries) {
    const fullPath = path.join(pluginsDir, file);
    try {
      const module = await import(`file://${fullPath}`);
      if (typeof module.default === "function") {
        await module.default(fastify);
        loaded.push(file);
      }
    } catch (error) {
      liveLogs.push({ level: "error", message: `Plugin load failed: ${file}`, error: error.message });
    }
  }

  return loaded;
}
