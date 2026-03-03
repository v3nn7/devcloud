import { randomUUID } from "node:crypto";
import { db } from "../config/db.js";
import { env } from "../config/env.js";

function parseExpiresToDate(value) {
  const now = Date.now();
  const unit = value.slice(-1);
  const amount = Number(value.slice(0, -1));

  if (!Number.isFinite(amount)) {
    return new Date(now + 7 * 24 * 60 * 60 * 1000);
  }

  switch (unit) {
    case "m":
      return new Date(now + amount * 60 * 1000);
    case "h":
      return new Date(now + amount * 60 * 60 * 1000);
    case "d":
      return new Date(now + amount * 24 * 60 * 60 * 1000);
    default:
      return new Date(now + 7 * 24 * 60 * 60 * 1000);
  }
}

export async function issueTokens(fastify, user) {
  const accessToken = await fastify.jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    { expiresIn: env.jwtAccessExpiresIn, secret: env.jwtAccessSecret }
  );

  const refreshToken = await fastify.jwt.sign(
    { sub: user.id, role: user.role },
    { expiresIn: env.jwtRefreshExpiresIn, secret: env.jwtRefreshSecret }
  );

  const expiresAt = parseExpiresToDate(env.jwtRefreshExpiresIn).toISOString();
  db.prepare(
    `INSERT INTO refresh_tokens (id, user_id, token, expires_at, revoked, created_at)
     VALUES (?, ?, ?, ?, 0, ?)`
  ).run(randomUUID(), user.id, refreshToken, expiresAt, new Date().toISOString());

  return { accessToken, refreshToken };
}

export function revokeRefreshToken(token) {
  db.prepare("UPDATE refresh_tokens SET revoked = 1 WHERE token = ?").run(token);
}

export function validateRefreshToken(token) {
  const tokenRow = db
    .prepare("SELECT * FROM refresh_tokens WHERE token = ? AND revoked = 0")
    .get(token);

  if (!tokenRow) {
    return null;
  }

  if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
    revokeRefreshToken(token);
    return null;
  }

  return tokenRow;
}
