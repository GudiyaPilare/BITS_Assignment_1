# Data Model: Smart Todo and Task Management REST API

## Task

| Field | Type | Required | Rules |
|---|---|---|---|
| `id` | UUID v4 string | Server-generated | Immutable; unique; canonical UUID v4 format |
| `title` | string | Yes | 1-200 characters after trimming; outer whitespace removed |
| `description` | string or null | No | Maximum 2,000 characters; create rejects null; update null clears it |
| `priority` | enum string | No | `Low`, `Medium`, `High`; omitted priority defaults to `Medium` |
| `status` | enum string | Server-managed | `Pending`, `Completed`; default `Pending` |
| `dueDate` | string or null | No | ISO `YYYY-MM-DD`; real Gregorian date; update null clears it |

The task representation SHALL consistently include both `description` and `dueDate`, with `null` when no value is set. These fields are optional in create input but required in the returned task representation.

## State and Transitions

- Initial state: Empty in-memory collection.
- Create: Generate UUID v4, assign default priority and status, store under ID.
- Retrieve: Return a copy of the exact task record.
- List: Return every task ordered by lexicographic ID.
- General update: Change only supplied mutable fields; omitted fields remain unchanged.
- Clear: Set `description` or `dueDate` to null only through general update.
- Status update: Change only `status` to Pending or Completed.
- Delete: Remove the task permanently within the process lifetime.
- Restart: Clear all task state.

## Validation Entities

### Error Detail

- `field`: Request field or `request`.
- `rule`: Stable validation rule name.
- `message`: Safe human-readable explanation.

### Error Response

- `code`: `VALIDATION_ERROR`, `MALFORMED_REQUEST`, `NOT_FOUND`, `METHOD_NOT_ALLOWED`, `NOT_ALLOWED`, or `ROUTE_NOT_FOUND`.
- `message`: Safe request outcome summary.
- `details`: Array of error detail objects.

`NOT_ALLOWED` is retained for consistency with the specification. Its trigger condition and HTTP status are currently undefined; this model does not assign behavior to it.

## Identity Rules

- IDs are server-owned and immutable.
- Request IDs must be canonical UUID v4 strings.
- Repeated creates generate distinct IDs.
- Task collection order is independent of creation time.
