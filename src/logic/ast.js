// ===================================================================
// Internal Implementation: AST Node Classes, Lexer, Parser
// ===================================================================

class ASTNode {
  // Base class for all AST nodes
}

class VariableNode extends ASTNode {
  constructor(name) {
    super();
    this.name = name;
  }
}

class ConstantNode extends ASTNode {
  constructor(value) {
    super();
    this.value = value;
  }
}

class UnaryOpNode extends ASTNode {
  constructor(operator, operand) {
    super();
    this.operator = operator; // e.g., '!'
    this.operand = operand;
  }
}

class BinaryOpNode extends ASTNode {
  constructor(operator, left, right) {
    super();
    this.operator = operator; // e.g., '&', '|', '^'
    this.left = left;
    this.right = right;
  }
}

const tokenTypes = {
  VARIABLE: 'VARIABLE',
  CONSTANT: 'CONSTANT',
  OPERATOR: 'OPERATOR',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  EOF: 'EOF',
};

class Lexer {
  constructor(text) {
    this.text = text;
    this.pos = 0;
    this.currentChar = this.text[this.pos];
  }

  advance() {
    this.pos++;
    if (this.pos > this.text.length - 1) {
      this.currentChar = null; // End of input
    } else {
      this.currentChar = this.text[this.pos];
    }
  }

  skipWhitespace() {
    while (this.currentChar !== null && /\s/.test(this.currentChar)) {
      this.advance();
    }
  }

  getNextToken() {
    while (this.currentChar !== null) {
      if (/\s/.test(this.currentChar)) {
        this.skipWhitespace();
        continue;
      }

      if (/[A-Ha-h]/.test(this.currentChar)) {
        const token = { type: tokenTypes.VARIABLE, value: this.currentChar.toUpperCase() };
        this.advance();
        return token;
      }
      
      if (/[01]/.test(this.currentChar)) {
        const token = { type: tokenTypes.CONSTANT, value: parseInt(this.currentChar) };
        this.advance();
        return token;
      }

      if (['&', '|', '^', '!', '#', '$', '='].includes(this.currentChar)) {
        const token = { type: tokenTypes.OPERATOR, value: this.currentChar };
        this.advance();
        return token;
      }

      if (this.currentChar === '(') {
        this.advance();
        return { type: tokenTypes.LPAREN, value: '(' };
      }

      if (this.currentChar === ')') {
        this.advance();
        return { type: tokenTypes.RPAREN, value: ')' };
      }

      throw new Error(`Invalid character: ${this.currentChar}`);
    }

    return { type: tokenTypes.EOF, value: null };
  }
}

class Parser {
  constructor(lexer) {
    this.lexer = lexer;
    this.currentToken = this.lexer.getNextToken();
  }

  eat(tokenType) {
    if (this.currentToken.type === tokenType) {
      this.currentToken = this.lexer.getNextToken();
    } else {
      throw new Error(`Parsing error: Expected ${tokenType}, got ${this.currentToken.type}`);
    }
  }

  factor() {
    const token = this.currentToken;

    if (token.type === tokenTypes.VARIABLE) {
      this.eat(tokenTypes.VARIABLE);
      return new VariableNode(token.value);
    } else if (token.type === tokenTypes.CONSTANT) {
      this.eat(tokenTypes.CONSTANT);
      return new ConstantNode(token.value);
    } else if (token.type === tokenTypes.LPAREN) {
      this.eat(tokenTypes.LPAREN);
      const node = this.expression();
      this.eat(tokenTypes.RPAREN);
      return node;
    } else if (token.type === tokenTypes.OPERATOR && token.value === '!') {
      this.eat(tokenTypes.OPERATOR);
      return new UnaryOpNode('!', this.factor());
    } else {
      throw new Error(`Parsing error: Unexpected token ${token.type}`);
    }
  }

  term() {
    let node = this.factor();
    while (true) {
      if (this.currentToken.type === tokenTypes.OPERATOR && ['&', '^', '#', '='].includes(this.currentToken.value)) {
        const token = this.currentToken;
        this.eat(tokenTypes.OPERATOR);
        node = new BinaryOpNode(token.value, node, this.factor());
        continue;
      }
      const nextToken = this.currentToken;
      if (
        nextToken.type === tokenTypes.VARIABLE ||
        nextToken.type === tokenTypes.CONSTANT ||
        nextToken.type === tokenTypes.LPAREN ||
        (nextToken.type === tokenTypes.OPERATOR && nextToken.value === '!')
      ) {
        node = new BinaryOpNode('&', node, this.factor());
        continue;
      }
      break;
    }
    return node;
  }

