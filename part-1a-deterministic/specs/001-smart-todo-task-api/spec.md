# Feature Specification: Smart Todo and Task Management REST API

**Feature Branch**: `001-smart-todo-task-api`

**Created**: 2026-11-23

**Status**: Draft

**Input**: User description: "Create the Part 1A deterministic Smart Todo and Task Management REST API."

## Clarifications

### Session 2026-11-23

- Q: Should task data survive an application restart? → A: Tasks persist only while the application process is running; restart clears them.
- Q: Which task ID format should the API generate? → A: Server-generated UUID v4 strings.
- Q: Should clients be able to clear existing optional description or due date values with null? → A: Yes, for PATCH updates only. Sending null clears the existing value; omission leaves it unchanged. Null is rejected during task creation. Required fields cannot be null.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and View a Task (Priority: P1)

A user submits a valid task title and optional task details, receives the created task, and can retrieve it by its unique ID.

**Why this priority**: Creating and reading tasks are the minimum operations required for a usable task API.

**Independent Test**: Start with an empty task collection, create one valid task, retrieve it by ID, and verify that the returned fields and defaults exactly match the request contract.

**Acceptance Scenarios**:

1. **Given** an empty task collection and valid JSON containing `title: "Prepare assignment"`, **When** `POST /tasks` is requested, **Then** the response is `201 Created`, the response body contains a unique non-empty ID and title, priority is `Medium`, status is `Pending`, and description and due date are their defined optional values.
2. **Given** a task was created successfully, **When** `GET /tasks/{id}` is requested, **Then** the response is `200 OK` and the body is identical in task data to the created task representation.
3. **Given** no task exists for an ID, **When** `GET /tasks/{id}` is requested, **Then** the response is `404 Not Found` with a safe, consistent error body.

---

### User Story 2 - List and Update Tasks (Priority: P1)

A user views the task collection and changes the title, description, priority, or due date of an existing task.

**Why this priority**: Listing and editing are core task-management operations and must be independently verifiable.

**Independent Test**: Create two tasks, list the collection, update selected fields on one task, and verify the stored and returned representations without changing the other task.

**Acceptance Scenarios**:

1. **Given** two tasks exist, **When** `GET /tasks` is requested, **Then** the response is `200 OK` and the body contains exactly both tasks in deterministic task-ID order.
2. **Given** an existing task, **When** `PATCH /tasks/{id}` contains valid field changes, **Then** the response is `200 OK`, only supplied fields change, omitted fields remain unchanged, and `id` cannot change.
3. **Given** a missing task ID, **When** `PATCH /tasks/{id}` contains a valid body, **Then** the response is `404 Not Found`.

---

### User Story 3 - Complete, Reopen, and Delete Tasks (Priority: P2)

A user marks a task completed or pending and deletes tasks that are no longer needed.

**Why this priority**: Status and deletion complete the required task lifecycle.

**Independent Test**: Create a task, change it to Completed and back to Pending, delete it, and verify subsequent retrieval and listing behavior.

**Acceptance Scenarios**:

1. **Given** an existing Pending task, **When** `PATCH /tasks/{id}/status` contains `status: "Completed"`, **Then** the response is `200 OK` and the response status is `Completed`.
2. **Given** an existing Completed task, **When** `PATCH /tasks/{id}/status` contains `status: "Pending"`, **Then** the response is `200 OK` and the response status is `Pending`.
3. **Given** an existing task, **When** `DELETE /tasks/{id}` is requested, **Then** the response is `204 No Content`, the task is absent, and later retrieval returns `404 Not Found`.

---

### User Story 4 - Reject Invalid and Malformed Requests Safely (Priority: P1)

A user or client sends malformed JSON or invalid task data and receives consistent, actionable, safe validation errors without modifying stored state.

**Why this priority**: Input validation and safe failures are required for predictable behavior and security.

**Independent Test**: Apply invalid create, update, and status requests to a known task collection and verify status codes, error contracts, and unchanged state.

**Acceptance Scenarios**:

