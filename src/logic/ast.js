// ===================================================================
// Abstract Syntax Tree (AST) Nodes
// ===================================================================

class ASTNode {
  // Super Class
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
    this.operator = operator; //  '!'
    this.operand = operand;
  }
}

class BinaryOpNode extends ASTNode {
  constructor(operator, left, right) {
    super();
    this.operator = operator; //  '&', '|', '^'
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


  // Advance the position to the next character in the input text.
  advance() {
    this.pos++;
    if (this.pos > this.text.length - 1) {
      this.currentChar = null; // End of input
    } else {
      this.currentChar = this.text[this.pos];
    }
  }

  // Skip whitespace characters in the input text.
  skipWhitespace() {
    while (this.currentChar !== null && /\s/.test(this.currentChar)) {
      this.advance();
    }
  }

  // Get the next token from the input text: Variable, Constant, Operator, Parentheses, or EOF.
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

      if (['&', '|', '^', '!'].includes(this.currentChar)) {
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


  // Consume the current token and move to the next one.
  eat(tokenType) {
    if (this.currentToken.type === tokenType) {
      this.currentToken = this.lexer.getNextToken();
    } else {
      throw new Error(`Parsing error: Expected ${tokenType}, got ${this.currentToken.type}`);
    }
  }

  //A factor is a variable, constant, or a parenthesized expression.
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

  // A term is a sequence of factors separated by the AND '&' or XOR '^' operator.
  term() {
    let node = this.factor();

    while (true) {
      // Case 1: Explicit AND or XOR operator
      if (this.currentToken.type === tokenTypes.OPERATOR && ['&', '^'].includes(this.currentToken.value)) {
        const token = this.currentToken;
        this.eat(tokenTypes.OPERATOR);
        node = new BinaryOpNode(token.value, node, this.factor());
        continue;
      }

      // Case 2: Implicit conjunction (e.g., "AB", "A(B)", "(A)B")
      
      const nextToken = this.currentToken;
      if (
        nextToken.type === tokenTypes.VARIABLE ||
        nextToken.type === tokenTypes.CONSTANT ||
        nextToken.type === tokenTypes.LPAREN ||
        (nextToken.type === tokenTypes.OPERATOR && nextToken.value === '!')
      ) {
        // Implicit '&' operator
        node = new BinaryOpNode('&', node, this.factor());
        continue;
      }

      // If neither explicit nor implicit term, break the loop
      break;
    }

    return node;
  }

  // An expression is a sequence of terms separated by the OR operator '|'.
  expression() {
    let node = this.term();

    while (this.currentToken.type === tokenTypes.OPERATOR && this.currentToken.value === '|') {
      const token = this.currentToken;
      this.eat(tokenTypes.OPERATOR);
      node = new BinaryOpNode(token.value, node, this.term());
    }

    return node;
  }

  // The parse method starts the parsing process and returns the root of the AST.
  parse() {
    const node = this.expression();
    if (this.currentToken.type !== tokenTypes.EOF) {
        throw new Error("Parsing error: Extra characters at end of expression");
    }
    return node;
  }
}

export class AST {
  constructor(expression) {
    this.expression = expression;
    this.lexer = new Lexer(expression);
    this.parser = new Parser(this.lexer);
    this.root = this.parser.parse();
  }

  stringify(node = this.root, parentPrecedence = 0, isLatex = false) {
    const precedence = { '|': 1, '^': 2, '&': 3, '!': 4 };

    if (node instanceof VariableNode) {
        return node.name;
    }
    if (node instanceof ConstantNode) {
        return String(node.value);
    }

    if (node instanceof UnaryOpNode) {
        const opPrec = precedence[node.operator];
        
        if (isLatex) {
           
            const operandStr = this.stringify(node.operand, 0, true);
            return `\\overline{${operandStr}}`;
        } else {
            
            const operandStr = this.stringify(node.operand, opPrec, false);
            return `!${operandStr}`;
        }
    }

    if (node instanceof BinaryOpNode) {
        const opPrec = precedence[node.operator];
        const leftStr = this.stringify(node.left, opPrec, isLatex);
        const rightStr = this.stringify(node.right, opPrec, isLatex);

        let str;
        if (isLatex) {
            const operatorMap = { '&': ' \\& ', '|': ' \\lor ', '^': ' \\oplus ' };
            str = `${leftStr}${operatorMap[node.operator]}${rightStr}`;
        } else {
            str = `${leftStr} ${node.operator} ${rightStr}`;
        }
        
        if (opPrec < parentPrecedence) {
            return `(${str})`;
        }
        return str;
    }
    return '';
}
 toString(node=this.root, simplify = false) {
    if (simplify) {

        if (node instanceof UnaryOpNode && node.operator === '!') {
            if (node.operand instanceof UnaryOpNode && node.operand.operator === '!') {
                return this.toString(node.operand.operand, simplify);
            }
        }
    }
    return this.stringify(node, 0, false);
}

toLatex(node = this.root) {
    return this.stringify(node, 0, true);
}

evaluate(node=this.root, variableValues) {
    if (node instanceof ConstantNode) {
        return node.value;
    }
    if (node instanceof VariableNode) {
        if (variableValues[node.name] === undefined) {
            throw new Error(`Undefined variable: ${node.name}`);
        }
        return variableValues[node.name];
    }
    if (node instanceof UnaryOpNode) {
        const operandValue = this.evaluate(node.operand, variableValues);
        if (node.operator === '!') {
            return operandValue ? 0 : 1;
        }
    }
    if (node instanceof BinaryOpNode) {
        const leftValue = this.evaluate(node.left, variableValues);
        const rightValue = this.evaluate(node.right, variableValues);
        switch (node.operator) {
            case '&':
                return leftValue && rightValue;
            case '|':
                return leftValue || rightValue;
            case '^':
                return leftValue !== rightValue ? 1 : 0;
        }
    }
    throw new Error('Invalid AST node');
}


}







