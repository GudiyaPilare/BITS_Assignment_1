# Part 1A — Smart Todo REST API

## Requirements

- Node.js 22 or later
- No third-party runtime dependencies

## Setup

```sh
cd part-1a-deterministic
npm install
```

`npm install` is optional because the implementation uses Node.js built-in modules only.

## Run

```sh
npm start
```

The API listens on `127.0.0.1:3000` by default. Task state is held in memory and is cleared on restart.

## Test

```sh
npm test
npm run harness
npm run validate
```

`npm run validate` runs the complete unit, contract, static, security, and independent harness pipeline.

## API

See `specs/001-smart-todo-task-api/spec.md` and `specs/001-smart-todo-task-api/contracts/openapi.yaml`.

## Evidence

- Initial failure evidence: `evidence/initial/`
- Repair evidence: `evidence/repairs/`
- Final validation evidence: `evidence/final/`

Automated validation does not replace human acceptance. The human reviewer must record ACCEPT or REJECT with supporting evidence in `evidence/final/validation-summary.json`.