1. **Given** a request body that is not valid JSON, **When** a task endpoint receives it, **Then** the response is `400 Bad Request` with a generic malformed-request error code and no task state change.
2. **Given** a create request with a missing or whitespace-only title, **When** `POST /tasks` is requested, **Then** the response is `400 Bad Request` and the error identifies `title`.
3. **Given** a task update with an unsupported priority, invalid due date, or attempted ID change, **When** `PATCH /tasks/{id}` is requested, **Then** the response is `400 Bad Request`, field-specific details are returned, and no fields change.
4. **Given** an invalid or malformed task ID, **When** a task-ID endpoint is requested, **Then** the response is `400 Bad Request`; for a correctly formatted but unknown ID, the response is `404 Not Found`.
5. **Given** an existing task with a description and due date, **When** `PATCH /tasks/{id}` contains `description: null` and `dueDate: null`, **Then** the response is `200 OK`, both fields are cleared to `null`, and all omitted fields remain unchanged.
6. **Given** a valid task title and `description: null` or `dueDate: null`, **When** `POST /tasks` is requested, **Then** the response is `400 Bad Request` and no task is created.

---

### Edge Cases

- An empty or whitespace-only title is rejected.
- A title or description exceeding the maximum length is rejected.
- Unknown JSON fields are rejected rather than silently ignored.
- Priority values are case-sensitive and limited to `Low`, `Medium`, and `High`.
- Status values are case-sensitive and limited to `Pending` and `Completed`.
- A due date must use ISO 8601 calendar-date form `YYYY-MM-DD` and must be a real calendar date; time components and relative dates are rejected.
- An update body must contain at least one allowed, mutable field.
- An update must not modify `id`, `status`, or any other field through the general update endpoint.
- Null is rejected for `title`, `description`, and `dueDate` in `POST /tasks`; the optional fields may instead be omitted.
- Null is accepted for existing `description` and `dueDate` fields in `PATCH /tasks/{id}` to clear those values; null is rejected for `title`, status, and immutable fields.
- When a field is omitted from an update, its existing value remains unchanged.
- Repeated create requests with identical bodies produce distinct task identities and separate task resources; no implicit deduplication is permitted.
- Empty collections return an array with no entries and `200 OK`.
- Malformed, unreadable, or invalid UTF-8 JSON is handled as `400 Bad Request`.
- Missing `Content-Type` or unsupported/non-`application/json` `Content-Type` is handled as `415 Unsupported Media Type`.
- Error responses must not echo secrets, raw parser internals, stack traces, credentials, or implementation paths.
- Two identical requests against identical state must produce the same response data and state transition.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST create a task from a JSON request containing a title and optional description, priority, and due date; `description` and `dueDate` MUST be strings when supplied and MUST NOT be null.
- **FR-002**: The system MUST assign each task a unique, non-empty, immutable ID and return it in the create and task representation responses.
- **FR-003**: The system MUST default a task priority to `Medium` when priority is omitted.
- **FR-004**: The system MUST default a task status to `Pending` when status is omitted because status is not a create-time field.
- **FR-005**: The system MUST retrieve a task by its exact ID.
- **FR-006**: The system MUST retrieve all tasks in a deterministic order, ordered by ascending task ID lexicographically.
- **FR-007**: The system MUST update only the description, priority, and due date fields for which values are supplied by a general update request.
- **FR-008**: The system MUST allow updating the title through the general update endpoint while preserving the task ID.
- **FR-009**: The system MUST reject general update requests that attempt to change ID or status.
- **FR-010**: The system MUST change task status to `Completed` or `Pending` only through the dedicated status endpoint.
- **FR-011**: The system MUST permanently remove an existing task and make it absent from later retrieval and listing operations.
- **FR-012**: The system MUST leave task state unchanged when request validation fails.
- **FR-013**: The system MUST validate all incoming string and JSON values before applying state changes.
- **FR-014**: The system MUST return `404 Not Found` for a correctly formatted but unknown task ID and `400 Bad Request` for a malformed task ID.
- **FR-015**: The system MUST return consistent error objects for malformed requests, validation failures, missing resources, and unsupported operations.
- **FR-016**: The system MUST reject unsupported HTTP methods and unknown API routes with a deterministic error response.
- **FR-017**: The system MUST reject unknown JSON fields on create and update bodies.
- **FR-018**: The system MUST preserve task values exactly except for explicitly supplied field changes and server-managed ID assignment.
- **FR-019**: The system MUST treat repeated reads and failed mutations deterministically against the same application state.
- **FR-020**: The system MUST implement every contract as an independently executable harness scenario linked to its functional requirement IDs.
- **FR-021**: The system SHALL retain tasks only in application memory and SHALL clear all task state on application restart.
- **FR-022**: The system SHALL generate server-side UUID v4 strings for task IDs and SHALL reject malformed or non-UUID-v4 task IDs.
- **FR-023**: A general update MAY set `description` or `dueDate` to `null` to clear it, SHALL leave omitted mutable fields unchanged, SHALL reject `null` for `title`, and SHALL reject `null` for `description` or `dueDate` during task creation.

