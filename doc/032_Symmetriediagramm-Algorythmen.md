# Symmetriediagramm

Das Symmetriediagramm ist eine grafische Darstellung der Symmetrieeigenschaften digitaler Funktionen. Es wird aus einer Wahrheitstabelle generiert und bietet eine visuelle Analyse der Symmetrie. Im Hintergrund wird das Symmetriediagramm als Matrix dargestellt.

## Mapping-Funktion: `mapDecimalToSymmetryDiagramField`

Die zentrale Funktion `mapDecimalToSymmetryDiagramField(decimalIndex, numberOfVariables)` bildet einen Dezimalindex aus der Wahrheitstabelle auf die entsprechenden Zeilen- und Spaltenindizes im Symmetriediagramm ab.

### Funktionsignatur

```javascript
/**
 * Bildet einen Dezimalindex aus der Wahrheitstabelle auf Koordinaten im Symmetriediagramm ab
 * @param {number} decimalIndex - Der Dezimalindex aus der Wahrheitstabelle (0 bis 2^n-1)
 * @param {number} numberOfVariables - Anzahl der Variablen (2, 3 oder 4)
 * @returns {number[]} Array mit [Zeile, Spalte] im Symmetriediagramm
 * @throws {Error} - Wenn numberOfVariables nicht (2,3 oder 4) oder decimalIndex außerhalb des erlaubten Bereichs liegt.
 */
export function mapDecimalToSymmetryDiagramField(decimalIndex, numberOfVariables) {
```

### Parameter-Validierung

```javascript
if(numberOfVariables > 4 || numberOfVariables < 2) {
    throw new Error("'numberOfVariables' must be an integer ∈ [2, 4]");
}

if (decimalIndex < 0 || decimalIndex > (2**numberOfVariables)-1 || !Number.isInteger(decimalIndex)) {
    throw new Error(`'decimalIndex' must be an integer ∈ [0, ${(2**numberOfVariables)-1}]`);
}
```

**Eingabe-Beschränkungen**:
- `numberOfVariables`: Ganzzahl zwischen 2 und 4 (inklusive), $n \in \{2, 3, 4\}$
- `decimalIndex`: Ganzzahl zwischen 0 und $2^n-1$, $\text{decimalIndex} \in \{0, 1, ..., 2^n-1\}$

### Algorithmus

#### 1. Bit-Extraktion
```javascript
const bits = Array.from({ length: 4 }, (_, i) => (decimalIndex >> i) & 1);
const [a0, a1, a2, a3] = bits;
```
**Was passiert**: Der Dezimalindex wird in seine 4 Binärbits aufgeteilt:
- $a_0$: Bit 0 (niedrigstes Bit)
- $a_1$: Bit 1  
- $a_2$: Bit 2
- $a_3$: Bit 3 (höchstes Bit)

#### 2. Gray-Code-basierte Koordinaten-Berechnung
```javascript
const r = (a3 ^ a1) + (2*a3);  // Zeilen-Index
const c = (a2 ^ a0) + (2*a2);  // Spalten-Index

return [r, c];
```

## Mathematische Beschreibung

Mathematisch kann die gesuchte Abbildung wie folgt beschrieben werden:

$$
f: \{0,1\}^n \to \begin{cases}
    2^{\frac{n+1}{2}} \times 2^{\frac{n-1}{2}} & \text{wenn } n \text{ ungerade} \\
    2^{\frac{n}{2}} \times 2^{\frac{n}{2}} & \text{wenn } n \text{ gerade}
\end{cases} \quad \text{mit } n \in \mathbb{N}, n \leq 4
$$

Dass Symmetriediagramm funktioniert intern wie ein Gray-Code-Grid :
- Da das Symmetriediagramm die Eigenschaft hat, dass benachbarte Felder sich nur in einem Bit unterscheiden, erzeugt man mit der oben beschriebenen Abbildung ein Gray-Code-Grid. Die Terme $x_3 \oplus x_1 + 2x3$ und $x_2 \oplus x_0 + 2x_2$ leiten sich direkt aus der Definition der Generatorfunktion für einen 2-Bit Gray-Code ab:
$$
\text{Gray}(a,b) = (a,a \oplus b )
$$

- $(a,a \oplus b )$ ist also ein 2-Bit CW und kann somit 4 verschiedene Zustände annehmen. Um das Ergebnis aber nun als Index $\in \{0,1,2,3\}$ darzustellen sie in eine Dezimalzahl umgewandelt:
$$
\text{Index}(a,b) = (a\oplus b) \cdot 2^0 + 2a \cdot 2^1 = a \oplus b + 2a
$$
- Das gilt sowohl für die Zeilen- als auch für die Spaltenindizes, da das Symmetriediagramm symmetrisch ist und somit die gleiche Abbildung für beide Achsen verwendet werden kann.
- Für die Berechnung der Zeilen- und Spaltenindizes nimmt nicht benachbarte Bits für r und c, damit jede Achse einen eigenen unabhängigen Gray-Code bekommt und sich die Bitänderungen sauber trennen.




### Diagramm-Dimensionen


| Variablen | Matrix-Größe |
|-----------|--------------|
| 2         | $2 \times 2$ |
| 3         | $2 \times 4$ |
| 4         | $4 \times 4$ |
| n         | $2^{\frac{n+1}{2}} \times 2^{\frac{n-1}{2}}$ (wenn n ungerade) / $2^{\frac{n}{2}} \times 2^{\frac{n}{2}}$ (wenn n gerade) |

## Referenzen

- https://elib.dlr.de/60489/2/Strang_Thomas.pdf

