export function mapDecimalToSymmetryDiagramField(decimalIndex, numberOfVariables) {

    if(numberOfVariables > 4 || numberOfVariables < 2) {
        throw new Error("'numberOfVariables' must be an integer ∈ [2, 4]");
    }

    if (decimalIndex < 0 || decimalIndex > (2**numberOfVariables)-1 || !Number.isInteger(decimalIndex)) {
        throw new Error(`'decimalIndex' must be an integer ∈ [0, ${(2**numberOfVariables)-1}]`);
    }

    const a0 = (decimalIndex >> 0) & 1;
    const a1 = (decimalIndex >> 1) & 1;
    const a2 = numberOfVariables > 2 ? (decimalIndex >> 2) & 1 : 0;
    const a3 = numberOfVariables > 3 ? (decimalIndex >> 3) & 1 : 0;
    
    let r, c;
    
    if (numberOfVariables === 2) {
        // For 2 variables: simple 2x2 mapping
        r = a1;
        c = a0;
    } else if (numberOfVariables === 3) {
        // For 3 variables: 2x4 mapping
        r = a2;
        c = (a1 << 1) | a0;
    } else { // numberOfVariables === 4
        // For 4 variables: 4x4 Gray code mapping
        r = (a3 ^ a1) + (a3 << 1);
        c = (a2 ^ a0) + (a2 << 1);
    }
    
    return [r, c];
}



const TEST_CASES = [
    {input: 0, n: 4, expected: [0, 0]},
    {input: 1, n: 4, expected: [0, 1]},
    {input: 2, n: 4, expected: [1, 0]},
    {input: 3, n: 4, expected: [1, 1]},
    {input: 4, n: 4, expected: [0, 3]},
    {input: 5, n: 4, expected: [0, 2]},
    {input: 6, n: 4, expected: [1, 3]},
    {input: 7, n: 4, expected: [1, 2]},
    {input: 8, n: 4, expected: [3, 0]},
    {input: 9, n: 4, expected: [3, 1]},
    {input: 10, n: 4, expected: [2, 0]},
    {input: 11, n: 4, expected: [2, 1]},
    {input: 12, n: 4, expected: [3, 3]},
    {input: 13, n: 4, expected: [3, 2]},
    {input: 14, n: 4, expected: [2, 3]},
    {input: 15, n: 4, expected: [2, 2]}
]


TEST_CASES.forEach(({input, n, expected}) => {
    const result = mapDecimalToSymmetryDiagramField(input, n);
    if (JSON.stringify(result) !== JSON.stringify(expected)) {
        // Colorful error output with emoji
        console.error(
            `\x1b[41m❌ Test failed for input ${input} with n=${n}: expected ${expected}, got ${result}\x1b[0m`
        );
    } else {
        // Success output with emoji
        console.log(`✅ Test passed for input ${input} with n=${n}`);
    }
});