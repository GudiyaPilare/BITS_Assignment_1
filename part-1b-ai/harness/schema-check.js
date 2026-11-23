export function checkSchema(task) {
  const errors = [];

  if (!task || typeof task !== 'object' || Array.isArray(task)) {
    return { pass: false, errors: ['Output must be a JSON object'] };
  }

  const required = [
    'title',
    'description',
    'priority',
    'dueDate',
    'needsClarification',
    'clarificationQuestion'
  ];

  for (const key of required) {
    if (!(key in task)) errors.push(`Missing field: ${key}`);
  }

  if (typeof task.title !== 'string' || !task.title.trim())
    errors.push('Title must be a non-empty string');

  if (typeof task.description !== 'string')
    errors.push('Description must be a string');

  if (!['Low', 'Medium', 'High'].includes(task.priority))
    errors.push('Invalid priority');

  if (
    task.dueDate !== null &&
    (typeof task.dueDate !== 'string' ||
     !/^\d{4}-\d{2}-\d{2}$/.test(task.dueDate) ||
     new Date(task.dueDate + 'T00:00:00Z').toISOString().slice(0, 10) !== task.dueDate)
  ) errors.push('Due date must be null or a valid YYYY-MM-DD date');

  if (typeof task.needsClarification !== 'boolean')
    errors.push('needsClarification must be boolean');

  if (
    task.clarificationQuestion !== null &&
    typeof task.clarificationQuestion !== 'string'
  ) errors.push('clarificationQuestion must be null or a string');

  if (task.needsClarification && !task.clarificationQuestion)
    errors.push('Clarification question required when clarification is needed');

  return { pass: errors.length === 0, errors };
}
