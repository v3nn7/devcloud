import fs from "node:fs";
import path from "node:path";
import { requireAuth } from "../middleware/auth.js";
import { getFileById } from "../modules/files/files.service.js";
import { streamVideoWithRange, transcodeToHls } from "../modules/media/media.service.js";

export async function mediaRoutes(fastify) {
  fastify.get("/media/video/:fileId", { preHandler: [requireAuth] }, async (request, reply) => {
    const { fileId } = request.params;
    const file = getFileById(fileId);
    if (!file || file.is_deleted) {
      return reply.code(404).send({ message: "Video file not found" });
    }
    if (file.user_id !== request.user.sub && request.user.role === "viewer") {
      return reply.code(403).send({ message: "Forbidden" });
    }
    if (!fs.existsSync(file.disk_path)) {
      return reply.code(404).send({ message: "Video file missing on disk" });
    }

    return streamVideoWithRange({
      reply,
      filePath: file.disk_path,
      mimeType: file.mime_type || "video/mp4",
      rangeHeader: request.headers.range
    });
  });

  fastify.post("/media/video/:fileId/transcode", { preHandler: [requireAuth] }, async (request, reply) => {
    if (!["admin", "dev"].includes(request.user.role)) {
      return reply.code(403).send({ message: "Forbidden" });
    }

    const { fileId } = request.params;
    const file = getFileById(fileId);
    if (!file || file.is_deleted) {
      return reply.code(404).send({ message: "Video file not found" });
    }
    if (!fs.existsSync(file.disk_path)) {
      return reply.code(404).send({ message: "Video file missing on disk" });
    }

    const outputPath = path.join(path.dirname(file.disk_path), `${file.id}.m3u8`);
    try {
      await transcodeToHls(file.disk_path, outputPath);
      return reply.send({ message: "Transcoding completed", outputPath });
    } catch (error) {
      return reply.code(500).send({ message: "Transcoding failed", details: error.message });
    }
  });
}
