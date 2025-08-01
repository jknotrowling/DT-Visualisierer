// Test script for negation handling
import { normalizeExpression, normalizedExpressionToLatex } from './src/logic/parser.js';

// Test verschiedene Negations-Ausdrücke
const testExpressions = ['!c', '!C', 'A&!B', '!A|B', 'not C', '¬A'];

console.log('Testing negation handling:');
testExpressions.forEach(expr => {
  const normalized = normalizeExpression(expr);
  const latex = normalizedExpressionToLatex(normalized);
  console.log(`Input: ${expr} -> Normalized: ${normalized} -> LaTeX: ${latex}`);
});
