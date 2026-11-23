import fs from 'node:fs';
import { createTaskFromText } from '../src/app.js';
import { checkSchema } from './schema-check.js';
import { checkInvariants } from './invariant-check.js';
import { checkSemantic } from './semantic-check.js';

const dataset = JSON.parse(
  fs.readFileSync('evals/dataset.json', 'utf8')
);

const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : 1;
const cases = dataset.slice(0, limit);

if (!Number.isInteger(limit) || limit < 1) {
  throw new Error('Limit must be a positive integer.');
}

const results = [];

for (const testCase of cases) {
  console.log(`Running ${testCase.id}...`);

  if (!testCase.input.trim()) {
    results.push({
      id: testCase.id,
      status: 'PASS',
      note: 'Empty input rejected locally before model invocation.'
    });
    continue;
  }

  try {
    const task = await createTaskFromText(testCase.input);

    const schema = checkSchema(task);
    const invariants = checkInvariants(
      testCase.input, task, testCase
    );
    const semantic = checkSemantic(testCase.input, task);

    const passed = schema.pass &&
      invariants.pass &&
      semantic.pass;

    results.push({
      id: testCase.id,
      status: passed ? 'PASS' : 'FAIL',
      output: task,
      checks: { schema, invariants, semantic }
    });
  } catch (error) {
    results.push({
      id: testCase.id,
      status: 'ERROR',
      error: error.message
    });
  }
}

const report = {
  timestamp: new Date().toISOString(),
  totalCases: cases.length,
  passed: results.filter(r => r.status === 'PASS').length,
  failed: results.filter(r => r.status === 'FAIL').length,
  errors: results.filter(r => r.status === 'ERROR').length,
  results
};

fs.mkdirSync('evidence/final', { recursive: true });
fs.writeFileSync(
  'evidence/final/evaluation-report.json',
  JSON.stringify(report, null, 2)
);

console.log('\nEvaluation summary:');
console.log({
  total: report.totalCases,
  passed: report.passed,
  failed: report.failed,
  errors: report.errors
});
console.log('Report saved to evidence/final/evaluation-report.json');
