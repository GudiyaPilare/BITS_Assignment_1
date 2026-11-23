# Implementation Plan: Smart Todo and Task Management REST API

**Branch**: `001-smart-todo-task-api` | **Date**: 2026-11-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `part-1a-deterministic/specs/001-smart-todo-task-api/spec.md`

## Summary

Implement a deterministic Node.js 22+ REST API for in-memory task management. The application will expose create, retrieve, list, update, status, and delete operations with strict JSON contracts and validation. A separate harness will provide static, security-oriented, unit, and contract verification with machine-readable findings and bounded repair evidence.

## Technical Context

**Language/Version**: JavaScript on Node.js 22+

**Primary Dependencies**: Node.js built-in `node:http`, `node:crypto`, and `node:test`; no runtime framework dependency

**Storage**: In-memory `Map`, cleared when the application process restarts

**Testing**: Node.js test runner for application tests; independent Part 1A harness in `part-1a-deterministic/harness`

**Target Platform**: Local Node.js REST service

**Project Type**: Web service / REST API

**Performance Goals**: Process a 64 KiB request and return a deterministic response within the 2-second harness timeout

**Constraints**: UUID v4 identifiers; lexicographic task-ID listing; JSON-only contracts; no persistence; no authentication; 64 KiB maximum body

**Scale/Scope**: Single-process assignment workload with isolated deterministic test state

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Specification-first: PASS — design artifacts map directly to resolved requirements and acceptance criteria.
- Test-first: PASS — contract, data model, and quickstart validation define independent executable checks before implementation.
- Independent harness: PASS — the planned harness remains external to application modules and validates HTTP contracts.
- Bounded repair: PASS — planned evidence directories and findings preserve auditable repair behavior.
- Safety/security: PASS — contract and validation rules reject malformed and unsafe input and avoid secret exposure.
- Technical constraints: PASS — Node.js 22+ JavaScript, in-memory state, Part 1A separation, and documentation remain preserved.
- Evidence: PASS — initial, repair, and final evidence locations are included in the design.

## Project Structure

### Documentation (this feature)

```text
part-1a-deterministic/specs/001-smart-todo-task-api/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── openapi.yaml
```

### Source Code (repository root)

```text
part-1a-deterministic/
├── src/
│   ├── server.js
│   ├── app.js
│   ├── task-store.js
│   ├── validation.js
│   └── errors.js
├── tests/
│   ├── unit/
│   └── contract/
├── harness/
│   ├── static-check.js
│   ├── security-check.js
│   └── run.js
└── evidence/
    ├── initial/
    ├── repairs/
    └── final/
```

**Structure Decision**: Use a small modular web-service layout under `part-1a-deterministic`. Runtime behavior is separated from in-memory storage and validation. Tests and harnesses remain independent and executable from repository instructions.

## Complexity Tracking

No constitution violations require an exception. Keeping the server implementation dependency-free minimizes complexity and makes deterministic contract tests easier to review.
