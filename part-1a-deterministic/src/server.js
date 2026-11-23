import http from "node:http";
import { createApp } from "./app.js";

export function startServer({ port = 3000, host = "127.0.0.1", store } = {}) {
  const app = createApp(store);
  const server = http.createServer(app.handler);
  if (process.argv[1] && process.argv[1].endsWith("/src/server.js")) {
    server.listen(port, host, () => {
      console.log(`Task API listening on http://${host}:${port}`);
    });
  }
  return server;
}

if (process.argv[1] && process.argv[1].endsWith("/src/server.js")) {
  startServer();
}