  expression() {
    let node = this.term();
    while (this.currentToken.type === tokenTypes.OPERATOR && ['|', '$'].includes(this.currentToken.value)) {
      const token = this.currentToken;
      this.eat(tokenTypes.OPERATOR);
      node = new BinaryOpNode(token.value, node, this.term());
    }
    return node;
  }

  parse() {
    const node = this.expression();
    if (this.currentToken.type !== tokenTypes.EOF) {
        throw new Error("Parsing error: Extra characters at end of expression");
    }
    return node;
  }
}

// ===================================================================
// Public API
// ===================================================================

export class AST {
    #root;

    constructor(expression) {
        const lexer = new Lexer(expression);
        const parser = new Parser(lexer);
        this.#root = parser.parse();
    }

    #stringifyNode(node, parentPrecedence = 0, isLatex = false) {
        const precedence = { '|': 1, '$': 1, '^': 2, '=': 2, '&': 3, '#': 3, '!': 4 };

        if (node instanceof VariableNode) return node.name;
        if (node instanceof ConstantNode) return String(node.value);

        if (node instanceof UnaryOpNode) {
            const opPrec = precedence[node.operator];
            if (isLatex) {
                const operandStr = this.#stringifyNode(node.operand, 0, true);
                return `\\overline{${operandStr}}`;
            } else {
                const operandStr = this.#stringifyNode(node.operand, opPrec, false);
                return `!${operandStr}`;
            }
        }

        if (node instanceof BinaryOpNode) {
            const opPrec = precedence[node.operator];

            if (isLatex) {
                // Handle NAND, NOR, XNOR with standard overline notation
                if (node.operator === '#') { // NAND
                    const inner = this.#stringifyNode(new BinaryOpNode('&', node.left, node.right), 0, true);
                    return `\\overline{${inner}}`;
                }
                if (node.operator === '$') { // NOR
                    const inner = this.#stringifyNode(new BinaryOpNode('|', node.left, node.right), 0, true);
                    return `\\overline{${inner}}`;
                }
                if (node.operator === '=') { // XNOR
                    const inner = this.#stringifyNode(new BinaryOpNode('^', node.left, node.right), 0, true);
                    return `\\overline{${inner}}`;
                }
            }
            
            const leftStr = this.#stringifyNode(node.left, opPrec, isLatex);
            const rightStr = this.#stringifyNode(node.right, opPrec, isLatex);

            let str;
            if (isLatex) {
                const operatorMap = { '&': ' \\& ', '|': ' \\lor ', '^': ' \\oplus ' };
                str = `${leftStr}${operatorMap[node.operator]}${rightStr}`;
            } else {
                const operatorMap = { 
                    '&': '&', '|': '|', '^': '^',
                    '#': 'NAND', '$': 'NOR', '=': 'XNOR'
                };
                str = `${leftStr} ${operatorMap[node.operator]} ${rightStr}`;
            }
            
            if (opPrec < parentPrecedence) {
                return `(${str})`;
            }
            return str;
        }
        return '';
    }

    #evaluateNode(node, variableValues) {
        if (node instanceof ConstantNode) return node.value;
        if (node instanceof VariableNode) {
            if (variableValues[node.name] === undefined) {
                throw new Error(`Undefined variable: ${node.name}`);
            }
            return variableValues[node.name];
        }
        if (node instanceof UnaryOpNode) {
            const operandValue = this.#evaluateNode(node.operand, variableValues);
            if (node.operator === '!') return operandValue ? 0 : 1;
        }
        if (node instanceof BinaryOpNode) {
            const leftValue = this.#evaluateNode(node.left, variableValues);
            const rightValue = this.#evaluateNode(node.right, variableValues);
            switch (node.operator) {
                case '&': return leftValue && rightValue;
                case '|': return leftValue || rightValue;
                case '^': return leftValue !== rightValue ? 1 : 0;
                case '#': return (leftValue && rightValue) ? 0 : 1; // NAND
                case '$': return (leftValue || rightValue) ? 0 : 1; // NOR
                case '=': return (leftValue === rightValue) ? 1 : 0; // XNOR
            }
        }
        throw new Error('Invalid AST node');
    }

    toString() {
        return this.#stringifyNode(this.#root, 0, false);
    }

    toLatex() {
        return this.#stringifyNode(this.#root, 0, true);
    }

    evaluate(variableValues) {
        return this.#evaluateNode(this.#root, variableValues);
    }
}
