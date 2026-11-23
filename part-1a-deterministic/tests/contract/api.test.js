import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createApp } from "../../src/app.js";
import { startTestServer, request } from "../fixtures.js";

const server = await startTestServer();

async function resetAndCreate(title = "Prepare assignment") {
  server.store.reset();
  return request(server.baseUrl, "POST", "/tasks", { title });
}

test.after(async () => server.close());

test("create and retrieve task", async () => {
  const created = await resetAndCreate();
  assert.equal(created.status, 201);
  assert.match(created.body.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.equal(created.body.title, "Prepare assignment");
  assert.equal(created.body.description, null);
  assert.equal(created.body.priority, "Medium");
  assert.equal(created.body.status, "Pending");
  assert.equal(created.body.dueDate, null);

  const retrieved = await request(server.baseUrl, "GET", `/tasks/${created.body.id}`);
  assert.equal(retrieved.status, 200);
  assert.deepEqual(retrieved.body, created.body);
});

test("list, update, status, and delete", async () => {
  await server.store.reset();
  const first = await request(server.baseUrl, "POST", "/tasks", { title: "B", description: "Initial", dueDate: "2026-12-01" });
  const second = await request(server.baseUrl, "POST", "/tasks", { title: "A" });
  const listed = await request(server.baseUrl, "GET", "/tasks");
  assert.equal(listed.status, 200);
  assert.equal(listed.body.length, 2);
  assert.deepEqual(listed.body.map((task) => task.id), [...listed.body.map((task) => task.id)].sort());

  const updated = await request(server.baseUrl, "PATCH", `/tasks/${first.body.id}`, { description: null, dueDate: null });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.title, "B");
  assert.equal(updated.body.description, null);
  assert.equal(updated.body.dueDate, null);

  const completed = await request(server.baseUrl, "PATCH", `/tasks/${first.body.id}/status`, { status: "Completed" });
  assert.equal(completed.status, 200);
  assert.equal(completed.body.status, "Completed");
  const pending = await request(server.baseUrl, "PATCH", `/tasks/${first.body.id}/status`, { status: "Pending" });
  assert.equal(pending.status, 200);
  assert.equal(pending.body.status, "Pending");

  const deleted = await request(server.baseUrl, "DELETE", `/tasks/${first.body.id}`);
  assert.equal(deleted.status, 204);
  assert.equal(deleted.body, null);
  assert.equal((await request(server.baseUrl, "GET", `/tasks/${first.body.id}`)).status, 404);
});

test("malformed and content-type errors are distinct", async () => {
  await server.store.reset();
  const malformed = await request(server.baseUrl, "POST", "/tasks", '{"title":', "application/json");
  assert.equal(malformed.status, 400);
  assert.equal(malformed.body.code, "MALFORMED_REQUEST");

  const missing = await request(server.baseUrl, "POST", "/tasks", { title: "A" }, null);
  assert.equal(missing.status, 415);

  const unsupported = await request(server.baseUrl, "POST", "/tasks", { title: "A" }, "text/plain");
  assert.equal(unsupported.status, 415);
});

test("validation failures do not mutate state", async () => {
  await server.store.reset();
  const created = await request(server.baseUrl, "POST", "/tasks", { title: "Stable" });
  assert.equal(created.status, 201);
  const invalid = await request(server.baseUrl, "PATCH", `/tasks/${created.body.id}`, { description: null, dueDate: null, status: "Completed" });
  assert.equal(invalid.status, 400);
  const retrieved = await request(server.baseUrl, "GET", `/tasks/${created.body.id}`);
  assert.equal(retrieved.body.status, "Pending");
  assert.equal(retrieved.body.description, null);

  const postNull = await request(server.baseUrl, "POST", "/tasks", { title: "Invalid", description: null });
  assert.equal(postNull.status, 400);
  assert.equal((await request(server.baseUrl, "GET", "/tasks")).body.length, 1);
});

test("unknown IDs, routes, and methods return deterministic codes", async () => {
  await server.store.reset();
  const unknownId = "550e8400-e29b-41d4-a716-446655440000";
  assert.equal((await request(server.baseUrl, "GET", `/tasks/${unknownId}`)).status, 404);
  assert.equal((await request(server.baseUrl, "GET", "/unknown")).status, 404);
  assert.equal((await request(server.baseUrl, "PUT", "/tasks", { title: "A" })).status, 405);
});

test("requests exceeding 64 KiB return 413", async () => {
  await server.store.reset();
  const largeDescription = "x".repeat(65 * 1024);
  const response = await request(server.baseUrl, "POST", "/tasks", { title: "Large", description: largeDescription });
  assert.equal(response.status, 413);
});

test("SC-006 independent runs compare normalized UUID task state", async () => {
  async function runIndependentSequence() {
    const runServer = await startTestServer();
    try {
      const first = await request(runServer.baseUrl, "POST", "/tasks", { title: "B", description: "Initial", dueDate: "2026-12-01" });
      const second = await request(runServer.baseUrl, "POST", "/tasks", { title: "A" });
      const getFirst = await request(runServer.baseUrl, "GET", `/tasks/${first.body.id}`);
      const updated = await request(runServer.baseUrl, "PATCH", `/tasks/${first.body.id}`, { description: null, dueDate: null });
      const listed = await request(runServer.baseUrl, "GET", "/tasks");
      return { first, second, getFirst, updated, listed };
    } finally {
      await runServer.close();
    }
  }

  function normalizeIds(value) {
    const mapping = new Map();
    let next = 1;
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    function visit(item) {
      if (typeof item === "string") {
        if (!uuidPattern.test(item)) return item;
        if (!mapping.has(item)) mapping.set(item, `<UUID-${next++}>`);
        return mapping.get(item);
      }
      if (Array.isArray(item)) return item.map(visit);
      if (item && typeof item === "object") {
        return Object.fromEntries(Object.entries(item).map(([key, child]) => [key, visit(child)]));
      }
      return item;
    }

    return visit(value);
  }

  const runOne = await runIndependentSequence();
  const runTwo = await runIndependentSequence();

  const normalizedOne = normalizeIds(runOne);
  const normalizedTwo = normalizeIds(runTwo);
  normalizedOne.listed.body.sort((a, b) => a.id.localeCompare(b.id));
  normalizedTwo.listed.body.sort((a, b) => a.id.localeCompare(b.id));

  assert.deepEqual(normalizedOne, normalizedTwo);

  for (const task of [runOne.first.body, runOne.second.body, runOne.getFirst.body, runOne.updated.body, ...runOne.listed.body]) {
    assert.match(task.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  }
});

test("controlled internal failure returns 500 without internal detail", async () => {
  const app = createApp({
    list() { throw new Error("controlled test failure"); },
  });
  const server = http.createServer(app.handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/tasks`);
    assert.equal(response.status, 500);
    const body = await response.json();
    assert.equal(body.code, "VALIDATION_ERROR");
    assert.doesNotMatch(JSON.stringify(body), /controlled test failure|stack|at /i);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
