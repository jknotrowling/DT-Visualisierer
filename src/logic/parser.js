import { VARIABLE_NAMES } from "../state.js";
import { bin } from "../utils/utils.js";
import { minimize } from "./booleanForm.js";
import { logicState } from "../state.js";

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

  // Normalisiere den Ausdruck (enthält bereits Variablen- und Zahlenvalidierung)
  let normalizedExpr = normalizeExpression(expr);

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
      throw new Error(`Dieser Ausdruck ist ungültig: ${expr}`);
    }
    truthArray.push(result ? 1 : 0);
  }

  return truthArray;
}

export function normalizeExpression(expr) {
  const validKonjunktions = ["*", "&", "∧", "and"];
  const validDisjunktions = ["+", "|", "∨", "or"];
  const validNegations = ["not", "¬", "!", "~"];
  const validXOR = ["⊕", "xor"];
  // const validImplications = ["→", "⇒"];
  // const validEquivalences = ["↔", "≡"];

  let normalized = expr.trim();
  
  // Erst die Operatoren normalisieren, bevor wir Variablen validieren
  
  // Ersetze alle XOR-Operatoren durch ^ (zuerst, da "XOR" Buchstaben enthält)
  validXOR.forEach(op => {
    if (op.toLowerCase() === 'xor') {
      normalized = normalized.replace(/\bXOR\b/gi, '^');
    } else {
      normalized = normalized.replaceAll(op, '^');
    }
  });
  
  // Ersetze alle Konjunktions-Operatoren durch &
  validKonjunktions.forEach(op => {
    normalized = normalized.replaceAll(op, '&');
  });

  // Ersetze alle Disjunktions-Operatoren durch |
  validDisjunktions.forEach(op => {
    normalized = normalized.replaceAll(op, '|');
  });

  // Ersetze not() Funktionen durch ! (verbessert)
  normalized = normalized.replace(/not\s*\(\s*([^)]+)\s*\)/g, '!($1)');

  // Ersetze andere Negations-Operatoren durch !
  validNegations.forEach(op => {
    if (op !== '!' && op !== 'not') {
      normalized = normalized.replaceAll(op, '!');
    }
  });
  
  // JETZT validieren wir Zahlen und Variablen nach der Operator-Normalisierung
  
  // Validiere Zahlen: Nur 0 und 1 sind erlaubt
  const invalidNumbers = normalized.match(/\b[2-9]\d*\b/g);
  if (invalidNumbers) {
    throw new Error(`Ungültige Zahlen gefunden: ${invalidNumbers.join(', ')}. Nur 0 und 1 sind erlaubt.`);
  }
  
  // Validiere Variablen: Nur die aus VARIABLE_NAMES sind erlaubt
  const usedVariables = normalized.match(/[A-Za-z]/g);
  if (usedVariables) {
    const invalidVariables = usedVariables.filter(v => !VARIABLE_NAMES.includes(v.toUpperCase()));
    if (invalidVariables.length > 0) {
      const uniqueInvalidVars = [...new Set(invalidVariables.map(v => v.toUpperCase()))];
      throw new Error(`Ungültige Variablen gefunden: ${uniqueInvalidVars.join(', ')}. Erlaubt sind nur: ${VARIABLE_NAMES.join(', ')}`);
    }
  }

  // Vereinfache mehrfache Negationen
  normalized = simplifyNegations(normalized);

  // Füge implizite Konjunktionen hinzu (z.B. AB -> A&B)
  normalized = addImplicitConjunctions(normalized);

  return normalized;
}

function simplifyNegations(expr) {
  let simplified = expr;
  let changed = true;
  
  while (changed) {
    let oldExpr = simplified;
    
    // Schritt 1: Entferne alle Klammern und zähle Negationen für einfache Variablen
    // Behandle Muster wie !(!(!(!(B)))) -> B (4 Negationen = gerade)
    simplified = simplified.replace(/(!*)\((!*[A-Za-z])\)/g, (match, outerNeg, innerContent) => {
      // Kombiniere äußere und innere Negationen
      const totalNegations = outerNeg.length + (innerContent.match(/^!*/)[0].length);
      const variable = innerContent.replace(/^!*/, '');
      
      // Gerade Anzahl von Negationen = keine Negation, ungerade = eine Negation
      return totalNegations % 2 === 0 ? variable : `!${variable}`;
    });
    
    // Schritt 2: Behandle aufeinanderfolgende Negationen: !!...! -> ! oder ''
    simplified = simplified.replace(/!{2,}/g, match => {
      return match.length % 2 === 0 ? '' : '!';
    });
    
    // Schritt 3: Entferne überflüssige Klammern um einzelne (möglicherweise negierte) Variablen
    simplified = simplified.replace(/\((!*[A-Za-z])\)/g, '$1');
    
    changed = (oldExpr !== simplified);
  }
  
  return simplified;
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
    
    // Füge & zwischen schließenden und öffnenden Klammern hinzu (wichtig für )()!)
    expr = expr.replace(/\)\s*\(/g, ')&(');
    
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

export function getMinimalExpression() {
  // DMF: Disjunktive Normalform (Summe von Produkten)
  // Extrahiere Minterm-Indizes wie in renderExpr() - konvertiere bits zu Dezimalzahl
  const minterms = logicState.truth
    .filter((r) => r.out === 1)
    .map((r) => parseInt(r.bits, 2));

  if (minterms.length === 0) return "0";
  if (minterms.length === logicState.truth.length) return "1";

  // Don't Care Terme hinzufügen (falls vorhanden)
  const dcs = logicState.truth
    .filter((r) => r.out === null)
    .map((r) => parseInt(r.bits, 2));

  // Verwende die minimize Funktion für Quine-McCluskey Minimierung
  const minimizedTerms = minimize(logicState.nVars, minterms, dcs);

  // Konvertiere minimierte Terme zu lesbarer DNF mit der gleichen Logik wie renderExpr()
  const terms = minimizedTerms.map(term => {
    return term
      .split('')
      .map((bit, i) => {
        if (bit === '-') return null; // Don't care
        return bit === '1' ? VARIABLE_NAMES[i] : `!${VARIABLE_NAMES[i]}`;
      })
      .filter(literal => literal !== null)
      .join('&');
  });

  return terms.join('|');
}
