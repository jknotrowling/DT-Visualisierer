

export function generateDNFfromTruthTable(truthArray, variables) {
  if (!Array.isArray(truthArray) || !Array.isArray(variables)) throw new Error("Ungültige Eingabe");
  const n = variables.length;
  // 1. Alle Einsen als Minterme
  let minterms = [];
  for (let i = 0; i < truthArray.length; i++) {
    if (truthArray[i] === 1) minterms.push(i);
  }
  if (minterms.length === 0) return '0';

  // 2. Quine-McCluskey Minimierung (vereinfachte Version für n <= 4)
  function countOnes(x) {
    return x.toString(2).split('').filter(b => b === '1').length;
  }
  function combine(a, b) {
    let diff = 0, pos = -1;
    for (let i = 0; i < n; i++) {
      if (((a >> i) & 1) !== ((b >> i) & 1)) {
        diff++;
        pos = i;
      }
    }
    if (diff === 1) return a & ~(1 << pos);
    return null;
  }
  // Minterme als Binärstrings
  let groups = {};
  minterms.forEach(m => {
    const ones = countOnes(m);
    if (!groups[ones]) groups[ones] = [];
    groups[ones].push({ val: m, mask: 0 });
  });
  let primeImplicants = [];
  let used = new Set();
  let nextGroups;
  do {
    nextGroups = {};
    let marked = new Set();
    let groupKeys = Object.keys(groups).map(Number).sort((a,b)=>a-b);
    for (let i = 0; i < groupKeys.length - 1; i++) {
      let g1 = groups[groupKeys[i]];
      let g2 = groups[groupKeys[i+1]];
      g1.forEach(t1 => {
        g2.forEach(t2 => {
          let diff = t1.val ^ t2.val;
          if (countOnes(diff) === 1 && t1.mask === t2.mask) {
            let newMask = t1.mask | diff;
            let newVal = t1.val & ~diff;
            let key = `${newVal},${newMask}`;
            if (!nextGroups[key]) nextGroups[key] = { val: newVal, mask: newMask, merged: false };
            marked.add(t1);
            marked.add(t2);
          }
        });
      });
    }
    // Unmarkierte sind Prime-Implicants
    Object.values(groups).flat().forEach(t => {
      if (!marked.has(t)) primeImplicants.push(t);
    });
    // Neue Gruppen
    groups = {};
    Object.values(nextGroups).forEach(t => {
      const ones = countOnes(t.val);
      if (!groups[ones]) groups[ones] = [];
      groups[ones].push(t);
    });
  } while (Object.keys(groups).length > 0);

  // 3. Prime-Implicant Chart (Petrick's method, hier greedy)
  let covers = primeImplicants.map(pi => {
    let arr = [];
    for (let i = 0; i < minterms.length; i++) {
      let m = minterms[i];
      if (((m & ~pi.mask) === (pi.val & ~pi.mask))) arr.push(m);
    }
    return arr;
  });
  let selected = [];
  let uncovered = new Set(minterms);
  while (uncovered.size > 0) {
    // Wähle PI, der die meisten noch nicht abgedeckten Minterme abdeckt
    let best = -1, bestCount = -1;
    for (let i = 0; i < covers.length; i++) {
      let count = covers[i].filter(m => uncovered.has(m)).length;
      if (count > bestCount) {
        best = i;
        bestCount = count;
      }
    }
    if (best === -1) break;
    selected.push(primeImplicants[best]);
    covers[best].forEach(m => uncovered.delete(m));
  }
  // 4. Ausdruck bauen
  function termToString(t) {
    let arr = [];
    for (let i = 0; i < n; i++) {
      if ((t.mask >> (n - i - 1)) & 1) continue;
      if ((t.val >> (n - i - 1)) & 1) arr.push(variables[i].toLowerCase());
      else arr.push(`not(${variables[i].toLowerCase()})`);
    }
    if (arr.length === 0) return '1';
    return arr.join('*');
  }
  return selected.map(termToString).join('+');
}

// Unterstützt: + (OR), * (AND), not(), Klammern, Variablen a,b,c,d
// Gibt {variables: [...], truthTable: [0,1,...]} zurück
export function parseLogicFunction(expr) {
  // 1. Variablen extrahieren (nur a,b,c,d, case-insensitive)
  const varSet = new Set((expr.match(/[a-d]/gi) || []).map(v => v.toUpperCase()));
  const variables = Array.from(varSet).sort();
  if (variables.length === 0 || variables.length > 4) {
    throw new Error("Nur 1-4 Variablen a,b,c,d erlaubt");
  }

  // 2. Ausdruck normalisieren: * zu &&, + zu ||, not(X) zu !X, Variablen zu Großbuchstaben
  let jsExpr = expr
    .replace(/not\s*\(/gi, '!(')
    .replace(/\*/g, '&&')
    .replace(/\+/g, '||');
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
