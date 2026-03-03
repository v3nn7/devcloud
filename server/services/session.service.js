import { randomUUID } from "node:crypto";
import { db } from "../config/db.js";

export function createSession({ userId, userAgent, ipAddress }) {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO sessions (id, user_id, user_agent, ip_address, last_seen_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(randomUUID(), userId, userAgent || null, ipAddress || null, now, now);
}

export function updateSessionHeartbeat({ userId, userAgent, ipAddress }) {
  db.prepare(
    `UPDATE sessions
     SET last_seen_at = ?
     WHERE user_id = ? AND user_agent = ? AND ip_address = ?`
  ).run(new Date().toISOString(), userId, userAgent || null, ipAddress || null);
}

export function getActiveSessionsCount(minutesWindow = 30) {
  const threshold = new Date(Date.now() - minutesWindow * 60 * 1000).toISOString();
  const result = db
    .prepare("SELECT COUNT(*) AS count FROM sessions WHERE last_seen_at >= ?")
    .get(threshold);
  return result?.count || 0;
}
