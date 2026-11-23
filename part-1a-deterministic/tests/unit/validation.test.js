import test from "node:test";
import assert from "node:assert/strict";
import {
  isUuidV4,
  isValidGregorianDate,
  normalizeTitle,
  validateDescription,
  validateDueDate,
  validatePriority,
  validateStatus,
  validateTitle,
} from "../../src/validation.js";

test("UUID v4 validation rejects malformed IDs", () => {
  assert.equal(isUuidV4("550e8400-e29b-41d4-a716-446655440000"), true);
  assert.equal(isUuidV4("550e8400-e29b-31d4-a716-446655440000"), false);
  assert.equal(isUuidV4("not-an-id"), false);
});

test("title trimming and limits", () => {
  assert.equal(normalizeTitle("  Prepare assignment  "), "Prepare assignment");
  assert.equal(validateTitle("  Prepare assignment  ", true), null);
  assert.equal(validateTitle("   ", true), "Title must not be empty");
  assert.equal(validateTitle("x".repeat(201), true), "Title must contain at most 200 characters after trimming");
});

test("description and due-date validation", () => {
  assert.equal(validateDescription(null, false), "Description may not be null");
  assert.equal(validateDescription(null, true), null);
  assert.equal(validateDescription("x".repeat(2001), true), "Description must contain at most 2000 characters");
  assert.equal(isValidGregorianDate("2024-02-29"), true);
  assert.equal(isValidGregorianDate("2023-02-29"), false);
  assert.equal(validateDueDate(null, true), null);
  assert.equal(validateDueDate(null, false), "Due date may not be null");
});

test("priority and status enums", () => {
  assert.equal(validatePriority("Low"), null);
  assert.equal(validatePriority("Medium"), null);
  assert.equal(validatePriority("High"), null);
  assert.equal(validatePriority("high"), "Priority must be Low, Medium, or High");
  assert.equal(validateStatus("Pending"), null);
  assert.equal(validateStatus("Completed"), null);
  assert.equal(validateStatus("pending"), "Status must be Pending or Completed");
});
