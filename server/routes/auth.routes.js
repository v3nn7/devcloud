import { createSession } from "../services/session.service.js";
import { issueTokens, revokeRefreshToken, validateRefreshToken } from "../services/token.service.js";
import { getUserById, loginUser, registerUser } from "../modules/auth/auth.service.js";
import { requireAuth } from "../middleware/auth.js";
import { env } from "../config/env.js";

const allowedRoles = new Set(["admin", "dev", "viewer"]);

export async function authRoutes(fastify) {
  fastify.post("/auth/register", async (request, reply) => {
    const { email, password, role = "viewer" } = request.body || {};

    if (!email || !password) {
      return reply.code(400).send({ message: "Email and password are required" });
    }
    if (!allowedRoles.has(role)) {
      return reply.code(400).send({ message: "Invalid role" });
    }

    try {
      const user = await registerUser({ email, password, role });
      const tokens = await issueTokens(fastify, user);
      createSession({
        userId: user.id,
        userAgent: request.headers["user-agent"],
        ipAddress: request.ip
      });
      return reply.code(201).send({ user, ...tokens });
    } catch (error) {
      return reply.code(409).send({ message: error.message });
    }
  });

  fastify.post("/auth/login", async (request, reply) => {
    const { email, password } = request.body || {};
    if (!email || !password) {
      return reply.code(400).send({ message: "Email and password are required" });
    }

    const user = await loginUser({ email, password });
    if (!user) {
      return reply.code(401).send({ message: "Invalid credentials" });
    }

    const tokens = await issueTokens(fastify, user);
    createSession({
      userId: user.id,
      userAgent: request.headers["user-agent"],
      ipAddress: request.ip
    });

    return reply.send({ user, ...tokens });
  });

  fastify.post("/auth/refresh", async (request, reply) => {
    const { refreshToken } = request.body || {};
    if (!refreshToken) {
      return reply.code(400).send({ message: "Refresh token is required" });
    }

    const savedToken = validateRefreshToken(refreshToken);
    if (!savedToken) {
      return reply.code(401).send({ message: "Invalid refresh token" });
    }

    let decoded;
    try {
      decoded = await fastify.jwt.verify(refreshToken, { secret: env.jwtRefreshSecret });
    } catch {
      revokeRefreshToken(refreshToken);
      return reply.code(401).send({ message: "Invalid refresh token signature" });
    }

    const user = getUserById(decoded.sub);
    if (!user) {
      return reply.code(404).send({ message: "User not found" });
    }

    revokeRefreshToken(refreshToken);
    const tokens = await issueTokens(fastify, user);
    return reply.send({ user, ...tokens });
  });

  fastify.post("/auth/logout", async (request, reply) => {
    const { refreshToken } = request.body || {};
    if (refreshToken) {
      revokeRefreshToken(refreshToken);
    }
    return reply.send({ message: "Logged out" });
  });

  fastify.get("/auth/me", { preHandler: [requireAuth] }, async (request, reply) => {
    const user = getUserById(request.user.sub);
    if (!user) {
      return reply.code(404).send({ message: "User not found" });
    }
    return reply.send({ user });
  });
}
