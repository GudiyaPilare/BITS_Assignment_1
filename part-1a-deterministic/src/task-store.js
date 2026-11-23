import { randomUUID } from "node:crypto";

export class TaskStore {
  constructor() {
    this.tasks = new Map();
  }

  reset() {
    this.tasks.clear();
  }

  create(input) {
    const task = {
      id: randomUUID(),
      title: input.title,
      description: Object.hasOwn(input, "description") ? input.description : null,
      priority: input.priority ?? "Medium",
      status: "Pending",
      dueDate: Object.hasOwn(input, "dueDate") ? input.dueDate : null,
    };
    this.tasks.set(task.id, task);
    return { ...task };
  }

  get(id) {
    const task = this.tasks.get(id);
    return task ? { ...task } : null;
  }

  list() {
    return [...this.tasks.values()].sort((a, b) => a.id.localeCompare(b.id)).map((task) => ({ ...task }));
  }

  update(id, changes) {
    const task = this.tasks.get(id);
    if (!task) return null;

    for (const field of ["title", "description", "priority", "dueDate"]) {
      if (Object.hasOwn(changes, field)) task[field] = changes[field];
    }
    return { ...task };
  }

  setStatus(id, status) {
    const task = this.tasks.get(id);
    if (!task) return null;
    task.status = status;
    return { ...task };
  }

  delete(id) {
    return this.tasks.delete(id);
  }
}
