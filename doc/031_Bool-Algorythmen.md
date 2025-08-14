# Normalformen, Minimierung und Boolsche Entwicklung

## Normalformen
Aus der Wahrheitstabelle werden die Disjunktiven Normalformen (DNF) und konjunktiven Normalformen (KNF) abgeleitet. Diese Normalformen sind standardisierte Darstellungen von logischen Funktionen. 

- Die DNF wird über die Einsstellen der Wahrheitstabelle gebildet, indem die entsprechenden Variablen in ihrer positiven oder negativen Form kombiniert werden. Dies geschieht mit der Funktion `lit()` und `lbl()`, die Literale und Labels für die Variablen erzeugen.

- Die KNF wird analog über die Nullstellen der Wahrheitstabelle gebildet, wobei die Variablen in ihrer negativen oder positiven Form kombiniert werden. Dies erfolgt ebenfalls mit `lit()` und `lbl()`, um die entsprechenden Literale zu generieren.


### lit Funktion
```javascript
/**

 * @param {Array|string} bits - An array or string representing the bits of the Boolean variables. Each element should be "1", "0", or "-".
 * @param {string} type - The type of Boolean expression ("dnf", "dmf", etc.). Determines how negation is handled and the join operator.
 * @returns {string} The formatted Boolean literal expression, using " & " for DNF/DMF types and "∨" otherwise.
**/
function lit(bits, type) {
  return [...bits]
    .map((b, i) => {
      if (b === "-") return "";
      const neg = type === "dnf" || type === "dmf" ? b === "0" : b === "1";
      return lbl(i, neg);
    })
    .filter(Boolean)
    .join(type === "dnf" || type === "dmf" ? " & " : "∨");
}
```
### lbl Funktion
```javascript

/**
 * @param {number} i - The index of the variable.
 * @param {boolean} neg - Whether the variable is negated.
 * @returns {string} The label for the variable, wrapped in a span with class "ov" if negated.
 **/
function lbl(index, neg) {
return  (neg ? `<span class="ov">${VARIABLE_NAMES[i]}</span>` : VARIABLE_NAMES[i]);
}

```

## Minimalformen und der Quine-McCluskey-Algorithmus

Die Minimierung der logischen Funktion erfolgt über den **Quine-McCluskey-Algorithmus**. Dieser systematische Algorithmus reduziert die Anzahl der Terme in der DNF, indem er redundante Terme eliminiert und die Funktion in eine vereinfachte Form bringt.

### Algorithmus-Überblick

Der Quine-McCluskey-Algorithmus arbeitet in drei Hauptphasen:
1. **Gruppierung**: Terme werden nach Anzahl der 1-Bits gruppiert
2. **Kombinationsphase**: Benachbarte Gruppen werden paarweise kombiniert
3. **Abdeckungsphase**: Essentielle Primimplikanten werden bestimmt

### Funktionssignatur

```javascript
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
```

### Phase 1: Initialisierung und Gruppierung

