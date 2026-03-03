import fs from "node:fs";
import ffmpeg from "fluent-ffmpeg";
import { env } from "../../config/env.js";

export function streamVideoWithRange({ reply, filePath, mimeType, rangeHeader }) {
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;

  if (!rangeHeader) {
    reply
      .header("Content-Type", mimeType || "video/mp4")
      .header("Content-Length", fileSize)
      .send(fs.createReadStream(filePath));
    return;
  }

  const [startRaw, endRaw] = rangeHeader.replace("bytes=", "").split("-");
  const start = Number(startRaw);
  const end = endRaw ? Number(endRaw) : fileSize - 1;
  const chunkSize = end - start + 1;
  const stream = fs.createReadStream(filePath, { start, end });

  reply
    .code(206)
    .header("Content-Range", `bytes ${start}-${end}/${fileSize}`)
    .header("Accept-Ranges", "bytes")
    .header("Content-Length", chunkSize)
    .header("Content-Type", mimeType || "video/mp4")
    .send(stream);
}

export function transcodeToHls(inputPath, outputPath) {
  if (!env.ffmpegEnabled) {
    throw new Error("FFmpeg transcoding is disabled");
  }

  return new Promise((resolve, reject) => {
    // This is intentionally basic and can be replaced by queue workers in v1.0.
    ffmpeg(inputPath)
      .outputOptions([
        "-preset veryfast",
        "-g 48",
        "-sc_threshold 0",
        "-hls_time 6",
        "-hls_playlist_type vod"
      ])
      .output(outputPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
}