### API Contract

The API uses JSON request and response bodies. All dates use `YYYY-MM-DD`. On `POST /tasks`, omitted optional fields use their defined defaults or `null` in response representation, but supplied `description` or `dueDate` values cannot be null. On `PATCH /tasks/{id}`, omitted fields remain unchanged and `null` clears `description` or `dueDate`.

| Method | Endpoint | Success | Request Body | Response |
|---|---|---:|---|---|
| `POST` | `/tasks` | `201` | `{ "title": string, "description"?: string, "priority"?: "Low"|"Medium"|"High", "dueDate"?: string }` | Task object |
| `GET` | `/tasks/{id}` | `200` | None | Task object |
| `GET` | `/tasks` | `200` | None | Array of task objects |
| `PATCH` | `/tasks/{id}` | `200` | `{ "title"?: string, "description"?: string|null, "priority"?: "Low"|"Medium"|"High", "dueDate"?: string|null }` | Task object |
| `PATCH` | `/tasks/{id}/status` | `200` | `{ "status": "Pending"|"Completed" }` | Task object |
| `DELETE` | `/tasks/{id}` | `204` | None | No response body |

#### Task Object

```json
{
  "id": "string",
  "title": "string",
  "description": null,
  "priority": "Medium",
  "status": "Pending",
  "dueDate": null
}
```

#### Error Object

Every error response SHALL use the following fields:

```json
{
  "code": "VALIDATION_ERROR | MALFORMED_REQUEST | NOT_FOUND | METHOD_NOT_ALLOWED | NOT_ALLOWED | ROUTE_NOT_FOUND",
  "message": "string",
  "details": []
}
```

A detail object SHALL contain `field`, `rule`, and `message`. Field names SHALL correspond to the request field or `request` for malformed content.

#### HTTP Status Behavior

- `201 Created`: Task created successfully; no `Location` header is required.
- `200 OK`: Read or mutation succeeded.
- `204 No Content`: Existing task deleted; response body is empty.
- `400 Bad Request`: Malformed or unreadable JSON, invalid field value, malformed ID, or empty update body.
- `404 Not Found`: Correctly formatted ID does not exist or route resource is missing.
- `405 Method Not Allowed`: Known route received an unsupported HTTP method.
- `413 Content Too Large`: Request body exceeds the maximum allowed size.
- `415 Unsupported Media Type`: Missing `Content-Type` or unsupported/non-`application/json` `Content-Type`.
- `500 Internal Server Error`: Unexpected server failure; must not expose internals.

### Validation Rules

- Title: required for create; string; 1-200 characters after trimming; leading and trailing whitespace is permitted in input but the stored and returned title SHALL contain no such outer whitespace.
- Description: create value is an optional string with maximum 2,000 characters; null is rejected; update value is an optional string or explicit `null`, with `null` clearing an existing value and omission leaving it unchanged.
- Priority: optional string; exact values `Low`, `Medium`, or `High`; default `Medium`.
- Status: exact values `Pending` or `Completed`; default `Pending` for created tasks; cannot be supplied during create or general update.
- Due date: create value is an optional string or omission; explicit `null` is rejected. Update value is an optional string or explicit `null`; an update string must exact `YYYY-MM-DD` and represent a valid Gregorian calendar date, while `null` clears the existing value and omission leaves it unchanged.
- Task ID: server-generated UUID v4 string; request IDs must match canonical UUID v4 format and contain no path separators.
- Create body: JSON object only; unknown fields are rejected; title is required; description and dueDate are optional strings and cannot be null; priority may be omitted.
- Update body: JSON object only; at least one of title, description, priority, or dueDate must be supplied; unknown fields and immutable fields are rejected.
- Status body: JSON object with exactly one `status` field; unknown fields are rejected.
- Request body: JSON object or array constraints must match the endpoint; maximum request size is 64 KiB.
- String fields must reject control characters below U+0020 except JSON escaping must not allow them in title or description.
- Numeric values, booleans, arrays, and objects are rejected wherever a string or object field is required.
- Requests with missing `Content-Type` or unsupported/non-`application/json` `Content-Type` return `415 Unsupported Media Type` before body processing.
- Valid JSON with a trailing extra value is malformed and rejected.

