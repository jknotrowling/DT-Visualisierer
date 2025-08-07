# Custom Function Syntax

Hier soll die Syntax für benutzerdefinierte Funktionen beschrieben werden. Diese Syntax wird verwendet, individuelle Funktionen zu definieren, die in der Anwendung verwendet werden können.


## Syntax
Die Syntax für benutzerdefinierte Funktionen folgt dem folgenden Muster:
- Für Konjunktionen (UND) sind folgende Operatoren zulässig: 
    - `&` Kaufmännisches UND
    - `*` Sternchen (Multiplikation)
    - `∧` Mathematisches UND
    - Außerdem ist die Syntax `ab = a & b` zulässig, um eine Konjunktion zu definieren. Oder mit Klammern: `a(b+c) = a & (b + c)`
    - **Wird gerendert als**: `&`
- Für Disjunktionen (ODER) sind folgende Operatoren zulässig:
    - `+` Pluszeichen
    - `|` Senkrechter Strich 
    - `∨` Mathematisches ODER
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

---
### Experimentelle Operatoren
- Für Implikationen (Impliziert) ist der folgende Operator zulässig:
    - `→` Mathematisches Implikation
    - `⇒` Mathematisches Implikation (doppelpfeil)
    - **Wird gerendert als**: $\Rightarrow$

- Für Äquivalenzen (Äquivalent) ist der folgende Operator zulässig:
    - `↔` Mathematisches Äquivalent
    - `≡` Mathematisches Äquivalent (doppelpfeil)
    - **Wird gerendert als**: $\Leftrightarrow$

## Beispiele
- `A & B` wird als $A \;\&\; B$ gerendert.
- `A + B` wird als $A \;∨\; B$ gerendert.
- `!A` wird als $\overline{A}$ gerendert.
- `A XOR B` wird als $A \;⊕\; B$ ger
- `not(A & B → C) + D XOR A` wird als $\overline{A \;\&\; B \Rightarrow C} \;∨\; D \;⊕\; A$ gerendert.

