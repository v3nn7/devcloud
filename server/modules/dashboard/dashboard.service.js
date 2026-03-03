import { getActiveSessionsCount } from "../../services/session.service.js";
import { getSystemStats } from "../../services/system.service.js";
import { getStorageUsage } from "../files/files.service.js";

export function getDashboardData(userId) {
  return {
    storage: {
      usedBytes: getStorageUsage(userId)
    },
    activeSessions: getActiveSessionsCount(30),
    system: getSystemStats()
  };
}
