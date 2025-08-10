import { bin, lbl } from "../utils/utils.js";
import { logicState, VARIABLE_NAMES } from "../state.js";



export function minimize(varCount, terms, dontCares = []) {
  // Hilfsfunktion: Zählt die Anzahl der 1-Bits in einer Zahl
  const countOnes = (num) => num.toString(2).replace(/0/g, "").length;

  // Gruppierung der Terme nach Anzahl 1-Bits
  let groups = {};
  let primeImplicants = new Set();

  [...terms, ...dontCares].forEach((termIndex) => {
    const binary = bin(termIndex, varCount); // binärer String mit führenden Nullen
    (groups[countOnes(termIndex)] ??= []).push(binary);
  });

  // Kombinationsphase
  while (true) {
    const nextGroups = {};
    const used = new Set();
    let hasCombination = false;

    const keys = Object.keys(groups).map(Number).sort((a, b) => a - b);

    // Vergleiche nur Gruppen mit aufeinanderfolgender 1-Bit-Anzahl
    for (let i = 0; i < keys.length - 1; i++) {
      (groups[keys[i]] || []).forEach((a) =>
        (groups[keys[i + 1]] || []).forEach((b) => {
          // Anzahl der Bitpositionen, die sich unterscheiden
          const diff = [...a].filter((_, pos) => a[pos] !== b[pos]).length;
          if (diff === 1) {
            hasCombination = true;
            // Unterschiedliche Stelle wird durch '-' ersetzt (Wildcard)
            const combined = a
              .split("")
              .map((ch, pos) => (ch === b[pos] ? ch : "-"))
              .join("");
            (nextGroups[countOnes(combined.replace(/-/g, ""))] ??= []).push(combined);
            used.add(a);
            used.add(b);
          }
        })
      );
    }

    // Alles, was nicht kombiniert wurde, ist ein Primimplikant
    Object.values(groups).flat().forEach((term) => {
      if (!used.has(term)) primeImplicants.add(term);
    });

    // Wenn keine neuen Kombinationen entstanden sind → fertig
    if (!hasCombination) break;

    // Nächste Iteration mit neuen Gruppen (Duplikate entfernen)
    groups = {};
    Object.entries(nextGroups).forEach(([k, arr]) => {
      groups[k] = [...new Set(arr)];
    });
  }

  // Prüft, ob ein Implikant einen Term abdeckt
  const covers = (implicant, termIndex) => {
    const binary = bin(termIndex, varCount);
    for (let i = 0; i < varCount; i++) {
      if (implicant[i] !== "-" && implicant[i] !== binary[i]) return false;
    }
    return true;
  };

  // Erstelle Abdeckungsmatrix (Term → Primimplikanten)
  const chart = terms.map((termIndex) =>
    [...primeImplicants].filter((pi) => covers(pi, termIndex))
  );

  const essential = [];
  const coveredTerms = new Set();

  // Essentielle Primimplikanten finden
  chart.forEach((pis) => {
    if (pis.length === 1) {
      const pi = pis[0];
      if (!essential.includes(pi)) {
        essential.push(pi);
        terms.forEach((termIndex) => {
          if (covers(pi, termIndex)) coveredTerms.add(termIndex);
        });
      }
    }
  });

  // Restliche Terme abdecken (greedy)
  let remaining = terms.filter((t) => !coveredTerms.has(t));
  let chosen = [...essential];

  while (remaining.length) {
    let bestPI = null;
    let maxCover = 0;

    primeImplicants.forEach((pi) => {
      if (chosen.includes(pi)) return;
      const coverCount = remaining.filter((t) => covers(pi, t)).length;
      if (coverCount > maxCover) {
        maxCover = coverCount;
        bestPI = pi;
      }
    });

    if (!bestPI) break;

    chosen.push(bestPI);
    remaining = remaining.filter((t) => !covers(bestPI, t));
  }

  return chosen;
}


export function lit(bits, type) {
  return [...bits]
    .map((b, i) => {
      if (b === "-") return "";
      const neg = type === "dnf" || type === "dmf" ? b === "0" : b === "1";
      return lbl(i, neg);
    })
    .filter(Boolean)
    .join(type === "dnf" || type === "dmf" ? " & " : "∨");
}

export const expand = (p) => {
  let res = [""];
  [...p].forEach((ch) => {
    res =
      ch === "-"
        ? res.flatMap((s) => [s + "0", s + "1"])
        : res.map((s) => s + ch);
  });
  return res;
};



export function shannonExpansion(
  bitsTemplate,
  depth,
  expansionOrder
) {
  if (depth >= logicState.nVars) {
    const finalBits = bitsTemplate;
    const truthRow = logicState.truth.find(r => r.bits === finalBits);
    const outputValue = truthRow ? (truthRow.out === null ? "/" : String(truthRow.out)) : "?";
    return {
      type: "constant",
      value: outputValue,
      minterms: [finalBits],
      path: finalBits,
    };
  }

  const varName = expansionOrder[depth];
  const varIndex = VARIABLE_NAMES.indexOf(varName);

  // Variable = 1 branch
  let bitsWithVarOne = bitsTemplate.split("");
  bitsWithVarOne[varIndex] = "1";
  const bitsForOne = bitsWithVarOne.join("");
  const branchOne = shannonExpansion(bitsForOne, depth + 1, expansionOrder);

  // Variable = 0 branch
  let bitsWithVarZero = bitsTemplate.split("");
  bitsWithVarZero[varIndex] = "0";
  const bitsForZero = bitsWithVarZero.join("");
  const branchZero = shannonExpansion(bitsForZero, depth + 1, expansionOrder);

  // Vereinfachung: gleiche Konstanten zusammenfassen
  if (
    branchOne.type === "constant" &&
    branchZero.type === "constant" &&
    branchOne.value === branchZero.value
  ) {
    return {
      type: "constant",
      value: branchOne.value,
      minterms: [...new Set([...branchOne.minterms, ...branchZero.minterms].sort())],
      path: null,
    };
  }

  // Sonderfall für don't care "/"
  if (branchOne.type === "constant" && branchZero.type === "constant") {
    if (
      branchOne.value === "/" &&
      (branchZero.value === "0" || branchZero.value === "1")
    ) {
      return {
        type: "constant",
        value: branchZero.value,
        minterms: [...new Set([...branchOne.minterms, ...branchZero.minterms].sort())],
        path: null,
      };
    }
    if (
      branchZero.value === "/" &&
      (branchOne.value === "0" || branchOne.value === "1")
    ) {
      return {
        type: "constant",
        value: branchOne.value,
        minterms: [...new Set([...branchOne.minterms, ...branchZero.minterms].sort())],
        path: null,
      };
    }
  }

  // Ausdrucksknoten zurückgeben, falls keine Vereinfachung möglich
  return {
    type: "expression",
    variable: varName,
    varIndex: varIndex,
    positiveBranch: branchOne,
    negativeBranch: branchZero,
    minterms: [...new Set([...branchOne.minterms, ...branchZero.minterms].sort())],
  };
}