Der erste Schritt gruppiert alle Terme (einschließlich Don't-Care-Terme) nach der Anzahl ihrer 1-Bits:

```javascript
  //Zählt die Anzahl der 1-Bits in einer Zahl
  const countOnes = (num) => num.toString(2).replace(/0/g, "").length;

  let groups = {};
  let primeImplicants = new Set();

  //Vereint 1- und DC-Stellen in einen Array
  [...terms, ...dontCares].forEach((termIndex) => {
    const binary = bin(termIndex, varCount); 
    (groups[countOnes(termIndex)] ??= []).push(binary); //Gruppiert binäre Indexe nach anzahl der 1-Stellen
  });
```

Terme können nur dann kombiniert werden, wenn sie sich in genau einem Bit unterscheiden. Durch die Gruppierung nach 1-Bit-Anzahl müssen nur benachbarte Gruppen verglichen werden.

### Phase 2: Kombinationsphase (Iterative Reduktion)

Das Herzstück des Algorithmus kombiniert Terme aus benachbarten Gruppen:

```javascript
  while (true) {
    const nextGroups = {};
    const used = new Set();
    let hasCombination = false;

    const keys = Object.keys(groups).map(Number).sort((a, b) => a - b); //keys sind alle Häufigkeiten der 1 stellen in groups, sortiert

    // Suche nach stellen mit Hamming-Distanz = 1
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
```

**Kombinationsregel**: Zwei Terme können kombiniert werden, wenn sie sich in genau einem Bit unterscheiden. Das unterschiedliche Bit wird durch '-' (Don't-Care) ersetzt.

### Primimplikanten sammeln

Alle Terme, die nicht weiter kombiniert werden können, sind Primimplikanten:

```javascript
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
```

### Phase 3: Abdeckungsmatrix und essentielle Primimplikanten

Jetzt wird bestimmt, welche Primimplikanten tatsächlich benötigt werden:

```javascript
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
```

**Abdeckung**: Ein Primimplikant "deckt" einen Term ab, wenn alle definierten Bits (nicht '-') übereinstimmen.

### Essentielle Primimplikanten finden

```javascript
  const essential = [];
  const coveredTerms = new Set();

  // PI, die als einzige einen Term abdecken, als essenziell speichern und alle abgedeckten Terms als "covered" speichern
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
```

**Essentielle Primimplikanten**: Wenn ein Term nur von einem einzigen Primimplikanten abgedeckt wird, ist dieser essentiell.

### Greedy-Algorithmus für restliche Abdeckung

```javascript
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
}
```

**Greedy-Heuristik**: Für die verbleibenden Terme wird der Primimplikant gewählt, der die meisten noch nicht abgedeckten Terme abdeckt.

### Laufzeit

- **Zeitkomplexität**: Die Laufzeit des Quine-McCluskey-Algorithmus ist im schlimmsten Fall:
$$
T(n) \in \mathcal{O}(n^2 \cdot 3^n \cdot \log n)
$$


## Boolsche Entwicklung (Shannon-Expansion)

Die Boolsche Entwicklung erstellt ein Binärentscheidungsdiagramm (BDD) durch rekursive Aufspaltung der Funktion. Das Prinzip: Eine Funktion wird in ihre Teilfunktionen für `Variable = 0` und `Variable = 1` zerlegt.

### Funktion: `shannonExpansion`

**Zweck**: Erstellt ein BDD durch rekursive Shannon-Expansion einer Boolean-Funktion.

**Parameter**:
- `bitsTemplate: string` - Bit-Pattern mit Platzhaltern (z.B. "1-0", wobei "-" = unbestimmt)
- `depth: number` - Aktuelle Rekursionstiefe (0 = Start, nVars = Ende)
- `expansionOrder: Array<string>` - Reihenfolge der Variablen für die Expansion (z.B. ["A", "B", "C"])

**Rückgabe**: `Object` - Knoten-Objekt mit zwei möglichen Typen:
- `{type: "constant", value: string, minterms: Array<string>, path: string}` - Endknoten
- `{type: "expression", variable: string, positiveBranch: Object, negativeBranch: Object, minterms: Array<string>}` - Verzweigungsknoten


**Algorithmus-Schritte**:

#### 1. Rekursions-Ende erreicht
```javascript
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
```
Alle Variablen sind belegt → Funktionswert aus Wahrheitstabelle ablesen.
**Datentyp**: `ConstantNode` - Endknoten mit festem Wert.

#### 2. Variable aufsplitten (Shannon-Expansion)
```javascript
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
```
Die nächste Variable wird in beide mögliche Werte (0 und 1) aufgespalten und rekursiv weiterverarbeitet.


#### 3. Optimierung: Gleiche Ergebnisse zusammenfassen
```javascript
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

```

Wenn beide Zweige denselben konstanten Wert haben, wird die Variable komplett weggelassen.


#### 4. Don't-Care-Optimierung
```javascript
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

```
Don't-Care-Werte ("/") können beliebig gesetzt werden. Wenn ein Zweig einen festen Wert hat, wird dieser verwendet.


#### 5. Standard-Fall: Verzweigungsknoten erstellen
```javascript
// Ausdrucksknoten zurückgeben, falls keine Vereinfachung möglich
return {
  type: "expression",
  variable: varName,
  varIndex: varIndex,
  positiveBranch: branchOne,
  negativeBranch: branchZero,
  minterms: [...new Set([...branchOne.minterms, ...branchZero.minterms].sort())],
};
```
Keine Optimierung möglich → Erstelle einen Verzweigungsknoten.
**Datentyp**: `ExpressionNode` - Enthält Variable und zwei Unterbäume.


### Datenstrukturen im Detail

#### ConstantNode (Endknoten)
```typescript
type ConstantNode = {
  type: "constant",
  value: "0" | "1" | "/" | "?",    // Funktionswert oder Don't-Care oder unbekannt
  minterms: Array<string>,         // Alle Bit-Pattern, die zu diesem Wert führen
  path: string | null              // Der Pfad durch das BDD (bei Blättern)
}
```

#### ExpressionNode (Verzweigungsknoten)  
```typescript
type ExpressionNode = {
  type: "expression",
  variable: string,                // Name der Variable ("A", "B", etc.)
  varIndex: number,                // Index in VARIABLE_NAMES Array
  positiveBranch: Node,            // Teilbaum für Variable=1  
  negativeBranch: Node,            // Teilbaum für Variable=0
  minterms: Array<string>          // Alle Minterme unter diesem Knoten
}
```






### Referenzen

- https://www.mathematik.uni-marburg.de/~thormae/lectures/ti1/ti_5_3_ger_web.html#1
- https://www.cs.hhu.de/fileadmin/redaktion/Fakultaeten/Mathematisch-Naturwissenschaftliche_Fakultaet/Informatik/Algorithmische_Bioinformatik/Bachelor-_Masterarbeiten2724180_ba_ifo_AbschlArbeit_klau_mileu001_tongu102_20221014_1502.pdf
- https://ira.informatik.uni-freiburg.de/teaching/ti-1-2002-ws/Folien/Kapitel08/kapitel-08-03-Algorithmus-zur-Berechnung-eines-Minimalpolynoms.pdf

