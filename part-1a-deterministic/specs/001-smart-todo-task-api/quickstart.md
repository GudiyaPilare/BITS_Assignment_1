# Quickstart Validation Guide

## Prerequisites

- Node.js 22 or later
- Repository available at the workspace root
- No external runtime framework required

## Start the API

Run the Part 1A entry point after implementation:

```sh
node part-1a-deterministic/src/server.js
```

The local process serves `/tasks` and task-ID routes using in-memory state. Restarting the process clears all tasks.

## Create and Retrieve

```sh
curl -i -X POST http://localhost:3000/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Prepare assignment","priority":"High","dueDate":"2026-12-01"}'
```

Copy the returned UUID v4 ID, then retrieve it:

```sh
curl -i http://localhost:3000/tasks/TASK_UUID
```

## Update and Clear Optional Fields

```sh
curl -i -X PATCH http://localhost:3000/tasks/TASK_UUID \
  -H 'Content-Type: application/json' \
  -d '{"description":null,"dueDate":null}'
```

A create request that supplies `description: null` or `dueDate: null` is invalid.

## Run Deterministic Validation

After implementation, run the repository-defined Part 1A tests and harness. The harness must report initial failure evidence before repair and final passing evidence only after complete revalidation.

Validation includes:

- Static source and project checks.
- Security-oriented input and safe-error checks.
- Functional create, retrieve, list, update, status, and delete contracts.
- UUID v4 format and uniqueness.
- POST null rejection and PATCH null clearing.
- Normalized deterministic cross-run comparison of response fields and final task collections.

## Evidence Locations

- Initial failures: `part-1a-deterministic/evidence/initial/`
- Repair attempts: `part-1a-deterministic/evidence/repairs/`
- Final revalidation: `part-1a-deterministic/evidence/final/`
