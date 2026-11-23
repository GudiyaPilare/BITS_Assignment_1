import { checkSchema } from './schema-check.js';

const valid = {
  title: 'Prepare risk report',
  description: 'Prepare the quarterly risk report',
  priority: 'High',
  dueDate: '2027-01-15',
  needsClarification: false,
  clarificationQuestion: null
};

const invalid = {
  title: '',
  description: 'Test',
  priority: 'Urgent',
  dueDate: '2027-02-30',
  needsClarification: true,
  clarificationQuestion: null
};

console.log('Valid case:', checkSchema(valid));
console.log('Invalid case:', checkSchema(invalid));
