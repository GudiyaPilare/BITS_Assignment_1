import test from "node:test";
import assert from "node:assert/strict";
import { TaskStore } from "../../src/task-store.js";
import { isUuidV4 } from "../../src/validation.js";

test("store creates UUID v4 tasks with defaults", () => {
  const store = new TaskStore();
  const task = store.create({ title: "Prepare" });
  assert.equal(isUuidV4(task.id), true);
  assert.equal(task.priority, "Medium");
  assert.equal(task.status, "Pending");
  assert.equal(task.description, null);
  assert.equal(task.dueDate, null);
});

test("store update preserves omitted fields and clears optional fields", () => {
  const store = new TaskStore();
  const task = store.create({ title: "Prepare", description: "Assignment", dueDate: "2026-12-01", priority: "High" });
  const updated = store.update(task.id, { description: null, dueDate: null });
  assert.equal(updated.title, "Prepare");
  assert.equal(updated.priority, "High");
  assert.equal(updated.description, null);
  assert.equal(updated.dueDate, null);
  assert.equal(updated.status, "Pending");
});

test("store reset and deletion", () => {
  const store = new TaskStore();
  const task = store.create({ title: "Prepare" });
  assert.equal(store.delete(task.id), true);
  assert.equal(store.get(task.id), null);
  store.create({ title: "Another" });
  store.reset();
  assert.deepEqual(store.list(), []);
});
