import { checkSchema } from './schema-check.js';
import { checkInvariants } from './invariant-check.js';
import { checkSemantic } from './semantic-check.js';

const input = 'Prepare the quarterly risk report by 15 January 2027. This is urgent.';

const task = {
  title: 'Prepare quarterly risk report',
  description: 'Complete the urgent quarterly risk report.',
  priority: 'High',
  dueDate: '2027-01-15',
  needsClarification: false,
  clarificationQuestion: null
};

const expected = {
  expectedPriority: 'High',
  expectedDueDate: '2027-01-15',
  mustClarify: false
};

const results = [
  ['Schema', checkSchema(task)],
  ['Invariants', checkInvariants(input, task, expected)],
  ['Semantic', checkSemantic(input, task)]
];

for (const [name, result] of results) {
  console.log(`${name}: ${result.pass ? 'PASS' : 'FAIL'}`);
  if (result.errors.length) console.log(result.errors);
}

if (results.some(([, result]) => !result.pass)) {
  process.exitCode = 1;
}
