import { VARIABLE_NAMES } from "../state.js";
import { bin } from "../utils/utils.js";

export function parseLogicFunction(expr, nVars) {
  if (typeof expr !== 'string' || expr.trim() === '') {
    throw new Error('Expression must be a non-empty string.');
  }
  if (!Number.isInteger(nVars) || nVars < 1 || nVars > VARIABLE_NAMES.length) {
    throw new Error(`nVars must be an integer between 1 and ${VARIABLE_NAMES.length}.`);
  }

  const validVariables = VARIABLE_NAMES.slice(0, nVars);

  // Normalisiere den Ausdruck
  let normalizedExpr = normalizeExpression(expr);

  // Überprüfe, ob alle verwendeten Variablen gültig sind
  const usedVars = Array.from(new Set(normalizedExpr.match(/[A-Za-z]/g)));
  if (usedVars.some(v => !validVariables.includes(v.toUpperCase()))) {
    throw new Error(`Expression contains invalid variables. Allowed: ${validVariables.join(', ')}`);
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
      throw new Error(`Error evaluating expression for input ${bits.join('')}: ${error.message}`);
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
    
    // Füge & zwischen schließenden Klammern und Variablen hinzu
    expr = expr.replace(/\)\s*([A-Za-z])/g, ')&$1');
    
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
  try {
    return eval(expr);
  } catch (error) {
    console.error("Error evaluating expression:", error);
    return false;
  }
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
  rendered = rendered.replace(/&/g, ' \\land ');
  
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