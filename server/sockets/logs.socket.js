import { liveLogs } from "../services/log.service.js";

export async function logsSocketRoute(fastify) {
  fastify.get("/ws/logs", { websocket: true }, (connection, req) => {
    let token = null;
    const queryToken = req.url?.match(/token=([^&]+)/)?.[1];
    if (queryToken) {
      token = decodeURIComponent(queryToken);
    }

    const authHeader = req.headers?.authorization;
    if (!token && authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    if (!token) {
      connection.socket.send(JSON.stringify({ type: "error", message: "Missing auth token" }));
      connection.socket.close();
      return;
    }

    try {
      const decoded = fastify.jwt.verify(token);
      req.user = { sub: decoded.sub, role: decoded.role };
    } catch {
      connection.socket.send(JSON.stringify({ type: "error", message: "Unauthorized websocket access" }));
      connection.socket.close();
      return;
    }

    const user = req.user || null;
    if (!user) {
      connection.socket.send(JSON.stringify({ type: "error", message: "Unauthorized" }));
      connection.socket.close();
      return;
    }

    const onLog = (payload) => {
      connection.socket.send(JSON.stringify({ type: "log", payload }));
    };

    liveLogs.on("log", onLog);
    connection.socket.send(JSON.stringify({ type: "connected", message: "Live logs stream active" }));

    connection.socket.on("close", () => {
      liveLogs.off("log", onLog);
    });
  });
}
