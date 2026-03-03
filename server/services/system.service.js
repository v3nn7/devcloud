import os from "node:os";

export function getSystemStats() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  return {
    cpu: {
      cores: os.cpus().length,
      loadAvg: os.loadavg()
    },
    memory: {
      total: totalMem,
      free: freeMem,
      used: usedMem,
      usagePercent: Number(((usedMem / totalMem) * 100).toFixed(2))
    },
    uptimeSeconds: os.uptime(),
    platform: os.platform()
  };
}
