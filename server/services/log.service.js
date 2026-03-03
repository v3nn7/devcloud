import { EventEmitter } from "node:events";

class LogStream extends EventEmitter {
  push(payload) {
    this.emit("log", {
      timestamp: new Date().toISOString(),
      ...payload
    });
  }
}

export const liveLogs = new LogStream();
