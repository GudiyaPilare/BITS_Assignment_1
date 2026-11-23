import fs from "node:fs";
import path from "node:path";

export function runStaticChecks(root) {
  const findings = [];
  const requiredFiles = [
    "src/app.js",
    "src/task-store.js",
    "src/validation.js",
    "src/errors.js",
    "tests/fixtures.js",
  ];
  for (const relative of requiredFiles) {
    if (!fs.existsSync(path.join(root, relative))) {
      findings.push({ requirementIds: ["FR-020"], testId: "static-required-file", severity: "HIGH", message: `Missing required file: ${relative}` });
    }
  }

  const specPath = path.join(root, "specs/001-smart-todo-task-api/spec.md");
  if (!fs.existsSync(specPath)) {
    findings.push({ requirementIds: ["FR-020"], testId: "static-spec", severity: "HIGH", message: "Missing feature specification" });
  }

  for (const relative of ["src/app.js", "src/task-store.js", "src/validation.js", "src/errors.js"]) {
    const file = path.join(root, relative);
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    if (/eval\s*\(|new\s+Function\s*\(/i.test(text)) {
      findings.push({ requirementIds: ["NFR-003", "NFR-004"], testId: "static-dangerous-api", severity: "HIGH", message: `Unsafe dynamic execution found in ${relative}` });
    }
  }

  return findings;
}
