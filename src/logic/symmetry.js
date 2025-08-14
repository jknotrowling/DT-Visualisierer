/**
 * Bildet einen Dezimalindex aus der Wahrheitstabelle auf Koordinaten im Symmetriediagramm ab
 * @param {number} decimalIndex - Der Dezimalindex aus der Wahrheitstabelle (0 bis 2^n-1)
 * @param {number} numberOfVariables - Anzahl der Variablen (2, 3 oder 4)
 * @returns {number[]} Array mit [Zeile, Spalte] im Symmetriediagramm
 * @throws {Error} - Wenn numberOfVariables nicht (2,3 oder 4) oder decimalIndex außerhalb des erlaubten Bereichs liegt.
 */
export function mapDecimalToSymmetryDiagramField(decimalIndex, numberOfVariables) {

    if(numberOfVariables > 4 || numberOfVariables < 2) {
        throw new Error("'numberOfVariables' must be an integer ∈ [2, 4]");
    }

    if (decimalIndex < 0 || decimalIndex > (2**numberOfVariables)-1 || !Number.isInteger(decimalIndex)) {
        throw new Error(`'decimalIndex' must be an integer ∈ [0, ${(2**numberOfVariables)-1}]`);
    }


    const bits = Array.from({ length: 4 }, (_, i) => (decimalIndex >> i) & 1);

    const [a0, a1, a2, a3] = bits;

    const r = (a3 ^ a1) + (2*a3);
    const c = (a2 ^ a0) + (2*a2);
    
    return [r, c];
}

export function getNumberOfRowsAndCols(numberOfVariables) {
    if (numberOfVariables < 2 || numberOfVariables > 4) {
        throw new Error("'numberOfVariables' must be an integer ∈ [2, 4]");
    }
    let rows, cols;
    if (numberOfVariables % 2 === 0) {
        rows = cols = 2 ** (numberOfVariables / 2);
    } else {
        rows = 2 ** ((numberOfVariables - 1) / 2);
        cols = 2 ** ((numberOfVariables + 1) / 2);
    }
    return { rows, cols };
}

function createEmptySymmetryDiagram(n) {
    const {rows, cols} = getNumberOfRowsAndCols(n);

    return Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
}


export function decimalToOctal(decimal) {
    if (typeof decimal !== 'number' || !Number.isInteger(decimal) || decimal < 0) {
        throw new Error("'decimal' must be a non-negative integer.");
    }
    let octal = '';
    do {
        octal = (decimal % 8) + octal;
        decimal = Math.floor(decimal / 8);
    } while (decimal > 0);
    return octal;
}

/**
 * Projiziert eine vollständige Wahrheitstabelle auf das Symmetriediagramm
 * Verwendet:
 *   - createEmptySymmetryDiagram zum Anlegen der Zielmatrix
 *   - mapDecimalToSymmetryDiagramField zur Koordinatenabbildung
 * @param {number} numberOfVariables
 * @param {Array<number|string>} truthTable
 * @returns {SymmetryDiagram} - 2D-Array mit den in das Diagramm gemappten Werten.
 * @throws {Error} - Wenn truthTable nicht die exakt benötigte Länge besitzt.
 */
export function truthTableToSymmetryDiagram(numberOfVariables, truthTable) {
    console.log(truthTable, truthTable.length, 2**numberOfVariables);
    if (!Array.isArray(truthTable) || truthTable.length !== 2**numberOfVariables) {
       throw new Error(`Truth table must be an array of ${2**numberOfVariables} elements.`);
    }

    const symmetryDiagram = createEmptySymmetryDiagram(numberOfVariables);
   
    for (let i = 0; i < 2**numberOfVariables; i++) {
        const [r, c] = mapDecimalToSymmetryDiagramField(i, numberOfVariables);
        if (r !== null && c !== null) {
            symmetryDiagram[r][c] = truthTable[i];
        }
    }
    return symmetryDiagram;
}