### Non-Functional Requirements

- **NFR-001**: Identical valid requests against identical application state MUST produce identical task data and state transitions.
- **NFR-002**: A harness SHALL be able to execute every functional requirement as a deterministic unit or contract test without accessing or modifying application internals.
- **NFR-003**: Static checks SHALL verify unsafe patterns, malformed project structure, and missing traceability markers independently of application runtime behavior.
- **NFR-004**: Security-oriented checks SHALL verify input validation, control-character rejection, safe errors, and absence of secrets or credentials in source, logs, and responses.
- **NFR-005**: Error messages SHALL omit stack traces, raw parser errors, internal file paths, credentials, and system secrets.
- **NFR-006**: The API SHALL process a 64 KiB request and produce a response deterministically within a harness timeout of 2 seconds in local test conditions.
- **NFR-007**: The implementation SHALL retain no random, time-dependent, or environment-dependent behavior in API responses for test scenarios.
- **NFR-008**: The repository SHALL preserve initial failing evidence, repair attempts within a predefined bound, and complete re-validation evidence for auditability.
- **NFR-009**: The feature SHALL remain limited to Part 1A and SHALL not depend on Part 1B AI services or evaluation infrastructure.

## Key Entities *(include if feature involves data)*

- **Task**: A task record containing immutable `id`, required `title`, optional `description`, `priority`, `status`, and optional `dueDate`.
- **Create Task Request**: JSON fields accepted to create a Task: title, description, priority, and dueDate.
- **Update Task Request**: JSON fields accepted to change mutable Task fields: title, description, priority, and dueDate.
- **Status Change Request**: JSON object containing exactly one status value, `Pending` or `Completed`.
- **Error Response**: Stable machine-readable object with code, message, and field details.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In an independent harness, 100% of defined create, retrieve, list, update, status, delete, and invalid-input acceptance scenarios execute and return the specified status and body contract.
- **SC-002**: At least 95% of independently derived deterministic functional scenarios pass in the initial positive-validation run after implementation; this criterion does not permit weakening tests or thresholds to obtain a pass.
- **SC-003**: Every functional requirement FR-001 through FR-023 has at least one named, reproducible harness test or contract scenario.
- **SC-004**: Every API status path documented in this specification is exercised by at least one harness scenario.
- **SC-005**: No security-oriented harness scenario detects secrets, unsafe reflection of input, stack-trace disclosure, or stored-state mutation after validation failure.
- **SC-006**: Repeating identical valid request sequences against reset and identical initial application state SHALL produce exact equality of all non-ID response fields and all final task data after normalization. Each run SHALL generate IDs in valid UUID v4 format, and all generated IDs SHALL be unique within that run. Generated IDs SHALL be normalized consistently to placeholders in both response bodies and final task collections before cross-run comparison.
- **SC-007**: Human reviewers can trace specification requirements, implementation points, harness checks, and evidence using repository documentation alone.

## Assumptions

- The API is a local REST service used without authentication for assignment demonstration; authentication and authorization are outside the feature scope.
- Task state is held in memory for the application process lifetime and is cleared when the application restarts.
- IDs are opaque UUID v4 strings generated by the server; harness tests validate UUID format and uniqueness without fixed ID values.
- The empty task collection is returned as `[]` with `200 OK`.
- Optional fields omitted from a create request use their defined defaults or `null` representation; omitted fields in an update leave existing values unchanged.
- Request JSON is UTF-8 encoded; invalid UTF-8 is treated as malformed content.
- Due dates are calendar values and do not represent times or time zones.
- Task ID ordering for lists is lexicographic and is independent of creation time.
- The general update endpoint does not change status; status changes use the dedicated endpoint.
- This specification records contract decisions for future plans and does not authorize application code, test code, or harness code.

## Traceability

- Task creation: FR-001 through FR-004, FR-012 through FR-023.
- Task retrieval and listing: FR-005, FR-006, FR-019, FR-022, FR-023.
- Task updates: FR-007 through FR-009, FR-012 through FR-023.
- Status changes: FR-010, FR-012 through FR-020.
- Deletion: FR-011 through FR-020.
- Validation and malformed requests: FR-012 through FR-017, FR-020, FR-022 through FR-023, NFR-001 through NFR-005.
- Determinism and evidence: FR-018 through FR-023, NFR-001, NFR-002, NFR-006 through NFR-009, SC-001 through SC-007.
