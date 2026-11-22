<!--
Sync Impact Report
- Version change: template scaffold → 1.0.0
- Modified principles: scaffold principles → specification-first; test-first; independent layered validation;
  bounded repair; AI reproducibility; safety and oversight; simplicity and maintainability
- Added sections: Technical Constraints; Development Workflow
- Removed sections: none
- Follow-up TODOs: none
-->

# BITS WILP Assignment 1: Spec-Driven Development and Harness Engineering Constitution

## Core Principles

### I. Specification-First Development
Requirements, acceptance criteria, constraints, and important ambiguities MUST be resolved before implementation.
Specifications and plans MUST map requirements to tasks, implementation points, tests, and evidence. Traceability SHALL remain
reviewable across feature artifacts and the repository.

### II. Test-First and Verifiable Quality
Deterministic tests MUST be derived from acceptance criteria. Tests and quality checks SHALL be run after implementation and
after every repair. A result MUST NOT be described as passing unless actual execution evidence exists.

### III. Independent Harness and Layered Validation
The harnesses MUST be independent of application implementation. Static, security-oriented, contract, and deterministic
functional checks SHALL be used where applicable. For Part 1B, independent validation MUST establish output schema,
structural invariants, behavioral properties, and safety rules before semantic evaluation.

### IV. Bounded Feedback and Repair
Harness failures MUST be recorded as structured, machine-readable findings with actionable implementation guidance. Automatic
repair MUST stop at a predefined maximum attempt count. The complete relevant validation pipeline SHALL rerun after every repair.
Tests, invariants, and evaluation thresholds MUST NOT be weakened to manufacture a pass.

### V. AI Evaluation and Reproducibility
AI outputs MUST be treated as non-deterministic. Part 1B SHALL maintain a dataset covering normal, boundary, ambiguous,
missing-information, malformed, and adversarial cases. Evaluation criteria, scoring, and pass thresholds MUST be defined before
execution. Inputs, outputs, scores, configuration, and failure evidence SHALL be preserved for reproducibility.

### VI. Safety, Security and Human Oversight
API keys, passwords, tokens, and other secrets MUST NOT be committed. External inputs and generated outputs MUST be validated,
and appropriate safety guardrails SHALL be applied. Human review is mandatory for final acceptance; automated success alone is
insufficient.

### VII. Simplicity, Maintainability and Separation
Solutions SHALL be simple, modular, understandable, and documented. Node.js 22+ and JavaScript MUST be used for both
applications unless a documented technical reason requires otherwise. Part 1A, Part 1B, and their evidence SHALL remain clearly
separated.

## Technical Constraints

- Initial implementation and failure evidence MUST be preserved so the repair process is auditable.
- Setup, execution, testing, harness operation, and evidence instructions SHALL be sufficient for review by another developer.
- Harness outputs SHOULD be structured and machine-readable, while retaining human-readable summaries where useful.
- Generated artifacts SHALL be traceable to the relevant specification, requirement, task, and test or evaluation case.
- The repository MUST NOT contain invented test results, evaluation scores, security findings, or human approval.

## Development Workflow

1. Specify requirements and acceptance criteria before implementation.
2. Create or update test specifications and harnesses independently of the implementation.
3. Record the initial implementation state and the first failing evidence before repair.
4. Apply repair attempts only within the configured maximum and rerun the complete relevant pipeline after each attempt.
5. Preserve passing and failing evidence, including relevant logs and machine-readable findings.
6. Make meaningful Git commits at major milestones and keep the two applications and evidence separated.
7. Obtain human review and explicit final approval after automated validation is complete.

## Governance

This constitution supersedes informal project practices. It applies to specifications, plans, tasks, implementation, harnesses,
tests, evaluation, evidence, and documentation for both applications.

Amendments require a documented rationale, review, and a version update. A MINOR or MAJOR amendment SHALL be accompanied by an
explicit impact assessment and migration or remediation plan when existing work is affected. Compliance SHALL be checked during
specification review, implementation review, validation review, and final human acceptance.

A constitution update is a MAJOR change for backward-incompatible removal or redefinition of governance or principles, a MINOR
change for a new or materially expanded principle or section, and a PATCH change for clarifications or wording corrections.

**Version**: 1.0.0 | **Ratified**: 2026-11-23 | **Last Amended**: 2026-11-23
