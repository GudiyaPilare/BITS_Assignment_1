import http from "node:http";
import { createApp } from "../src/app.js";

export async function startTestServer() {
  const app = createApp();
  const server = http.createServer(app.handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    store: app.store,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
}

export async function request(baseUrl, method, path, body, contentType = "application/json") {
  const headers = {};
  if (contentType !== null) headers["content-type"] = contentType;
  const hasBody = body !== undefined;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: hasBody ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
  });
  const text = await response.text();
  return {
    status: response.status,
    body: text ? JSON.parse(text) : null,
  };
}
