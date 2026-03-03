import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { getDockerContainers } from "../services/docker.service.js";
import { getGitStatus } from "../services/git.service.js";
import { getSystemStats } from "../services/system.service.js";

export async function devRoutes(fastify) {
  const devOnly = [requireAuth, requireRole(["admin", "dev"])];

  fastify.get("/dev/system-stats", { preHandler: devOnly }, async () => {
    return getSystemStats();
  });

  fastify.get("/dev/docker/containers", { preHandler: devOnly }, async () => {
    const containers = await getDockerContainers();
    return { containers };
  });

  fastify.get("/dev/git-status", { preHandler: devOnly }, async () => {
    const files = await getGitStatus(process.cwd());
    return { files };
  });
}
