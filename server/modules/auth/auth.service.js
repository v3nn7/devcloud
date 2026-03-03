import { randomUUID } from "node:crypto";
import { db } from "../../config/db.js";
import { hashPassword, verifyPassword } from "../../services/hash.service.js";

export async function registerUser({ email, password, role }) {
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    throw new Error("Email already in use");
  }

  const passwordHash = await hashPassword(password);
  const user = {
    id: randomUUID(),
    email,
    role,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  db.prepare(
    `INSERT INTO users (id, email, password_hash, role, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(user.id, user.email, user.passwordHash, user.role, user.createdAt);

  return { id: user.id, email: user.email, role: user.role };
}

export async function loginUser({ email, password }) {
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) {
    return null;
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return null;
  }

  return { id: user.id, email: user.email, role: user.role };
}

export function getUserById(userId) {
  const user = db.prepare("SELECT id, email, role, created_at FROM users WHERE id = ?").get(userId);
  return user || null;
}
