const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidV4(value) {
  return typeof value === "string" && UUID_V4.test(value);
}

export function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function hasControlCharacters(value) {
  return [...value].some((character) => character.codePointAt(0) < 32);
}

export function validateTitle(value, required = false) {
  if (value === undefined && !required) return null;
  if (typeof value !== "string") return "Title must be a string";
  const trimmed = value.trim();
  if (trimmed.length === 0) return "Title must not be empty";
  if (trimmed.length > 200) return "Title must contain at most 200 characters after trimming";
  if (hasControlCharacters(trimmed)) return "Title must not contain control characters";
  return null;
}

export function normalizeTitle(value) {
  return value.trim();
}

export function validateDescription(value, allowNull) {
  if (value === null) return allowNull ? null : "Description may not be null";
  if (typeof value !== "string") return "Description must be a string";
  if (value.length > 2000) return "Description must contain at most 2000 characters";
  if (hasControlCharacters(value)) return "Description must not contain control characters";
  return null;
}

export function validatePriority(value) {
  return ["Low", "Medium", "High"].includes(value)
    ? null
    : "Priority must be Low, Medium, or High";
}

export function validateStatus(value) {
  return ["Pending", "Completed"].includes(value)
    ? null
    : "Status must be Pending or Completed";
}

export function isValidGregorianDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= days[month - 1];
}

export function validateDueDate(value, allowNull) {
  if (value === null) return allowNull ? null : "Due date may not be null";
  if (typeof value !== "string") return "Due date must be a string";
  return isValidGregorianDate(value) ? null : "Due date must be a valid YYYY-MM-DD Gregorian calendar date";
}
