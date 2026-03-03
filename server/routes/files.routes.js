import fs from "node:fs";
import multer from "fastify-multer";
import { requireAuth } from "../middleware/auth.js";
import { requireConfirmation } from "../middleware/confirm-action.js";
import {
  createFileRecord,
  getFileById,
  listFilesByUser,
  renameFile,
  softDeleteFile
} from "../modules/files/files.service.js";
import { createShareLink, validateShareToken } from "../modules/files/share.service.js";
import { liveLogs } from "../services/log.service.js";

const upload = multer({ storage: multer.memoryStorage() });

export async function filesRoutes(fastify) {
  fastify.register(multer.contentParser);

  fastify.post(
    "/files/upload",
    { preHandler: [requireAuth, upload.single("file")] },
    async (request, reply) => {
      const file = request.file;
      if (!file) {
        return reply.code(400).send({ message: "File is required" });
      }

      const folderPath = request.body?.folderPath || "/";
      const result = createFileRecord({
        userId: request.user.sub,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        folderPath,
        buffer: file.buffer
      });

      liveLogs.push({ level: "info", message: `File uploaded: ${result.original_name}` });
      return reply.code(201).send({ file: result });
    }
  );

  fastify.get("/files", { preHandler: [requireAuth] }, async (request) => {
    const folderPath = request.query?.folderPath || null;
    const files = listFilesByUser(request.user.sub, folderPath);
    return { files };
  });

  fastify.patch(
    "/files/:fileId/rename",
    { preHandler: [requireAuth, requireConfirmation("RENAME_FILE")] },
    async (request, reply) => {
      const { fileId } = request.params;
      const { newName } = request.body || {};
      if (!newName) {
        return reply.code(400).send({ message: "newName is required" });
      }

      const file = getFileById(fileId);
      if (!file || file.user_id !== request.user.sub || file.is_deleted) {
        return reply.code(404).send({ message: "File not found" });
      }

      const updated = renameFile(fileId, newName);
      liveLogs.push({ level: "warn", message: `File renamed: ${file.original_name} -> ${newName}` });
      return { file: updated };
    }
  );

  fastify.delete(
    "/files/:fileId",
    { preHandler: [requireAuth, requireConfirmation("DELETE_FILE")] },
    async (request, reply) => {
      const { fileId } = request.params;
      const file = getFileById(fileId);
      if (!file || file.user_id !== request.user.sub || file.is_deleted) {
        return reply.code(404).send({ message: "File not found" });
      }

      softDeleteFile(fileId);
      liveLogs.push({ level: "warn", message: `File deleted: ${file.original_name}` });
      return { message: "File deleted" };
    }
  );

  fastify.post("/files/:fileId/share", { preHandler: [requireAuth] }, async (request, reply) => {
    const { fileId } = request.params;
    const file = getFileById(fileId);
    if (!file || file.user_id !== request.user.sub || file.is_deleted) {
      return reply.code(404).send({ message: "File not found" });
    }

    const share = createShareLink({ fileId, createdBy: request.user.sub });
    return {
      token: share.token,
      expiresAt: share.expiresAt,
      url: `/api/files/shared/${share.token}`
    };
  });

  fastify.get("/files/shared/:token", async (request, reply) => {
    const { token } = request.params;
    const share = validateShareToken(token);
    if (!share) {
      return reply.code(404).send({ message: "Invalid or expired share link" });
    }
    if (!fs.existsSync(share.disk_path)) {
      return reply.code(404).send({ message: "File does not exist on disk" });
    }

    reply
      .header("Content-Type", share.mime_type || "application/octet-stream")
      .header("Content-Disposition", `inline; filename="${share.original_name}"`)
      .send(fs.createReadStream(share.disk_path));
  });
}
