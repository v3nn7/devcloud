import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { db } from "../../config/db.js";
import { env } from "../../config/env.js";

function ensureUserFolder(userId) {
  const dir = path.join(env.uploadDir, userId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function createFileRecord({ userId, originalName, mimeType, size, folderPath = "/", buffer }) {
  const fileId = randomUUID();
  const ext = path.extname(originalName);
  const storedName = `${fileId}${ext}`;
  const userDir = ensureUserFolder(userId);
  const diskPath = path.join(userDir, storedName);

  fs.writeFileSync(diskPath, buffer);
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO files
      (id, user_id, name, original_name, mime_type, size, folder_path, disk_path, is_deleted, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
  ).run(fileId, userId, storedName, originalName, mimeType || null, size, folderPath, diskPath, now, now);

  return getFileById(fileId);
}

export function listFilesByUser(userId, folderPath = null) {
  if (folderPath) {
    return db
      .prepare(
        `SELECT id, name, original_name, mime_type, size, folder_path, created_at, updated_at
         FROM files WHERE user_id = ? AND is_deleted = 0 AND folder_path = ?
         ORDER BY created_at DESC`
      )
      .all(userId, folderPath);
  }

  return db
    .prepare(
      `SELECT id, name, original_name, mime_type, size, folder_path, created_at, updated_at
       FROM files WHERE user_id = ? AND is_deleted = 0
       ORDER BY created_at DESC`
    )
    .all(userId);
}

export function getFileById(fileId) {
  return (
    db
      .prepare(
        `SELECT id, user_id, name, original_name, mime_type, size, folder_path, disk_path, is_deleted, created_at, updated_at
         FROM files WHERE id = ?`
      )
      .get(fileId) || null
  );
}

export function renameFile(fileId, newOriginalName) {
  const now = new Date().toISOString();
  db.prepare("UPDATE files SET original_name = ?, updated_at = ? WHERE id = ?").run(
    newOriginalName,
    now,
    fileId
  );
  return getFileById(fileId);
}

export function softDeleteFile(fileId) {
  const now = new Date().toISOString();
  db.prepare("UPDATE files SET is_deleted = 1, updated_at = ? WHERE id = ?").run(now, fileId);
}

export function getStorageUsage(userId) {
  const row = db
    .prepare("SELECT COALESCE(SUM(size), 0) AS totalBytes FROM files WHERE user_id = ? AND is_deleted = 0")
    .get(userId);
  return row?.totalBytes || 0;
}
