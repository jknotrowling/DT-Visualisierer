import {parseLogicFunction, normalizeExpression, normalizedExpressiontoLatex } from '../src/logic/parser.js';





const nExp =normalizeExpression("not(A)not(C+D + B XOR A XOR C)+A")

const latex = normalizedExpressiontoLatex(nExp);

console.log(`Normalized Expression: ${nExp}`);

console.log(latex);