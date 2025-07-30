
# Symmetry Mapper Function

Gesucht ist eine Funktion, die einen Dezimalindex aus der Wahrheitstabelle einer booleschen Funktion auf das zugehörige Feld im Symmetriediagramm abbildet. 
# Mathematische Beschreibung
Mathematisch kann die gesuchte Abbildung wie folgt beschrieben werden:

$$
f: \{0,1\}^n \to (\mathbb{N} \cup \{0\})^2 \quad \text{mit } n \leq 4
$$

Die zugehörige Abbildung ist gegeben durch:
$$
f(\vec{X}) = \begin{pmatrix}
    x_3 \oplus x_1 + x3 \ll 1 \\
    x_2 \oplus x_0 + x_2 \ll 1
\end{pmatrix}
$$
Dabei ist $\oplus$ die bitweise XOR-Operation und $\ll$ die bitweise Linksverschiebung.
Dieses beiden logischen Ausdrücke lassen sich aritmetisch wie folgt umformen:

$$
a \oplus b = a + b - 2ab
$$

$$
a \ll 1 = 2a
$$

Für die Abbildung ergibt sich somit:
$$
f(\vec{X}) = \begin{pmatrix}
    x_3 + x_1 - 2x_3x_1 + 2x_3 \\
    x_2 + x_0 - 2x_2x_0 + 2x_2
\end{pmatrix}
$$
## JavaScript-Implementierung
Die JavaScipt-Implementierung dieser Abbildung ist wie folgt:


```js
/**
 * Maps a decimal index to the corresponding field in the symmetry diagram.
 * @param {number} decimalIndex - The decimal index to map.
 * @returns {number[]} An array containing the row and column indices in the symmetry diagram.
 */
function mapDecimalToSymmetryDiagramField(decimalIndex) {
    const bits = Array.from({ length: 4 }, (_, i) => (decimalIndex >> i) & 1);

    const [a0, a1, a2, a3] = bits;

    const r = (a3 ^ a1) + (a3 << 1);
    const c = (a2 ^ a0) + (a2 << 1);
    
    return [r, c];
}
```
Dabei sind `^` und `<<` die bitweise XOR-Operation und die bitweise Linksverschiebung in JavaScript.

# Begründung der Korrektheit

Dass Symmetriediagramm funktioniert intern wie ein Gray-Code-Grid :
- Da das Symmetriediagramm die Eigenschaft hat, dass benachbarte Felder sich nur in einem Bit unterscheiden, erzeugt man mit der oben beschriebenen Abbildung ein Gray-Code-Grid. Die Terme $x_3 \oplus x_1 + 2x3$ und $x_2 \oplus x_0 + 2x_2$ leiten sich direkt aus der Definition der Generatorfunktion für einen 2-Bit Gray-Code ab:
$$
\text{Gray}(a,b) = (a,a \oplus b )
$$

- $(a,a \oplus b )$ ist also ein 2-Bit CW und kann somit 4 verschiedene Zustände annehmen. Um das Ergebnis aber nun als Index $\in \{0,1,2,3\}$ darzustellen wird das höherwertige Bit mit 2 multipliziert und das niederwertige Bit addiert:
$$
\text{Index}(a,b) = a\oplus b + 2b
$$
- Das gilt sowohl für die Zeilen- als auch für die Spaltenindizes, da das Symmetriediagramm symmetrisch ist und somit die gleiche Abbildung für beide Achsen verwendet werden kann.
- Für die Berechnung der Zeilen- und Spaltenindizes nimmt nicht benachbarte Bits für r und c, damit jede Achse einen eigenen unabhängigen Gray-Code bekommt und sich die Bitänderungen sauber trennen.






---



- https://elib.dlr.de/60489/2/Strang_Thomas.pdf