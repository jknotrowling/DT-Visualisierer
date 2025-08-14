import { bin, lbl } from "../utils/utils.js";
import { logicState, VARIABLE_NAMES } from "../state.js";


// mInimiert die Min-Terme aus dem State mit dem Quine-McCluskey Verfahren
/**
 * Minimiert eine Boolesche Funktion nach dem Quine–McCluskey-Algorithmus.
 *
 * @param {number} varCount  - Anzahl der Variablen in der Funktion.
 * @param {number[]} terms   - Indizes der Zeilen in der Wahrheitstabelle,
 *                              die minimiert werden sollen.
 *                              Bei DNF: Zeilen mit Funktionswert 1 (Minterme).
 *                              Bei KNF: Zeilen mit Funktionswert 0 (Maxterme) nach Negation.
 * @param {number[]} dontCares - Indizes der "Don't Care"-Zeilen (optional).
 *
 * @returns {string[]} Liste minimierter Implikanten in Binärform mit '-' als Platzhalter.
 */
export function minimize(varCount, terms, dontCares = []) {
  //Zählt die Anzahl der 1-Bits in einer Zahl
  const countOnes = (num) => num.toString(2).replace(/0/g, "").length;

  let groups = {};
  let primeImplicants = new Set();

  //Vereint 1- und DC-Stellen in einen Array
  [...terms, ...dontCares].forEach((termIndex) => {
    const binary = bin(termIndex, varCount); 
    (groups[countOnes(termIndex)] ??= []).push(binary); //Gruppiert binäre Indexe nach anzahl der 1-Stellen
  });

  // Kombinationsphase des Quine-McCluskey
  while (true) {
    const nextGroups = {};
    const used = new Set();
    let hasCombination = false;

    const keys = Object.keys(groups).map(Number).sort((a, b) => a - b); //keys sind alle Häufigkeiten der 1 stellen in groups, sortiert

    // Suche nach stellen mit hamming Distanz = 1
    for (let i = 0; i < keys.length - 1; i++) {
      (groups[keys[i]] || []).forEach((a) =>
        (groups[keys[i + 1]] || []).forEach((b) => {
          const diff = [...a].filter((_, pos) => a[pos] !== b[pos]).length;
          if (diff === 1) {
            hasCombination = true;
            // Kombiniert Beide Stellen und setzt das unterscheidende bit zu "-"
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


    if (!hasCombination) break;

    // Nächste Iteration mit neuen Gruppen (Duplikate entfernen)
    groups = {};
    Object.entries(nextGroups).forEach(([k, arr]) => {
      groups[k] = [...new Set(arr)];
    });
  }

  // Prüft ob ein Implikant einen Term abdeckt
  const covers = (implicant, termIndex) => {
    const binary = bin(termIndex, varCount);
    for (let i = 0; i < varCount; i++) {
      if (implicant[i] !== "-" && implicant[i] !== binary[i]) return false;
    }
    return true;
  };

  // Alle Implikanten, die den Term abdecken
  const chart = terms.map((termIndex) =>
    [...primeImplicants].filter((pi) => covers(pi, termIndex))
  );

  const essential = [];
  const coveredTerms = new Set();

  // PI, die als einzige einen Term abdecken, als essenziell speichern und alle von ihr abgedeckten Terms als "covered" speichern
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

  // Restliche Terme abdecken (greedy) -- greedy liefert nicht immer die beste variante, 
  // ist aber deutlich schneller als varianten mit set theory (bei vier variablen und essenziellen PI ist eine Abweichung unwahrschienlich)
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

// Je nachdem welche Form (disjunktiv/konjungtiv) vorliegt,
// wird die Variable je nach wert and die label funktion aus /utils gegeben
/**

 * @param {Array|string} bits - An array or string representing the bits of the Boolean variables. Each element should be "1", "0", or "-".
 * @param {string} type - The type of Boolean expression ("dnf", "dmf", etc.). Determines how negation is handled and the join operator.
 * @returns {string} The formatted Boolean literal expression, using " & " for DNF/DMF types and "∨" otherwise.
**/
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

//erstetzt DC stellen mit zwei Termen, einmal 1, einmal 0
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


//Erstellt eine Vollstängige Shanon-zerlegung, welche DC Stellen berücksichtigt
export function shannonExpansion(
  bitsTemplate,
  depth,
  expansionOrder
) {
  //Falls es keine Vereinfachungen gibt, ist der Endwert der Branches wie der im Truthtable
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

  // setzte die aktuelle Variable fest und bestimme den ganzen Zweig rekursiv
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

  // Falls die Zweige gleich sind, zusammenfassen.
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

  // Bei DC Stellen kann der definierte Zweig übernommen werden
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

  //Zweige werden durch Rekursion immer weiter genested
  return {
    type: "expression",
    variable: varName,
    varIndex: varIndex,
    positiveBranch: branchOne,
    negativeBranch: branchZero,
    minterms: [...new Set([...branchOne.minterms, ...branchZero.minterms].sort())],
  };
}


