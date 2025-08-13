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
  
  // 1. Normalize operator strings (e.g., 'and' -> '&')
  const normalizedExpr = normalizeExpression(expr);
  
  // 2. Build the Abstract Syntax Tree
  const ast = new AST(normalizedExpr);

  // 3. Generate truth table by evaluating the AST for each input combination
  const truthArray = [];
  const totalCombinations = 1 << nVars;

  for (let i = 0; i < totalCombinations; i++) {
    const bits = bin(i, nVars);
    const variableValues = {};

    for (let j = 0; j < nVars; j++) {
      variableValues[validVariables[j]] = parseInt(bits[j]);
    }

    // Evaluate expression using the AST
    const result = ast.evaluate(ast.root, variableValues);
    truthArray.push(result ? 1 : 0);
  }

  return truthArray;
}

/**
 * Normalizes a boolean expression by replacing various operator aliases 
 * with a standard set of operators used by the AST parser.
 * This function does NOT perform logical simplifications.
 * 
 * @param {string} expr The input expression.
 * @returns {string} The normalized expression.
 */
export function normalizeExpression(expr) {
  let normalized = expr.trim();

  // Replace textual operators first to avoid conflicts (e.g., 'and' vs 'd')
  normalized = normalized.replace(/\b(and|AND)\b/g, '&');
  normalized = normalized.replace(/\b(or|OR)\b/g, '|');
  normalized = normalized.replace(/\b(not|NOT)\s*/g, '!'); // Consume trailing space
  normalized = normalized.replace(/\b(xor|XOR)\b/g, '^');

  // Replace symbolic operators
  normalized = normalized.replace(/[*∧]/g, '&');
  normalized = normalized.replace(/[+∨]/g, '|');
  normalized = normalized.replace(/[¬~]/g, '!');
  normalized = normalized.replace(/[⊕]/g, '^');

  return normalized;
}

/**
 * Converts a normalized boolean expression to a LaTeX string.
 * This function does not perform any simplification.
 * 
 * @param {string} expr The input expression.
 * @returns {string} The LaTeX-formatted string.
 */
export function normalizedExpressionToLatex(expr) {
  if (!expr || typeof expr !== 'string') {
    return '';
  }
  // 1. Normalize the expression to handle aliases
  const normalizedExpr = normalizeExpression(expr);
  // 2. Build the AST
  const ast = new AST(normalizedExpr);
  // 3. Convert AST to LaTeX
  return ast.toLatex();
}

/**
 * Takes a raw expression, builds an AST, and returns a clean,
 * standardized string representation of the expression without simplification.
 * 
 * @param {string} expr The raw expression.
 * @returns {string} The standardized expression string.
 */
export function getNormalizedString(expr) {
    if (!expr || typeof expr !== 'string') {
        return '';
    }
    const normalizedExpr = normalizeExpression(expr);
    const ast = new AST(normalizedExpr);
    return ast.toString(ast.root, false); // false = no simplification
}


/**
 * Calculates the minimal DNF expression from the current truth table state.
 * This function is not directly related to the AST parser but uses its output.
 * @returns {string} The minimal expression in DNF form (e.g., "A&!B | C").
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
