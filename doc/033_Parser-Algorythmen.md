# Parser-Algorithmen

- **Parsing-Engine**: Verarbeitung von Boolean-Ausdrücken mit flexibler Syntax
- **Minimierungsalgorithmen**: Wandlung von komplexen Ausdrücken in minimale Form durch Quine-McCluskey-Algorithmus
- **Syntax-Validierung**: Überprüfung und Normalisierung der Eingabe-Syntax
- **Wahrheitstabellen-Berechnung**: Evaluation für alle möglichen Variablenkombinationen



## Funktion `parseLogicFunction()`

Die Hauptfunktion zur Verarbeitung von Boolean-Ausdrücken. Sie normalisiert den Ausdruck und berechnet die vollständige Wahrheitstabelle.

**Eingabe/Ausgabe:**
- **Eingabe**: 
  - `expr: string` - Boolean-Ausdruck als String
  - `nVars: number` - Anzahl der Variablen (2-4)
- **Ausgabe**: `Array<number>` - Wahrheitstabelle als Array mit 0/1-Werten (Länge: 2^nVars)

### Algorithmus-Überblick

```javascript
export function parseLogicFunction(expr, nVars) {
  // 1. Parameter-Validierung
  
  // 2. Ausdruck normalisieren
  let normalizedExpr = normalizeExpression(expr);
  
  // 3. Wahrheitstabelle berechnen
  const truthArray = [];
  for (let i = 0; i < 2**nVars; i++) {
    // Binäre Kombination generieren
    const binaryStr = i.toString(2).padStart(nVars, '0');
    const varValues = Array.from(binaryStr, bit => parseInt(bit));
    
    // Ausdruck evaluieren
    const result = evalExpression(normalizedExpr, varValues);
    truthArray.push(result ? 1 : 0);
  }
  
  return truthArray;
}
```

## Funktion `getMinimalExpression()`

Wendet den Quine-McCluskey-Algorithmus an, um eine minimale disjunktive Normalform (DNF) zu erzeugen.

**Eingabe/Ausgabe:**
- **Eingabe**: Keine Parameter (verwendet globalen `logicState`)
- **Ausgabe**: `string` - Minimalisierter Boolean-Ausdruck in DNF-Form
- **Spezialfälle**: 
  - Keine Minterme → `"0"` (konstant falsch)
  - Alle Minterme → `"1"` (konstant wahr)

### Algorithmus-Kernlogik

```javascript
export function getMinimalExpression() {
  // 1. Minterme extrahieren (wo Ausgabe = 1)
  const minterms = logicState.truth
    .filter((r) => r.out === 1)
    .map((r) => parseInt(r.bits, 2));

  // 2. Don't-Care-Terme extrahieren (wo Ausgabe = null)
  const dcs = logicState.truth
    .filter((r) => r.out === null)
    .map((r) => parseInt(r.bits, 2));

  // 3. Quine-McCluskey-Minimierung anwenden
  const minimizedTerms = minimize(logicState.nVars, minterms, dcs);

  // 4. Zu lesbarer DNF konvertieren
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
```

## Funktion `normalizedExpressionToLatex()`

Konvertiert normalisierte Boolean-Ausdrücke in mathematisch korrekte LaTeX-Darstellung für die Anzeige.

**Eingabe/Ausgabe:**
- **Eingabe**: `expr: string` - Normalisierter Boolean-Ausdruck
- **Ausgabe**: `string` - LaTeX-formatierter String für mathematische Darstellung

### Konvertierungs-Algorithmus

```javascript
export function normalizedExpressionToLatex(expr) {
  let rendered = expr.trim();

  // 1. Negationen mit Überstrichen
  rendered = rendered.replace(/!(\([^)]+\))/g, '\\overline{$1}');  // !(...)
  rendered = rendered.replace(/!([A-Za-z])/g, '\\overline{$1}');   // !A
  
  // 2. Operatoren zu LaTeX-Symbolen
  rendered = rendered.replace(/&/g, ' \\;\\& \\;');      // UND
  rendered = rendered.replace(/\|/g, ' \\lor ');          // ODER
  rendered = rendered.replace(/\^/g, ' \\oplus ');        // XOR

  return rendered.replace(/\s+/g, ' ').trim();
}
```

### Operator-Mapping-Tabelle

| Operation | Erlaubte Eingaben | Normalisierter Operator | LaTeX-Darstellung |
|-----------|-------------------|------------------------|------------------|
| **Konjunktion (UND)** | `*`, `&`, `∧`, `and` | `&` | `\land` |
| **Disjunktion (ODER)** | `+`, `\|`, `∨`, `or` | `\|` | `\lor` |
| **Negation (NICHT)** | `not`, `¬`, `!`, `~` | `!` | `\overline{...}` |
| **XOR (Exklusiv-ODER)** | `⊕`, `xor`, `XOR` | `^` | `\oplus` |

