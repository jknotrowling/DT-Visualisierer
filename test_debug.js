import { parseLogicFunction, normalizeExpression } from './src/logic/parser.js';

console.log('=== Umfassende Tests nach der Korrektur ===\n');

// Test 1: Ursprünglich problematischer Ausdruck
console.log('Test 1: XOR-Problem');
const testExpression = '!(!A&!C|!A&B)XOR(!A&!C|!A&B)';
try {
  const normalized = normalizeExpression(testExpression);
  console.log('✅ Normalisiert:', normalized);
  const result = parseLogicFunction(testExpression, 3);
  console.log('✅ Ergebnis:', result);
} catch (error) {
  console.log('❌ Fehler:', error.message);
}

// Test 2: Verschiedene XOR-Schreibweisen
console.log('\nTest 2: Verschiedene XOR-Schreibweisen');
const xorTests = ['A XOR B', 'A xor B', 'A ⊕ B'];
xorTests.forEach(expr => {
  try {
    const normalized = normalizeExpression(expr);
    console.log(`✅ "${expr}" -> "${normalized}"`);
  } catch (error) {
    console.log(`❌ "${expr}": ${error.message}`);
  }
});

// Test 3: Ungültige Zahlen
console.log('\nTest 3: Ungültige Zahlen');
try {
  normalizeExpression('A & 2');
  console.log('❌ Sollte Fehler werfen');
} catch (error) {
  console.log('✅ Korrekt:', error.message);
}

// Test 4: Gültige Zahlen
console.log('\nTest 4: Gültige Zahlen');
try {
  const result = normalizeExpression('A & 0 | 1');
  console.log('✅ Gültig:', result);
} catch (error) {
  console.log('❌ Fehler:', error.message);
}

// Test 5: Ungültige Variablen (nach XOR-Normalisierung)
console.log('\nTest 5: Ungültige Variablen');
try {
  normalizeExpression('A & E'); // E ist nicht in VARIABLE_NAMES = ["A", "B", "C", "D"]
  console.log('❌ Sollte Fehler werfen');
} catch (error) {
  console.log('✅ Korrekt:', error.message);
}

// Test 6: Komplexer Ausdruck mit allen erlaubten Elementen
console.log('\nTest 6: Komplexer gültiger Ausdruck');
try {
  const complex = '(A & B) | (!C & D) ^ (A XOR B) & 1 | 0';
  const normalized = normalizeExpression(complex);
  console.log('✅ Komplex normalisiert:', normalized);
  const result = parseLogicFunction(complex, 4);
  console.log('✅ Komplex Ergebnis length:', result.length);
} catch (error) {
  console.log('❌ Fehler:', error.message);
}

console.log('\n=== Tests abgeschlossen ===');
