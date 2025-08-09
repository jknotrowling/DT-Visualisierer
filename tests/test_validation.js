import { parseLogicFunction, normalizeExpression } from '../src/logic/parser.js';

console.log('Testing new validation features...\n');

// Test 1: Ungültige Zahlen
console.log('Test 1: Ungültige Zahlen');
try {
  normalizeExpression('A & 2');
  console.log('❌ Fehler: Sollte einen Fehler bei Zahl 2 werfen');
} catch (error) {
  console.log('✅ Korrekt:', error.message);
}

try {
  normalizeExpression('A & 5 | B');
  console.log('❌ Fehler: Sollte einen Fehler bei Zahl 5 werfen');
} catch (error) {
  console.log('✅ Korrekt:', error.message);
}

// Test 2: Gültige Zahlen (0 und 1)
console.log('\nTest 2: Gültige Zahlen');
try {
  const result = normalizeExpression('A & 0 | 1');
  console.log('✅ Korrekt: 0 und 1 sind erlaubt ->', result);
} catch (error) {
  console.log('❌ Fehler:', error.message);
}

// Test 3: Ungültige Variablen
console.log('\nTest 3: Ungültige Variablen');
try {
  normalizeExpression('A & E');
  console.log('❌ Fehler: Sollte einen Fehler bei Variable E werfen');
} catch (error) {
  console.log('✅ Korrekt:', error.message);
}

try {
  normalizeExpression('X | Y');
  console.log('❌ Fehler: Sollte einen Fehler bei Variablen X, Y werfen');
} catch (error) {
  console.log('✅ Korrekt:', error.message);
}

// Test 4: Gültige Variablen
console.log('\nTest 4: Gültige Variablen');
try {
  const result = normalizeExpression('A & B | C & D');
  console.log('✅ Korrekt: A, B, C, D sind erlaubt ->', result);
} catch (error) {
  console.log('❌ Fehler:', error.message);
}

// Test 5: Kombination von gültigen und ungültigen Elementen
console.log('\nTest 5: Gemischte Tests');
try {
  parseLogicFunction('A & 3 | B', 3);
  console.log('❌ Fehler: Sollte einen Fehler werfen');
} catch (error) {
  console.log('✅ Korrekt:', error.message);
}

try {
  const result = parseLogicFunction('A & 1 | B & 0', 3);
  console.log('✅ Korrekt: Gültiger Ausdruck ->', result);
} catch (error) {
  console.log('❌ Fehler:', error.message);
}

console.log('\nTests abgeschlossen!');
