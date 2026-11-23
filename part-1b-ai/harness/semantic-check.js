export function checkSemantic(input, task) {
  const errors = [];

  const ignored = new Set([
    'the', 'a', 'an', 'to', 'by', 'for', 'and',
    'or', 'is', 'it', 'this', 'that', 'with',
    'create', 'task', 'prepare', 'please'
  ]);

  const withoutDates = input
    .toLowerCase()
    .replace(/\b\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}\b/g, '')
    .replace(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/g, '')
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '')
    .replace(/\b\d{4}\b/g, '');

  const terms = withoutDates.match(/[a-z0-9]+/g) || [];

  const importantTerms = [...new Set(
    terms.filter(word => word.length > 3 && !ignored.has(word))
  )];

  const output = `${task.title} ${task.description}`.toLowerCase();

  const missing = importantTerms.filter(
    word => !output.includes(word)
  );

  if (missing.length > 0) {
    errors.push(`Important input terms not preserved: ${missing.join(', ')}`);
  }

  return {
    pass: errors.length === 0,
    checkedTerms: importantTerms,
    errors
  };
}
