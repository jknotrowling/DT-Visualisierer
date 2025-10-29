import { VARIABLE_NAMES } from "../state.js";
import { bin } from "../utils/utils.js";
import { minimize } from "./bool.js";
import { logicState } from "../state.js";
import { AST } from "./ast.js";

/**
 * Parses a logical function expression and generates its truth table.
 *
 * @param {string} expr - The logical function expression to parse (e.g., "A & B | !C").
 * @param {number} nVars - The number of variables to consider (must be between 1 and VARIABLE_NAMES.length).
 * @returns {number[]} An array representing the truth table for the given expression, where each entry is 0 or 1.
 */
export function parseLogicFunction(expr, nVars) {
  if (typeof expr !== 'string' || expr.trim() === '') {
    throw new Error('Der Ausdruck muss ein nicht-leerer String sein.');
  }
  if (!Number.isInteger(nVars) || nVars < 2 || nVars > VARIABLE_NAMES.length) {
    throw new Error(`nVars muss eine ganze Zahl zwischen 2 und ${VARIABLE_NAMES.length} sein.`);
  }

  const validVariables = VARIABLE_NAMES.slice(0, nVars);
  const normalizedExpr = normalizeExpression(expr);
  const ast = new AST(normalizedExpr);

  const truthArray = [];
  const totalCombinations = 1 << nVars;

  for (let i = 0; i < totalCombinations; i++) {
    const bits = bin(i, nVars);
    const variableValues = {};

    for (let j = 0; j < nVars; j++) {
      variableValues[validVariables[j]] = parseInt(bits[j]);
    }

    const result = ast.evaluate(variableValues);
    truthArray.push(result ? 1 : 0);
  }

  return truthArray;
}

/**
 * Normalisiert einen booleschen Ausdruck, indem verschiedene Operator-Aliase
 * durch einen einheitlichen Satz von Operatoren ersetzt werden, die vom AST-Parser verwendet werden.
 * Diese Funktion führt KEINE logischen Vereinfachungen durch.
 * 
 * @param {string} expr Der Eingabe-Ausdruck.
 * @returns {string} Der normalisierte Ausdruck.
 */
export function normalizeExpression(expr) {
  let normalized = expr.trim();

  // Neue Operatoren zuerst auf interne Symbole normalisieren
  normalized = normalized.replace(/\b(nand|NAND)\b/g, '#');
  normalized = normalized.replace(/![\*]/g, '#'); 

  normalized = normalized.replace(/\b(nor|NOR)\b/g, '$');
  normalized = normalized.replace(/![+]/g, '$');

  normalized = normalized.replace(/\b(xnor|XNOR)\b/g, '=');
  normalized = normalized.replace(/![\^]/g, '=');

  // Textuelle Operatoren zuerst ersetzen, um Konflikte zu vermeiden (z.B. 'and' vs 'd')
  normalized = normalized.replace(/\b(and|AND)\b/g, '&');
  normalized = normalized.replace(/\b(or|OR)\b/g, '|');
  normalized = normalized.replace(/\b(not|NOT)\s*/g, '!'); // Nachfolgendes Leerzeichen entfernen
  normalized = normalized.replace(/\b(xor|XOR)\b/g, '^');

  // Symbolische Operatoren ersetzen
  normalized = normalized.replace(/[*∧]/g, '&');
  normalized = normalized.replace(/[+∨]/g, '|');
  normalized = normalized.replace(/[¬~]/g, '!');
  normalized = normalized.replace(/[⊕]/g, '^');

  return normalized;
}

/**
 * Wandelt einen normalisierten booleschen Ausdruck in einen LaTeX-String um.
 * Diese Funktion führt keine Vereinfachung durch.
 * 
 * @param {string} expr Der Eingabe-Ausdruck.
 * @returns {string} Der LaTeX-formatierte String.
 */
export function expressionToLatex(expr) {
  if (!expr || typeof expr !== 'string') {
    return '';
  }
  const normalizedExpr = normalizeExpression(expr);
  const ast = new AST(normalizedExpr);
  return ast.toLatex();
}

/**
 * Nimmt einen rohen Ausdruck, erstellt einen AST und gibt eine saubere,
 * standardisierte String-Darstellung des Ausdrucks ohne Vereinfachung zurück.
 * 
 * @param {string} expr Der rohe Ausdruck.
 * @returns {string} Der standardisierte Ausdruck als String.
 */
export function getNormalizedString(expr) {
    if (!expr || typeof expr !== 'string') {
        return '';
    }
    const normalizedExpr = normalizeExpression(expr);
    const ast = new AST(normalizedExpr);
    return ast.toString();
}


/**
 * Berechnet den minimalen DNF-Ausdruck aus dem aktuellen Zustand der Wahrheitstabelle.
 * Diese Funktion ist nicht direkt mit dem AST-Parser verbunden, verwendet aber dessen Ausgabe.
 * @returns {string} Der minimale Ausdruck in DNF-Form (z.B. "A&!B | C").
 */
export function getMinimalExpression() {
  const minterms = logicState.truth
    .filter((r) => r.out === 1)
    .map((r) => parseInt(r.bits, 2));

  if (minterms.length === 0) return "0";
  if (minterms.length === logicState.truth.length) return "1";

  const dcs = logicState.truth
    .filter((r) => r.out === null)
    .map((r) => parseInt(r.bits, 2));

  const minimizedTerms = minimize(logicState.nVars, minterms, dcs);

  const terms = minimizedTerms.map(term => {
    return term
      .split('')
      .map((bit, i) => {
        if (bit === '-') return null;
        return bit === '1' ? VARIABLE_NAMES[i] : `!${VARIABLE_NAMES[i]}`;
      })
      .filter(literal => literal !== null)
      .join('&');
  });

  return terms.join('|');
}
