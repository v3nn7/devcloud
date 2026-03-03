import { requireAuth } from "../middleware/auth.js";
import { getDashboardData } from "../modules/dashboard/dashboard.service.js";

export async function dashboardRoutes(fastify) {
  fastify.get("/dashboard/overview", { preHandler: [requireAuth] }, async (request) => {
    return getDashboardData(request.user.sub);
  });
}
