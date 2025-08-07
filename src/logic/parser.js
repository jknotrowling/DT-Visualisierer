import { VARIABLE_NAMES } from "../state.js";
import { bin } from "../utils/utils.js";

/**
 * Parses a logical function expression and generates its truth table.
 *
 * @param {string} expr - The logical function expression to parse (e.g., "A & B | !C").
 * @param {number} nVars - The number of variables to consider (must be between 1 and VARIABLE_NAMES.length).
 * @returns {number[]} An array representing the truth table for the given expression, where each entry is 0 or 1.
 * @throws {Error} If the expression is not a non-empty string.
 * @throws {Error} If nVars is not a valid integer within the allowed range.
 * @throws {Error} If the expression contains invalid variables.
 * @throws {Error} If there is an error evaluating the expression for any input combination.
 */

export function parseLogicFunction(expr, nVars) {
  if (typeof expr !== 'string' || expr.trim() === '') {
    throw new Error('Der Ausdruck muss ein nicht-leerer String sein.');
  }
  if (!Number.isInteger(nVars) || nVars < 2 || nVars > VARIABLE_NAMES.length) {
    throw new Error(`nVars muss eine ganze Zahl zwischen 2 und ${VARIABLE_NAMES.length} sein.`);
  }

  const validVariables = VARIABLE_NAMES.slice(0, nVars);

  // Normalisiere den Ausdruck
  let normalizedExpr = normalizeExpression(expr);

  // Überprüfe, ob alle verwendeten Variablen gültig sind
  const usedVars = Array.from(new Set(normalizedExpr.match(/[A-Za-z]/g)));
  if (usedVars.some(v => !validVariables.includes(v.toUpperCase()))) {
    throw new Error(`Der Ausdruck enthält ungültige Variablen. Erlaubt sind: ${validVariables.join(', ')}`);
  }

  // Erstelle Truth-Array für alle möglichen Eingaben
  const truthArray = [];
  const totalCombinations = 1 << nVars; // 2^nVars

  for (let i = 0; i < totalCombinations; i++) {
    const bits = bin(i, nVars); // MSB first (aufsteigend sortiert)
    const variableValues = {};

    // Setze Variablenwerte basierend auf den Bits (MSB first)
    for (let j = 0; j < nVars; j++) {
      variableValues[validVariables[j]] = parseInt(bits[j]);
    }

    // Bewerte den Ausdruck mit den aktuellen Variablenwerten
    let result;
    try {
      result = evaluateExpression(normalizedExpr, variableValues);
    } catch (error) {
      throw new Error(`Fehler beim Auswerten des Ausdrucks für Eingabe ${bits.join('')}: ${error.message}`);
    }
    truthArray.push(result ? 1 : 0);
  }

  return truthArray;
}

export function normalizeExpression(expr) {
  const validKonjunktions = ["*", "&", "∧"];
  const validDisjunktions = ["+", "|", "∨"];
  const validNegations = ["not", "¬", "!", "~"];
  const validXOR = ["⊕", "xor"];
  const validImplications = ["→", "⇒"];
  const validEquivalences = ["↔", "≡"];

  let normalized = expr.trim();
  
  // Ersetze alle Konjunktions-Operatoren durch &
  validKonjunktions.forEach(op => {
    normalized = normalized.replaceAll(op, '&');
  });

  // Ersetze alle Disjunktions-Operatoren durch |
  validDisjunktions.forEach(op => {
    normalized = normalized.replaceAll(op, '|');
  });

  // Ersetze alle XOR-Operatoren durch ^
  validXOR.forEach(op => {
    if (op.toLowerCase() === 'xor') {
      normalized = normalized.replace(/\bXOR\b/gi, '^');
    } else {
      normalized = normalized.replaceAll(op, '^');
    }
  });

  // Ersetze Implikationen durch entsprechende logische Ausdrücke (!A | B)
  validImplications.forEach(op => {
    normalized = normalized.replaceAll(op, '->');
  });

  // Ersetze Äquivalenzen durch entsprechende logische Ausdrücke ((A & B) | (!A & !B))
  validEquivalences.forEach(op => {
    normalized = normalized.replaceAll(op, '<->');
  });

  // Ersetze not() Funktionen durch ! (verbessert)
  normalized = normalized.replace(/not\s*\(\s*([^)]+)\s*\)/g, '!($1)');

  // Ersetze andere Negations-Operatoren durch !
  validNegations.forEach(op => {
    if (op !== '!' && op !== 'not') {
      normalized = normalized.replaceAll(op, '!');
    }
  });

  // Füge implizite Konjunktionen hinzu (z.B. AB -> A&B)
  normalized = addImplicitConjunctions(normalized);

  return normalized;
}

