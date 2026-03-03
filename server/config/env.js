import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  port: toNumber(process.env.PORT, 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "change-me-access",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "change-me-refresh",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  corsOrigin: (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  dbPath: process.env.DB_PATH || "./db/devcloud.db",
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads"),
  tempLinkTtlMinutes: toNumber(process.env.TEMP_LINK_TTL_MINUTES, 60),
  ffmpegEnabled: String(process.env.FFMPEG_ENABLED || "true").toLowerCase() === "true",
  dockerHost: process.env.DOCKER_HOST || "unix:///var/run/docker.sock"
};
