export function checkInvariants(input, task, expected) {
  const errors = [];

  if (expected.mustClarify && !task.needsClarification) {
    errors.push('Expected clarification but none was requested');
  }

  if (!expected.mustClarify && task.needsClarification) {
    errors.push('Unexpected clarification requested');
  }

  if (task.dueDate !== expected.expectedDueDate) {
    errors.push('Due date does not match expected value');
  }

  if (
    expected.expectedPriority &&
    task.priority !== expected.expectedPriority
  ) {
    errors.push('Priority does not match expected value');
  }

  if (!input.trim()) {
    errors.push('Empty input must be rejected before model invocation');
  }

  return { pass: errors.length === 0, errors };
}
