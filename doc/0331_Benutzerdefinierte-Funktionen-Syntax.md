# Custom Function Syntax

Hier soll die Syntax für benutzerdefinierte Funktionen beschrieben werden. Diese Syntax wird verwendet, individuelle Funktionen zu definieren, die in der Anwendung verwendet werden können.


## Syntax
Die Syntax für benutzerdefinierte Funktionen folgt dem folgenden Muster:
- Für Konjunktionen (UND) sind folgende Operatoren zulässig: 
    - `&` Kaufmännisches UND
    - `*` Sternchen (Multiplikation)
    - `∧` Mathematisches UND
    - Außerdem ist die Syntax `ab = a & b` zulässig, um eine Konjunktion zu definieren. Oder mit Klammern: `a(b+c) = a & (b + c)`,
    - `and` Funktion (z.B. `A and B`)
    - **Wird gerendert als**: `&`
- Für Disjunktionen (ODER) sind folgende Operatoren zulässig:
    - `+` Pluszeichen
    - `|` Senkrechter Strich 
    - `∨` Mathematisches ODER
    - `or` Funktion (z.B. `A or B`)
    - **Wird gerendert als**: `∨`
- Für Negationen (NOT)  sind folgende Operatoren zulässig:
    - `!` Ausrufezeichen
    - `¬` Mathematisches Nicht
    - `~` Tilde
    - `not(...)` Funktion 
    - **Wird gerendert als**: $\overline{\text{Eingebener Term}}$
- Für XOR (Exklusives ODER) ist der folgende Operator zulässig:
    - `⊕` Mathematisches XOR
    - `XOR` Funktion (z.B. `A XOR B`)
    - **Wird gerendert als**: `⊕`
- Für NAND (Negiertes UND) ist der folgende Operator zulässig:
    - `#` Raute
    - `nand` Funktion (z.B. `A nand B`)
    - **Wird gerendert als**: `\overline{A \;\&\; B}`
- Für NOR (Negiertes ODER) ist der folgende Operator zulässig:
    - `$` Dollarzeichen
    - `nor` Funktion (z.B. `A nor B`)
    - **Wird gerendert als**: `\overline{A \;∨\; B}`
- Für XNOR (Negiertes XOR) ist der folgende Operator zulässig:
    - `=` Gleichheitszeichen
    - `xnor` Funktion (z.B. `A xnor B`)
    - **Wird gerendert als**: `\overline{A \;⊕\; B}`


---

## Beispiele
- `A & B` wird als $A \;\&\; B$ gerendert.
- `A + B` wird als $A \;∨\; B$ gerendert.
- `!A` wird als $\overline{A}$ gerendert.
- `A XOR B` wird als $A \;⊕\; B$ gerendert.


