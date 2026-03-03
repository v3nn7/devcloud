import { randomUUID } from "node:crypto";
import { db } from "../../config/db.js";
import { env } from "../../config/env.js";

export function createShareLink({ fileId, createdBy }) {
  const token = randomUUID().replace(/-/g, "");
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + env.tempLinkTtlMinutes * 60 * 1000).toISOString();
  const createdAt = new Date().toISOString();

  db.prepare(
    `INSERT INTO share_links (id, file_id, token, expires_at, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, fileId, token, expiresAt, createdBy, createdAt);

  return { token, expiresAt };
}

export function validateShareToken(token) {
  const row = db
    .prepare(
      `SELECT s.*, f.disk_path, f.original_name, f.mime_type
       FROM share_links s
       JOIN files f ON f.id = s.file_id
       WHERE s.token = ? AND f.is_deleted = 0`
    )
    .get(token);

  if (!row) {
    return null;
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    return null;
  }

  return row;
}
