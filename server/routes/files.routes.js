import fs from "node:fs";
import multipart from "@fastify/multipart";
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

export async function filesRoutes(fastify) {
  await fastify.register(multipart);

  const streamToBuffer = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  };

  fastify.post(
    "/files/upload",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const file = await request.file();
      if (!file) {
        return reply.code(400).send({ message: "File is required" });
      }

      const fileBuffer = await streamToBuffer(file.file);
      const folderPath = request.body?.folderPath || "/";
      const result = createFileRecord({
        userId: request.user.sub,
        originalName: file.filename,
        mimeType: file.mimetype,
        size: fileBuffer.length,
        folderPath,
        buffer: fileBuffer
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
