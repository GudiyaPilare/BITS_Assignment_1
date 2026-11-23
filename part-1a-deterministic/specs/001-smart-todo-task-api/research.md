# Phase 0 Research: Smart Todo and Task Management REST API

## Decision: Dependency-free Node.js HTTP server

- **Decision**: Implement the API with Node.js 22+ built-in `node:http`, `node:test`, and `node:crypto` modules.
- **Rationale**: The constitution requires JavaScript and Node.js 22+, while built-in modules keep setup simple and deterministic.
- **Alternatives considered**: A framework-based server was rejected because it adds dependencies and unrelated configuration.

## Decision: In-memory Map storage

- **Decision**: Store task records in process memory in a `Map` keyed by UUID v4.
- **Rationale**: It satisfies clarified in-memory lifetime behavior and makes test state resets deterministic.
- **Alternatives considered**: File or database persistence was rejected because it conflicts with the clarified process-lifetime decision.

## Decision: UUID v4 server-generated IDs

- **Decision**: Generate identifiers with `node:crypto.randomUUID()` and validate v4 IDs with an independent canonical pattern.
- **Rationale**: It matches the resolved specification and allows harness comparison without fixed generated values.
- **Alternatives considered**: Sequential integers and random short strings were rejected by the clarification decision.

## Decision: Independent harness process

- **Decision**: Start or invoke the application as a separate process and compare external HTTP and static results without importing application internals.
- **Rationale**: This preserves harness independence and permits genuine initial failure evidence.
- **Alternatives considered**: Direct in-process calls were rejected because they would weaken external contract verification.

## Decision: Structured JSON findings and bounded repair

- **Decision**: Harness findings will be machine-readable JSON with requirement ID, test ID, severity, message, and evidence location. Repair attempts will stop at a configured maximum.
- **Rationale**: The constitution requires actionable, auditable feedback and a complete revalidation pipeline after each repair.
- **Alternatives considered**: Human-only log review was rejected because it does not provide repeatable machine-readable feedback.

## Decision: PATCH-only null clearing

- **Decision**: Reject `null` in `POST /tasks`; permit `null` only for `description` and `dueDate` in `PATCH /tasks/{id}`.
- **Rationale**: It follows the clarified contract and preserves the distinction between create and update semantics.
- **Alternatives considered**: Accepting null during creation was rejected because the clarification explicitly limits null clearing to updates.
