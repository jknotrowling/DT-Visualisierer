



// Unterstützt: + (OR), * (AND), not(), Klammern, Variablen a,b,c,d
// Gibt {variables: [...], truthTable: [0,1,...]} zurück
export function parseLogicFunction(expr) {
  // 1. Variablen extrahieren (nur a,b,c,d, case-insensitive)
  const varSet = new Set((expr.match(/[a-d]/gi) || []).map(v => v.toUpperCase()));
  const variables = Array.from(varSet).sort();
  if (variables.length === 0 || variables.length > 4) {
    throw new Error("Nur 1-4 Variablen a,b,c,d erlaubt");
  }

  // 2. Mathematische Schreibweise:
  // a(b+c) -> a∧(b+c), (b+c)a -> (b+c)∧a, ab -> a∧b, abbcd -> a∧b∧b∧c∧d
  let normExpr = expr
    // a(b+c) und (b+c)a
    .replace(/([a-dA-D])\s*\(/g, '$1∧(')
    .replace(/\)\s*([a-dA-D])/g, ')∧$1')
    // Mehrere Variablen hintereinander (z.B. ab, abc, abbcd)
    .replace(/([a-dA-D])(?=[a-dA-D])/g, '$1∧');

  // 3. Ausdruck normalisieren: * und ∧ zu &&, + und ∨ zu ||, not(X) zu !X, Variablen zu Großbuchstaben
  let jsExpr = normExpr
    .replace(/not\s*\(/gi, '!(')
    .replace(/[∧*]/g, '&&')
    .replace(/[∨+]/g, '||');
  // Variablen zu Großbuchstaben (A,B,C,D)
  variables.forEach(v => {
    const re = new RegExp(v, 'gi');
    jsExpr = jsExpr.replace(re, v);
  });

  // 3. Truth Table berechnen
  const n = variables.length;
  if(n < 2) {
    throw new Error("Zu wenige Variablen, mindestens 2 benötigt");
  }
    if(n > 4) {
    throw new Error("Nur 1-4 Variablen a,b,c,d erlaubt");
  }

  const truthArray = [];
  for (let i = 0; i < (1 << n); i++) {
    // Bitmuster für Variablen
    const env = {};
    variables.forEach((v, idx) => {
      env[v] = Boolean((i >> (n - idx - 1)) & 1);
    });
    // Ausdruck auswerten
    let val;
    try {
      // eslint-disable-next-line no-new-func
      val = Function(...variables, `return Number(${jsExpr});`)(...variables.map(v => env[v]));
    } catch (e) {
      throw new Error("Ungültiger Ausdruck: " + e.message);
    }
    truthArray.push(val ? 1 : 0);
  }
  return { variables, truthArray };
}