function addImplicitConjunctions(expr) {
  let changed = true;
  
  while (changed) {
    let oldExpr = expr;
    
    // Füge & zwischen Variablen und öffnenden Klammern hinzu (aber nicht nach !)
    expr = expr.replace(/([A-Za-z])\s*\(/g, '$1&(');
    
    // Füge & zwischen Zahlen (0 oder 1) und öffnenden Klammern hinzu
    expr = expr.replace(/([01])\s*\(/g, '$1&(');
    
    // Füge & zwischen schließenden Klammern und Variablen hinzu
    expr = expr.replace(/\)\s*([A-Za-z])/g, ')&$1');
    
    // Füge & zwischen schließenden Klammern und Zahlen (0 oder 1) hinzu
    expr = expr.replace(/\)\s*([01])/g, ')&$1');
    
    // Füge & zwischen schließenden Klammern und not() hinzu
    expr = expr.replace(/\)\s*(not\s*\()/g, ')&$1');
    
    // Füge & zwischen schließenden Klammern und ! hinzu
    expr = expr.replace(/\)\s*(!+\()/g, ')&$1');
    
    // Füge & zwischen aufeinanderfolgenden Variablen hinzu (auch mit Negation)
    // Behandle Fälle wie "AB", "!AB", "A!B", etc.
    expr = expr.replace(/([A-Za-z])\s*([A-Za-z])/g, '$1&$2');
    expr = expr.replace(/([A-Za-z])\s*(!+[A-Za-z])/g, '$1&$2');
    expr = expr.replace(/(!+[A-Za-z])\s*([A-Za-z])/g, '$1&$2');
    expr = expr.replace(/(!+[A-Za-z])\s*(!+[A-Za-z])/g, '$1&$2');
    
    // Füge & zwischen Zahlen (0 oder 1) und Variablen hinzu (z.B. "1A", "0B")
    expr = expr.replace(/([01])\s*([A-Za-z])/g, '$1&$2');
    expr = expr.replace(/([01])\s*(!+[A-Za-z])/g, '$1&$2');
    
    // Füge & zwischen Variablen und Zahlen (0 oder 1) hinzu (z.B. "A1", "B0")
    expr = expr.replace(/([A-Za-z])\s*([01])/g, '$1&$2');
    expr = expr.replace(/(!+[A-Za-z])\s*([01])/g, '$1&$2');
    
    // Füge & zwischen aufeinanderfolgenden Zahlen (0 oder 1) hinzu (z.B. "10", "01")
    expr = expr.replace(/([01])\s*([01])/g, '$1&$2');
    
    // Prüfe, ob sich etwas geändert hat
    changed = (oldExpr !== expr);
  }
  
  return expr;
}

function evaluateExpression(expr, variableValues) {
  
  // Ersetze Variablen durch ihre Werte
  Object.keys(variableValues).forEach(varName => {
    const value = variableValues[varName];
    // Ersetze sowohl Groß- als auch Kleinbuchstaben
    expr = expr.replace(new RegExp(`\\b${varName}\\b`, 'gi'), value);
  });
  
  // Ersetze logische Operatoren durch JavaScript-Äquivalente
  expr = expr.replace(/&/g, '&&');
  expr = expr.replace(/\|/g, '||');
  expr = expr.replace(/\^/g, '!='); // XOR als Ungleichheit
  expr = expr.replace(/!/g, '!');
  
  // Führe die Auswertung aus
  
  return eval(expr);
  
}


export function normalizedExpressionToLatex(expr) {
  if (!expr || typeof expr !== 'string') {
    return '';
  }

  let rendered = expr.trim();

  // Behandle Negationen mit Überstrichen zuerst
  // Finde !(...) Blöcke und ersetze sie durch LaTeX overline
  rendered = rendered.replace(/!(\([^)]+\))/g, '\\overline{$1}');
  
  // Einzelne Negationen (z.B. !A, !a, !c)
  rendered = rendered.replace(/!([A-Za-z])/g, '\\overline{$1}');
  
  // Ersetze normalisierte Operatoren durch LaTeX-Symbole (Input ist bereits normalisiert)
  
  // Konjunktionen (UND) - wird gerendert als \land
  rendered = rendered.replace(/&/g, ' \\;\\& \\;');
  
  // Disjunktionen (ODER) - wird gerendert als \lor
  rendered = rendered.replace(/\|/g, ' \\lor ');
  
  // XOR - wird gerendert als \oplus
  rendered = rendered.replace(/\^/g, ' \\oplus ');
  
  // Implikationen - wird gerendert als \Rightarrow
  rendered = rendered.replace(/->/g, ' \\Rightarrow ');
  
  // Äquivalenzen - wird gerendert als \Leftrightarrow
  rendered = rendered.replace(/<->/g, ' \\Leftrightarrow ');
  
  // Bereinige überflüssige Leerzeichen
  rendered = rendered.replace(/\s+/g, ' ').trim();
  
  return rendered;
}

