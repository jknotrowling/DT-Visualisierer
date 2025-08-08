import { normalizeExpression, parseLogicFunction } from '../src/logic/parser.js';

console.log('Testing negation simplification:');

const testCases = [
  'B',
  '!B', 
  '!!B',
  '!!!B',
  '!!!!B',
  '!(!(!(!(B))))'
];

testCases.forEach(expr => {
  try {
    console.log(`\nInput: ${expr}`);
    const normalized = normalizeExpression(expr);
    console.log(`Normalized: ${normalized}`);
    
    const truthTable = parseLogicFunction(expr, 2);
    console.log(`Truth table: [${truthTable.join(', ')}]`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
});
