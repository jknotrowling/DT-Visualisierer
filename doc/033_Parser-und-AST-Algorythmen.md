# Expression Parser und AST-Algorithmen

Um beliebig komplexe boolsche Ausdrücke zu verarbeiten, wird ein Parser verwendet, der die Eingabe in einen Abstract Syntax Tree (AST) umwandelt. Dieser AST besteht aus verschiedenen Knoten, die die Struktur des Ausdrucks repräsentieren und dabei die Hierarchie der Operatoren berücksichtigen.

## Überblick der Komponenten

Die Parser-Implementierung besteht aus mehreren Hauptkomponenten:

1. **`parser.js`** - Haupteinstiegspunkt und Normalisierung
2. **`ast.js`** - AST-Struktur, Lexer und Parser-Implementierung
3. **Knoten-Klassen** - Repräsentation der verschiedenen Ausdruckstypen

## `parser.js` - Hauptfunktionalität

### `parseLogicFunction(expression, numberOfVariable)`

Die zentrale Funktion zur Verarbeitung logischer Ausdrücke:

```javascript
export function parseLogicFunction(expr, nVars)
```

**Parameter:**
- `expr` (string): Der zu parsende logische Ausdruck
- `nVars` (number): Anzahl der Variablen (2 bis max. Anzahl verfügbarer Variablennamen)

**Ablauf:**
1. Validierung der Eingabeparameter
2. Normalisierung des Ausdrucks mit `normalizeExpression()`
3. Erstellung eines AST-Objekts
4. Generierung der Wahrheitstabelle durch Auswertung aller Variablenkombinationen
5. Rückgabe als Array von 0/1-Werten

### `normalizeExpression(expression)`

Konvertiert verschiedene Operator-Synonyme in eine einheitliche interne Darstellung:

**Unterstützte Operatoren:**
- **AND**: `&`, `*`, `∧`, `and`, `AND` → `&`
- **OR**: `+`, `|`, `∨`, `or`, `OR` → `|` 
- **NOT**: `!`, `¬`, `~`, `not` → `!`
- **XOR**: `^`, `⊕`, `xor`, `XOR` → `^`
- **NAND**: `#`, `nand`, `NAND` → `#`
- **NOR**: `$`, `nor`, `NOR` → `$`
- **XNOR**: `=`, `xnor`, `XNOR` → `=`

### Weitere Hilfsfunktionen

- **`expressionToLatex(expr)`**: Konvertiert einen Ausdruck in LaTeX-Format
- **`getNormalizedString(expr)`**: Gibt eine standardisierte String-Darstellung zurück
- **`getMinimalExpression()`**: Berechnet die minimale DNF-Form aus der aktuellen Wahrheitstabelle im normalisierten Format

## `ast.js` - AST-Implementierung

### AST-Knoten-Struktur

Der AST wird aus verschiedenen Knoten-Typen aufgebaut:

- **`VariableNode`**: Repräsentiert eine Variable (A-H)
- **`ConstantNode`**: Repräsentiert eine Konstante (0, 1)
- **`UnaryOpNode`**: Repräsentiert unäre Operatoren (nur NOT `!`)
- **`BinaryOpNode`**: Repräsentiert binäre Operatoren (`&`, `|`, `^`, `#`, `$`, `=`)

### Lexer-Klasse

Der **Lexer** zerlegt den Eingabetext in Token für die weitere Verarbeitung:

**Erkannte Token-Typen:**
- **VARIABLE**: Variablen A-H (case-insensitive)
- **CONSTANT**: Konstanten 0, 1
- **OPERATOR**: Logische Operatoren `&`, `|`, `^`, `!`, `#`, `$`, `=`
- **LPAREN/RPAREN**: Klammern `(` und `)`
- **EOF**: Ende der Eingabe

**Hauptmethoden:**
- `getNextToken()`: Gibt das nächste Token zurück
- `advance()`: Bewegt den Positionszeiger weiter
- `skipWhitespace()`: Überspringt Leerzeichen

### Parser-Klasse

Der **Parser** verwendet rekursiven Abstieg zur AST-Erstellung:

**Hauptmethoden:**
- `parse()`: Startet den Parsing-Prozess
- `expression()`: Parst Ausdrücke mit OR/NOR-Operatoren
- `term()`: Parst Terme mit AND/XOR/NAND/XNOR-Operatoren und implizite Konjunktionen
- `factor()`: Parst Faktoren (Variablen, Konstanten, geklammerte Ausdrücke, NOT)
- `eat(tokenType)`: Konsumiert erwartete Token

### Grammatik

Die formale Grammatik für den Parser:

```
expression  ::= term (('|' | '$') term)*
term        ::= factor (('&' | '^' | '#' | '=') factor | implicit_factor)*
factor      ::= '!' factor | '(' expression ')' | variable | constant
variable    ::= [A-H] | [a-h]
constant    ::= '0' | '1'
implicit_factor ::= variable | constant | '(' expression ')' | '!' factor
```

**Operator-Präzedenz (absteigend):**
1. `!` (NOT) - Präzedenz 4
2. `&`, `#` (AND, NAND) - Präzedenz 3
3. `^`, `=` (XOR, XNOR) - Präzedenz 2
4. `|`, `$` (OR, NOR) - Präzedenz 1

### AST-Klasse

Die **AST-Klasse** stellt die Hauptschnittstelle dar:

```javascript
export class AST {
    constructor(expression)
    toString()           // String-Darstellung
    toLatex()           // LaTeX-Darstellung  
    evaluate(variableValues)  // Auswertung mit Variablenbelegung
}
```

**Besonderheiten:**
- **Implizite AND-Verknüpfung**: `AB` wird als `A & B` interpretiert
- **LaTeX-Ausgabe**: NAND, NOR, XNOR werden als Überstrich dargestellt
- **Fehlerbehandlung**: Ungültige Zeichen und Syntax-Fehler werden erkannt

### Auswertung

Die Auswertung erfolgt rekursiv über den AST:

1. **Konstanten**: Direkter Rückgabewert
2. **Variablen**: Nachschlag in `variableValues`
3. **Unäre Operatoren**: Negation des Operanden
4. **Binäre Operatoren**: Logische Verknüpfung der Operanden


## Anwendungsbeispiele

### Einfacher Ausdruck
```javascript
const ast = new AST("A & B | !C");
const result = ast.evaluate({A: 1, B: 0, C: 1}); // → 0
```

### Komplexer Ausdruck mit impliziter Konjunktion
```javascript
const ast = new AST("A(B + C)!D");
// Äquivalent zu: A & (B | C) & !D
const latex = ast.toLatex(); // → "A \& (B \lor C) \& \overline{D}"
```

### Wahrheitstabellengenerierung
```javascript
const truthTable = parseLogicFunction("A ^ B", 2);
// → [0, 1, 1, 0] für Kombinationen 00, 01, 10, 11
```







