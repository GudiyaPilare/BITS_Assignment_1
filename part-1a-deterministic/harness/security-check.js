import fs from "node:fs";
import path from "node:path";

const secretPatterns = [/(?:api[_-]?key|password|token|secret)\s*[=:]\s*["'][^"']+["']/gi];

export function runSecurityChecks(root) {
  const findings = [];
  const sourceFiles = [
    "src/app.js",
    "src/task-store.js",
    "src/validation.js",
    "src/errors.js",
  ];

  for (const relative of sourceFiles) {
    const file = path.join(root, relative);
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const pattern of secretPatterns) {
      if (pattern.test(text)) {
        findings.push({ requirementIds: ["NFR-004", "NFR-005"], testId: "security-secret-pattern", severity: "CRITICAL", message: `Potential secret assignment found in ${relative}` });
      }
    }
  }
  return findings;
}
