// ----------------- Parser (Binary AST) -----------------
let tokens = [];
let currentToken = 0;
let nodeIdCounter = 0;

/**
 * Parses a logical expression and converts it into an Abstract Syntax Tree (AST).
 *
 * @param {string} expression - The logical expression to parse.
 * @returns {object} The root node of the AST.
 */
export function parse(expression) {
    const sanitized = expression.replace(/\s/g, '');
    tokens = sanitized.match(/!|[A-Z]|&|\||\(|\)/g) || [];
    currentToken = 0;
    nodeIdCounter = 0;
    const ast = parseOr();
    if (currentToken < tokens.length) {
        throw new Error(`Unerwartetes Token: ${tokens[currentToken]}`);
    }
    return ast;
}

/**
 * Consumes the current token if it matches the expected token type.
 *
 * @param {string} tokenType - The expected token type.
 */
function eat(tokenType) {
    if (currentToken < tokens.length && tokens[currentToken] === tokenType) {
        currentToken++;
    } else {
        throw new Error(`Erwartet: ${tokenType}, aber gefunden: ${tokens[currentToken]}`);
    }
}

/**
 * Parses an OR expression.
 *
 * @returns {object} An AST node representing the OR expression.
 */
function parseOr() {
    let node = parseAnd();
    while (currentToken < tokens.length && tokens[currentToken] === '|') {
        eat('|');
        node = { id: `node-${nodeIdCounter++}`, type: 'operator', op: '|', left: node, right: parseAnd() };
    }
    return node;
}

/**
 * Parses an AND expression.
 *
 * @returns {object} An AST node representing the AND expression.
 */
function parseAnd() {
    let node = parseFactor();
    while (currentToken < tokens.length && tokens[currentToken] === '&') {
        eat('&');
        node = { id: `node-${nodeIdCounter++}`, type: 'operator', op: '&', left: node, right: parseFactor() };
    }
    return node;
}

/**
 * Parses a factor, which can be a variable, a NOT expression, or a parenthesized expression.
 *
 * @returns {object} An AST node representing the factor.
 */
function parseFactor() {
    const token = tokens[currentToken];
    if (token === '!') {
        eat('!');
        return { id: `node-${nodeIdCounter++}`, type: 'operator', op: '!', left: parseFactor(), right: null };
    } else if (/[A-Z]/.test(token)) {
        eat(token);
        return { id: `node-${nodeIdCounter++}`, type: 'variable', name: token };
    } else if (token === '(') {
        eat('(');
        const node = parseOr();
        eat(')');
        return node;
    } else {
        throw new Error(`Unerwartetes Token: ${token}`);
    }
}
