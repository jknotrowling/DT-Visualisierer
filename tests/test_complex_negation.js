import { normalizeExpression, parseLogicFunction } from '../src/logic/parser.js';

console.log('Testing more complex negation cases:');

const testCases = [
  '!(!(!(B)))', // 3 negations -> !B
  '!(!(!(!(!(B)))))', // 5 negations -> !B
  '!(A) & !(!(B))', // !A & B
  '!(!(A)) | !(!(!(C)))', // A | !C
  '!(!(!(!(A & B))))', // A & B (4 negations)
  '!(!(!(A))) & B', // !A & B (3 negations on A)
];

testCases.forEach(expr => {
  try {
    console.log(`\nInput: ${expr}`);
    const normalized = normalizeExpression(expr);
    console.log(`Normalized: ${normalized}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
});
