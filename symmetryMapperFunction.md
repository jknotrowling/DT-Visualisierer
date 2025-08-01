
# Symmetry Mapper Function

Gesucht ist eine Funktion, die einen Dezimalindex aus der Wahrheitstabelle einer booleschen Funktion auf das zugehörige Feld im Symmetriediagramm abbildet. 
# Mathematische Beschreibung
Mathematisch kann die gesuchte Abbildung wie folgt beschrieben werden:

$$
f: \{0,1\}^n \to \begin{cases}
    2^{\frac{n+1}{2}} \times 2^{\frac{n-1}{2}} & \text{wenn } n \text{ ungerade} \\
    2^{\frac{n}{2}} \times 2^{\frac{n}{2}} & \text{wenn } n \text{ gerade}
\end{cases} \quad \text{mit } n \in \mathbb{N}, n \leq 4
$$

Die zugehörige Abbildung ist gegeben durch:
$$
f(\vec{X}) = \begin{pmatrix}
    x_3 \oplus x_1 + 2x_3  \\
    x_2 \oplus x_0 + 2x_2 
\end{pmatrix}
$$
Dabei ist $\oplus$ die bitweise XOR-Operation.
Das logische XOR kann arithmetisch wie folgt dargestellt werden:

$$
a \oplus b = a + b - 2ab
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

    const r = (a3 ^ a1) + (2*a3);
    const c = (a2 ^ a0) + (2*a2);
    
    return [r, c];
}
```
Dabei ist `^` die bitweise XOR-Operation in JavaScript.

# Begründung der Korrektheit

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






---



- https://elib.dlr.de/60489/2/Strang_Thomas.pdf