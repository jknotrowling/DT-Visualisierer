
function mapDecimalToSymmetryDiagramField(decimalIndex){
    const bits =  Array.from({ length: 4 }, (_, i) => (decimalIndex >> i) & 1);

    const [a0, a1, a2, a3] = bits;

    return [
        a3+a1-2*(a3*a1) + 2*a3,
        a2+a0-2*(a2*a0) + 2*a2
    ]
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