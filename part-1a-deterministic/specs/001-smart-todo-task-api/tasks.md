# Tasks: Smart Todo and Task Management REST API

**Input**: Design documents from `part-1a-deterministic/specs/001-smart-todo-task-api/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Test tasks are included because the specification requires deterministic unit/contract scenarios, independent harness validation, initial failure evidence, bounded repair, and final revalidation.

**Organization**: Tasks are grouped by user story so each increment is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Different files and no dependency on an incomplete task.
- **[Story]**: US1, US2, US3, or US4 for user-story phases.
- Every description includes an exact repository path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the Part 1A project structure and runtime commands.

- [ ] T001 Create the Part 1A source, test, harness, and evidence directories in `part-1a-deterministic/` per `part-1a-deterministic/specs/001-smart-todo-task-api/plan.md`.
- [ ] T002 Initialize the Node.js 22+ JavaScript package metadata in `part-1a-deterministic/package.json` with test and harness scripts.
- [ ] T003 [P] Add repository setup and run instructions to `part-1a-deterministic/README.md`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create shared infrastructure required by every user story.

**CRITICAL**: No user-story implementation begins until this phase is complete.

- [ ] T004 Implement the in-memory task collection keyed by UUID v4 in `part-1a-deterministic/src/task-store.js`, using `data-model.md` for `Task.id` and process-lifetime state.
- [ ] T005 Implement canonical UUID v4 validation and immutable task ID lookup in `part-1a-deterministic/src/validation.js`, citing `data-model.md` for `Task.id`.
- [ ] T006 Implement title, description, priority, status, and due-date validation in `part-1a-deterministic/src/validation.js`, citing `data-model.md` for `Task.title`, `Task.description`, `Task.priority`, `Task.status`, and `Task.dueDate`.
- [ ] T007 Implement the HTTP JSON request body reader and 64 KiB size limit in `part-1a-deterministic/src/server.js`.
- [ ] T008 Implement deterministic error objects and safe-error serialization in `part-1a-deterministic/src/errors.js`, including stable field detail objects and no internal disclosure.
- [ ] T009 Implement JSON route dispatch and method/content-type handling in `part-1a-deterministic/src/app.js` for 400, 404, 405, 413, 415, and 500 responses from `spec.md`.
- [ ] T010 [P] Create shared test fixtures and a deterministic reset mechanism in `part-1a-deterministic/tests/fixtures.js`.
- [ ] T011 [P] Create independent harness entrypoint and structured JSON finding writer in `part-1a-deterministic/harness/run.js`.
- [ ] T012 [P] Create static source and traceability checks in `part-1a-deterministic/harness/static-check.js`.
- [ ] T013 [P] Create security-oriented input and safe-error checks in `part-1a-deterministic/harness/security-check.js`.

**Checkpoint**: Shared store, validation, routing, errors, and independent harness infrastructure are ready.

---

## Phase 3: User Story 1 - Create and Retrieve Tasks (Priority: P1) 🎯 MVP

**Goal**: Create tasks and retrieve one task by UUID v4 ID.

**Independent Test**: Start from an empty collection, create a valid task, verify defaults and the canonical UUID response, then retrieve the created task and test missing IDs.

### Tests for User Story 1

- [ ] T014 [P] [US1] Write create-contract tests for `POST /tasks` in `part-1a-deterministic/tests/contract/create-task.test.js`, covering defaults, null rejection, unknown fields, and 201 responses.
- [ ] T015 [P] [US1] Write retrieval-contract tests for `GET /tasks/{id}` in `part-1a-deterministic/tests/contract/get-task.test.js`, covering 200, malformed IDs, and unknown IDs.
- [ ] T016 [P] [US1] Write create/retrieve unit tests for `Task` state and UUID generation in `part-1a-deterministic/tests/unit/task-store.test.js`.

### Implementation for User Story 1

- [ ] T017 [US1] Implement task creation in `part-1a-deterministic/src/app.js`, using `data-model.md` for `Task.title`, `Task.description`, `Task.priority`, `Task.status`, and `Task.dueDate`.
- [ ] T018 [US1] Generate immutable UUID v4 IDs and store created tasks in `part-1a-deterministic/src/task-store.js`, citing `data-model.md` for `Task.id`.
- [ ] T019 [US1] Implement `GET /tasks/{id}` and task copy responses in `part-1a-deterministic/src/app.js`, preserving `description` and `dueDate` as required nullable response fields.
- [ ] T020 [US1] Add create/retrieve contract scenarios to `part-1a-deterministic/harness/run.js` and classify findings by FR-001 through FR-005 and FR-022.

**Checkpoint**: US1 independently creates and retrieves tasks and can serve as the MVP.

---

## Phase 4: User Story 2 - List and Update Tasks (Priority: P1)

**Goal**: List all tasks in deterministic order and update mutable fields without changing ID or status.

**Independent Test**: Create two tasks, list both lexicographically, update supplied fields and clear optional fields, while verifying omitted fields and missing-task behavior.

### Tests for User Story 2

- [ ] T021 [P] [US2] Write list-contract tests for `GET /tasks` in `part-1a-deterministic/tests/contract/list-tasks.test.js`, covering empty collections and lexicographic UUID order.
- [ ] T022 [P] [US2] Write general-update contract tests for `PATCH /tasks/{id}` in `part-1a-deterministic/tests/contract/update-task.test.js`, covering partial updates, null clearing, omitted fields, immutable fields, and 404.

### Implementation for User Story 2

- [ ] T023 [US2] Implement lexicographic task listing in `part-1a-deterministic/src/task-store.js`, citing `data-model.md` for `Task.id` and `Task` response fields.
- [ ] T024 [US2] Implement general update validation and mutation in `part-1a-deterministic/src/app.js`, using `data-model.md` for `Task.title`, `Task.description`, `Task.priority`, and `Task.dueDate`.
- [ ] T025 [US2] Ensure omitted update fields remain unchanged and only `description` or `dueDate` accept null in `part-1a-deterministic/src/validation.js`.
- [ ] T026 [US2] Add list/update contract scenarios to `part-1a-deterministic/harness/run.js` and classify findings by FR-006 through FR-009 and FR-023.

**Checkpoint**: US2 independently lists and updates tasks.

---

## Phase 5: User Story 3 - Complete, Reopen, and Delete Tasks (Priority: P2)

**Goal**: Change task status and delete tasks permanently during the process lifetime.

**Independent Test**: Create a task, complete it, reopen it, delete it, and verify retrieval/listing absence and 404 behavior.

### Tests for User Story 3

- [ ] T027 [P] [US3] Write status-contract tests for `PATCH /tasks/{id}/status` in `part-1a-deterministic/tests/contract/status-task.test.js`, covering Pending and Completed transitions and invalid status values.
- [ ] T028 [P] [US3] Write deletion-contract tests for `DELETE /tasks/{id}` in `part-1a-deterministic/tests/contract/delete-task.test.js`, covering 204, missing IDs, and subsequent 404 behavior.

### Implementation for User Story 3

- [ ] T029 [US3] Implement dedicated status changes in `part-1a-deterministic/src/app.js`, citing `data-model.md` for `Task.status`.
- [ ] T030 [US3] Implement permanent deletion within the in-memory store in `part-1a-deterministic/src/task-store.js`, using `data-model.md` for `Task.id`.
- [ ] T031 [US3] Add status/delete contract scenarios to `part-1a-deterministic/harness/run.js` and classify findings by FR-010 and FR-011.

**Checkpoint**: US3 independently completes the task lifecycle.

---

## Phase 6: User Story 4 - Reject Invalid and Malformed Requests Safely (Priority: P1)

**Goal**: Reject malformed JSON, invalid content types, invalid fields, and missing resources without state mutation or unsafe disclosures.

**Independent Test**: Reset to a known task collection, apply malformed and invalid requests, and verify status codes, error objects, and unchanged state.

### Tests for User Story 4

- [ ] T032 [P] [US4] Write malformed JSON and invalid UTF-8 contract tests in `part-1a-deterministic/tests/contract/malformed-request.test.js` for 400 and `MALFORMED_REQUEST`.
- [ ] T033 [P] [US4] Write missing and unsupported Content-Type contract tests in `part-1a-deterministic/tests/contract/content-type.test.js` for 415.
- [ ] T034 [P] [US4] Write field-validation and boundary tests in `part-1a-deterministic/tests/unit/validation.test.js`, citing `data-model.md` for `Task.title`, `Task.description`, `Task.priority`, `Task.status`, and `Task.dueDate`.
- [ ] T035 [P] [US4] Write route, method, unknown-ID, and safe-error tests in `part-1a-deterministic/tests/contract/error-contract.test.js` for 404, 405, 413, and 500 response contracts.

### Implementation for User Story 4

- [ ] T036 [US4] Implement pre-body Content-Type checks in `part-1a-deterministic/src/app.js` that return 415 for missing or unsupported types.
- [ ] T037 [US4] Implement malformed JSON and invalid UTF-8 handling in `part-1a-deterministic/src/app.js` that returns 400 without state changes.
- [ ] T038 [US4] Implement field-specific validation findings and unknown-ID handling in `part-1a-deterministic/src/validation.js` and `part-1a-deterministic/src/errors.js`.
- [ ] T039 [US4] Implement deterministic unknown-route and unsupported-method responses in `part-1a-deterministic/src/app.js` without exposing internals.
- [ ] T040 [US4] Add security and negative contract scenarios to `part-1a-deterministic/harness/run.js` for FR-012 through FR-017 and NFR-003 through NFR-005.

**Checkpoint**: US4 independently verifies safe, deterministic rejection behavior and state preservation.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Complete deterministic evidence, documentation, and final auditability.

- [ ] T041 [P] Implement normalized UUID v4 cross-run comparison in `part-1a-deterministic/harness/run.js` for SC-006 response and final-state comparisons.
- [ ] T042 [P] Add initial-failure evidence capture in `part-1a-deterministic/evidence/initial/` and preserve it without rewriting it.
- [ ] T043 [P] Add bounded repair finding and attempt output handling in `part-1a-deterministic/evidence/repairs/` with a configured maximum attempt count.
- [ ] T044 [P] Add final revalidation evidence and a machine-readable summary in `part-1a-deterministic/evidence/final/`.
- [ ] T045 Update `part-1a-deterministic/README.md` with setup, execution, test, harness, evidence, and human-review instructions.
- [ ] T046 Run the complete relevant test and harness pipeline, and document actual results only in `part-1a-deterministic/evidence/final/`.
- [ ] T047 Verify traceability from FR-001 through FR-023 and SC-001 through SC-007 to named tasks and harness scenarios.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup** has no dependencies.
- **Phase 2: Foundational** depends on Phase 1 and blocks every user story.
- **Phases 3–6** depend on Phase 2; US1, US2, US3, and US4 can proceed independently after foundation completion.
- **Phase 7: Polish** depends on the desired user-story phases.

### User Story Dependencies

- **US1**: Independent; no dependency on US2, US3, or US4.
- **US2**: Independent; US1 may supply fixtures but US2 should pass with only foundational work and its own setup.
- **US3**: Independent; can use its own fixture task.
- **US4**: Independent; validates all endpoints and shared error behavior.

### Within Each User Story

- Tests must be written before implementation and must fail before implementation.
- Models/store work precedes services and endpoints.
- Core implementation precedes integration and harness classification.
- Each story must pass its independently testable checkpoint before proceeding.

## Parallel Opportunities

- T003, T010–T013 can run in parallel after setup.
- T014–T016, T021–T022, T027–T028, and T032–T035 are parallel test tasks within their respective stories.
- T041–T044 are parallel evidence and harness tasks.
- User stories US1–US4 can be worked concurrently after Phase 2.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 foundational infrastructure.
3. Complete US1 create/retrieve behavior and tests.
4. Record initial evidence and run the US1 harness validation.
5. Stop and validate US1 before adding other stories.

### Incremental Delivery

1. Complete setup and foundational infrastructure.
2. Add US1 and validate independently.
3. Add US2 and validate independently.
4. Add US3 and validate independently.
5. Add US4 and validate independently.
6. Complete cross-cutting harness, evidence, documentation, and final human review.

### Parallel Team Strategy

1. Complete setup and foundational phases together.
2. After foundation:
   - Developer A implements US1.
   - Developer B implements US2.
   - Developer C implements US3.
   - Developer D implements US4 and negative/security harness scenarios.
3. Merge only after each story passes its independent checkpoint.

## Notes

- [P] tasks are independent within their phase and have no incomplete-file dependencies.
- [Story] labels map tasks to FR and acceptance traceability.
- Verify harness findings fail before implementation.
- Commit meaningful milestones separately; do not claim passing evidence until execution occurs.
- No application source code or tests are implemented by this task-generation step.
