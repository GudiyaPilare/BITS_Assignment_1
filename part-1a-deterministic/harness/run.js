import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createApp } from "../src/app.js";
import { runStaticChecks } from "./static-check.js";
import { runSecurityChecks } from "./security-check.js";
import { isUuidV4 } from "../src/validation.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const evidenceFinal = path.join(root, "evidence/final");
fs.mkdirSync(evidenceFinal, { recursive: true });

const findings = [];
findings.push(...runStaticChecks(root));
findings.push(...runSecurityChecks(root));

const testFiles = [
  ...fs.readdirSync(path.join(root, "tests/unit")).filter((name) => name.endsWith(".test.js")).map((name) => `tests/unit/${name}`),
  ...fs.readdirSync(path.join(root, "tests/contract")).filter((name) => name.endsWith(".test.js")).map((name) => `tests/contract/${name}`),
];
const testResult = spawnSync(process.execPath, ["--test", ...testFiles], {
  cwd: root,
  encoding: "utf8",
  timeout: 120000,
});

const testOutput = `${testResult.stdout ?? ""}${testResult.stderr ?? ""}`;
const passMatch = testOutput.match(/(?:ℹ )?pass (\d+)/);
const failMatch = testOutput.match(/(?:ℹ )?fail (\d+)/);
const testMatch = testOutput.match(/(?:ℹ )?tests (\d+)/);
const failCount = failMatch ? Number(failMatch[1]) : 0;
const passCount = passMatch ? Number(passMatch[1]) : (testMatch ? Math.max(0, Number(testMatch[1]) - failCount) : 0);
if (testResult.status !== 0 || failCount > 0) {
  findings.push({ requirementIds: ["FR-020", "NFR-002"], testId: "deterministic-tests", severity: "CRITICAL", message: "Deterministic unit or contract tests failed", observed: testOutput });
}

const app = createApp();
const server = http.createServer(app.handler);
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}`;

async function timedRequest(method, pathname, body, contentType) {
  const headers = {};
  if (contentType !== null) headers["content-type"] = contentType;
  const started = performance.now();
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : (typeof body === "string" ? body : JSON.stringify(body)),
  });
  const text = await response.text();
  const elapsedMs = performance.now() - started;
  return { status: response.status, body: text ? JSON.parse(text) : null, elapsedMs };
}

try {
  const operations = [];
  const created = await timedRequest("POST", "/tasks", { title: "Harness task" }, "application/json");
  operations.push(["create", created]);

  if (!isUuidV4(created.body?.id)) findings.push({ requirementIds: ["FR-022"], testId: "harness-uuid-v4", severity: "HIGH", message: "Created task ID is not canonical UUID v4" });
  if (created.status !== 201) findings.push({ requirementIds: ["FR-001"], testId: "harness-create", severity: "HIGH", message: `Create returned ${created.status}` });

  if (created.status === 201) {
    const id = created.body.id;
    operations.push(["list", await timedRequest("GET", "/tasks")]);
    operations.push(["retrieve", await timedRequest("GET", `/tasks/${id}`)]);
    operations.push(["update", await timedRequest("PATCH", `/tasks/${id}`, { description: "updated" }, "application/json")]);
    operations.push(["status", await timedRequest("PATCH", `/tasks/${id}/status`, { status: "Completed" }, "application/json")]);
    operations.push(["delete", await timedRequest("DELETE", `/tasks/${id}`)]);
  }

  operations.push(["missing-content-type", await timedRequest("POST", "/tasks", { title: "Missing type" }, null)]);
  operations.push(["malformed-json", await timedRequest("POST", "/tasks", '{"title":', "application/json")]);
  operations.push(["unsupported-content-type", await timedRequest("POST", "/tasks", { title: "Text" }, "text/plain")]);
  operations.push(["unknown-route", await timedRequest("GET", "/unknown")]);
  operations.push(["near-64k-limit", await timedRequest("POST", "/tasks", { title: "Large", description: "x".repeat(64 * 1024) }, "application/json")]);

  for (const [operation, result] of operations) {
    if (result.elapsedMs > 2000) findings.push({ requirementIds: ["NFR-006"], testId: `two-second-timer-${operation}`, severity: "HIGH", message: `${operation} took ${result.elapsedMs.toFixed(2)}ms` });
  }

  const missing = operations.find(([name]) => name === "missing-content-type")?.[1];
  if (missing?.status !== 415) findings.push({ requirementIds: ["FR-015"], testId: "harness-missing-content-type", severity: "HIGH", message: `Missing Content-Type returned ${missing?.status}` });

  const malformed = operations.find(([name]) => name === "malformed-json")?.[1];
  if (malformed?.status !== 400) findings.push({ requirementIds: ["FR-015"], testId: "harness-malformed-json", severity: "HIGH", message: `Malformed JSON returned ${malformed?.status}` });

  const unsupported = operations.find(([name]) => name === "unsupported-content-type")?.[1];
  if (unsupported?.status !== 415) findings.push({ requirementIds: ["FR-015"], testId: "harness-unsupported-content-type", severity: "HIGH", message: `Unsupported Content-Type returned ${unsupported?.status}` });

  const route = operations.find(([name]) => name === "unknown-route")?.[1];
  if (route?.status !== 404) findings.push({ requirementIds: ["FR-016"], testId: "harness-unknown-route", severity: "HIGH", message: `Unknown route returned ${route?.status}` });

  const nearLimit = operations.find(([name]) => name === "near-64k-limit")?.[1];
  if (nearLimit?.status !== 413) findings.push({ requirementIds: ["FR-023"], testId: "harness-64k-limit", severity: "HIGH", message: `Near-64 KiB request returned ${nearLimit?.status}, expected 413` });
} finally {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

const deterministicScenarioCount = passCount + failCount;
const initialPassPercent = deterministicScenarioCount ? (passCount / deterministicScenarioCount) * 100 : 0;
if (initialPassPercent < 95) {
  findings.push({ requirementIds: ["SC-002"], testId: "ninety-five-percent-initial-pass", severity: "CRITICAL", message: `Initial deterministic pass rate ${initialPassPercent.toFixed(2)}% is below 95%` });
}

const MAX_REPAIR_ATTEMPTS = 2;
const repairAttempt = Number(process.env.PART1_REPAIR_ATTEMPT ?? "0");

if (findings.length > 0 && repairAttempt >= MAX_REPAIR_ATTEMPTS) {
  findings.push({
    requirementIds: ["NFR-008"],
    testId: "bounded-repair-limit",
    severity: "CRITICAL",
    message: `Automatic repair stopped after ${MAX_REPAIR_ATTEMPTS} unsuccessful attempts; remaining failure requires human review`,
  });
}

const report = {
  status: findings.length === 0 ? "pass" : "fail",
  initialFailureEvidencePreserved: fs.existsSync(path.join(root, "evidence/initial/test-failure.json")),
  deterministicTests: { passCount, failCount, passPercent: initialPassPercent },
  twoSecondLimitMs: 2000,
  findings,
  humanAcceptance: {
    status: "PENDING",
    acceptedBy: null,
    evidence: null,
  },
};

fs.writeFileSync(path.join(evidenceFinal, "harness-report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exitCode = findings.length === 0 ? 0 : 1;
