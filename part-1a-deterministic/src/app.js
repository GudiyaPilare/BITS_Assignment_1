import { randomUUID } from "node:crypto";
import { detail, sendJson } from "./errors.js";
import { TaskStore } from "./task-store.js";
import {
  isPlainObject,
  isUuidV4,
  normalizeTitle,
  validateDescription,
  validateDueDate,
  validatePriority,
  validateStatus,
  validateTitle,
} from "./validation.js";

export function createApp(initialStore) {
  const store = initialStore ?? new TaskStore();

  function json(response, status, body) {
    response.statusCode = status;
    response.setHeader("Content-Type", "application/json");
    response.end(status === 204 ? undefined : JSON.stringify(body));
  }

  function knownRoute(method, pathname) {
    if (/^\/tasks(?:\/[^/]+)?(?:\/status)?$/.test(pathname)) return true;
    return pathname === "/tasks";
  }

  async function readJson(request, response) {
    const type = request.headers["content-type"];
    if (!type || type.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
      sendJson(response, 415, "VALIDATION_ERROR", "Unsupported or missing Content-Type", [detail("request", "CONTENT_TYPE", "Content-Type must be application/json")]);
      return null;
    }

    const chunks = [];
    let bytes = 0;
    for await (const chunk of request) {
      bytes += chunk.length;
      if (bytes > 64 * 1024) {
        sendJson(response, 413, "VALIDATION_ERROR", "Request body is too large", [detail("request", "BODY_SIZE", "Request body must not exceed 64 KiB")]);
        return null;
      }
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    let text;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    } catch {
      sendJson(response, 400, "MALFORMED_REQUEST", "Malformed JSON", [detail("request", "UTF8", "Request body must contain valid UTF-8 JSON")]);
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      sendJson(response, 400, "MALFORMED_REQUEST", "Malformed JSON", [detail("request", "JSON", "Request body must contain valid JSON")]);
      return null;
    }
  }

  function validateCreate(body) {
    const details = [];
    if (!isPlainObject(body)) {
      return [detail("request", "OBJECT", "Request body must be a JSON object")];
    }
    const allowed = new Set(["title", "description", "priority", "dueDate"]);
    for (const key of Object.keys(body)) {
      if (!allowed.has(key)) details.push(detail(key, "UNKNOWN_FIELD", `Unknown field: ${key}`));
    }
    if (!Object.hasOwn(body, "title")) details.push(detail("title", "REQUIRED", "Title is required"));
    const titleError = validateTitle(body.title, true);
    if (titleError) details.push(detail("title", "TITLE", titleError));
    if (Object.hasOwn(body, "description")) {
      const error = validateDescription(body.description, false);
      if (error) details.push(detail("description", "DESCRIPTION", error));
    }
    if (Object.hasOwn(body, "priority")) {
      const error = validatePriority(body.priority);
      if (error) details.push(detail("priority", "PRIORITY", error));
    }
    if (Object.hasOwn(body, "dueDate")) {
      const error = validateDueDate(body.dueDate, false);
      if (error) details.push(detail("dueDate", "DUE_DATE", error));
    }
    return details;
  }

  function validateUpdate(body) {
    if (!isPlainObject(body)) return [detail("request", "OBJECT", "Request body must be a JSON object")];
    const allowed = new Set(["title", "description", "priority", "dueDate"]);
    const details = [];
    for (const key of Object.keys(body)) {
      if (!allowed.has(key)) details.push(detail(key, "UNKNOWN_FIELD", `Unknown field: ${key}`));
    }
    if (Object.keys(body).length === 0) details.push(detail("request", "EMPTY_UPDATE", "Update body must contain at least one mutable field"));
    if (Object.hasOwn(body, "title")) {
      const error = validateTitle(body.title, false);
      if (error) details.push(detail("title", "TITLE", error));
    }
    if (Object.hasOwn(body, "description")) {
      const error = validateDescription(body.description, true);
      if (error) details.push(detail("description", "DESCRIPTION", error));
    }
    if (Object.hasOwn(body, "priority")) {
      const error = validatePriority(body.priority);
      if (error) details.push(detail("priority", "PRIORITY", error));
    }
    if (Object.hasOwn(body, "dueDate")) {
      const error = validateDueDate(body.dueDate, true);
      if (error) details.push(detail("dueDate", "DUE_DATE", error));
    }
    return details;
  }

  async function handler(request, response) {
    try {
      const url = new URL(request.url, "http://localhost");
      const parts = url.pathname.split("/").filter(Boolean);

      if (parts[0] !== "tasks") {
        sendJson(response, 404, "ROUTE_NOT_FOUND", "Route not found", [detail("request", "ROUTE", "Unknown API route")]);
        return;
      }

      if (parts.length === 1 && url.pathname === "/tasks") {
        if (request.method === "GET") return json(response, 200, store.list());
        if (request.method === "POST") {
          const body = await readJson(request, response);
          if (body === null) return;
          const details = validateCreate(body);
          if (details.length) return sendJson(response, 400, "VALIDATION_ERROR", "Validation failed", details);
          const normalized = { ...body, title: normalizeTitle(body.title) };
          return json(response, 201, store.create(normalized));
        }
        sendJson(response, 405, "METHOD_NOT_ALLOWED", "Method not allowed", [detail("request", "METHOD", "Unsupported HTTP method for this route")]);
        return;
      }

      if (parts.length === 2 && parts[0] === "tasks") {
        const id = parts[1];
        if (!isUuidV4(id)) {
          sendJson(response, 400, "VALIDATION_ERROR", "Malformed task ID", [detail("id", "UUID_V4", "Task ID must be a canonical UUID v4")]);
          return;
        }
        if (request.method === "GET") {
          const task = store.get(id);
          if (!task) sendJson(response, 404, "NOT_FOUND", "Task not found", [detail("id", "NOT_FOUND", "Task ID was not found")]);
          else json(response, 200, task);
          return;
        }
        if (request.method === "DELETE") {
          if (!store.delete(id)) sendJson(response, 404, "NOT_FOUND", "Task not found", [detail("id", "NOT_FOUND", "Task ID was not found")]);
          else json(response, 204);
          return;
        }
        if (request.method === "PATCH") {
          const body = await readJson(request, response);
          if (body === null) return;
          const details = validateUpdate(body);
          if (details.length) return sendJson(response, 400, "VALIDATION_ERROR", "Validation failed", details);
          const changes = { ...body };
          if (Object.hasOwn(changes, "title")) changes.title = normalizeTitle(changes.title);
          const task = store.update(id, changes);
          if (!task) sendJson(response, 404, "NOT_FOUND", "Task not found", [detail("id", "NOT_FOUND", "Task ID was not found")]);
          else json(response, 200, task);
          return;
        }
        sendJson(response, 405, "METHOD_NOT_ALLOWED", "Method not allowed", [detail("request", "METHOD", "Unsupported HTTP method for this route")]);
        return;
      }

      if (parts.length === 3 && parts[0] === "tasks" && parts[2] === "status") {
        const id = parts[1];
        if (!isUuidV4(id)) {
          sendJson(response, 400, "VALIDATION_ERROR", "Malformed task ID", [detail("id", "UUID_V4", "Task ID must be a canonical UUID v4")]);
          return;
        }
        if (request.method !== "PATCH") {
          sendJson(response, 405, "METHOD_NOT_ALLOWED", "Method not allowed", [detail("request", "METHOD", "Unsupported HTTP method for this route")]);
          return;
        }
        const body = await readJson(request, response);
        if (body === null) return;
        if (!isPlainObject(body) || Object.keys(body).length !== 1 || !Object.hasOwn(body, "status")) {
          sendJson(response, 400, "VALIDATION_ERROR", "Invalid status request", [detail("status", "STATUS_OBJECT", "Status body must contain exactly one status field")]);
          return;
        }
        const statusError = validateStatus(body.status);
        if (statusError) {
          sendJson(response, 400, "VALIDATION_ERROR", "Validation failed", [detail("status", "STATUS", statusError)]);
          return;
        }
        const task = store.setStatus(id, body.status);
        if (!task) sendJson(response, 404, "NOT_FOUND", "Task not found", [detail("id", "NOT_FOUND", "Task ID was not found")]);
        else json(response, 200, task);
        return;
      }

      sendJson(response, 404, "ROUTE_NOT_FOUND", "Route not found", [detail("request", "ROUTE", "Unknown API route")]);
    } catch {
      sendJson(response, 500, "VALIDATION_ERROR", "Internal server error", []);
    }
  }

  return { store, handler, randomUUID };
}
