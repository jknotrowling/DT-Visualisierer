import { parseLogicFunction, normalizeExpression } from '../src/logic/parser.js';

const testExpression = '!(!A&!C|!A&B)(!A&!C|!A&B)';

console.log('Testing implicit conjunction:', testExpression);

try {
  console.log('Step 1: Normalization...');
  const normalized = normalizeExpression(testExpression);
  console.log('Normalized:', normalized);
  
  console.log('Step 2: Parse function...');
  const result = parseLogicFunction(testExpression, 3);
  console.log('Result:', result);
} catch (error) {
  console.log('Error:', error.message);
}
