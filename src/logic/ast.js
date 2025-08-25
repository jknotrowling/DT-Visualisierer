class ASTNode {
  // Basisklasse für alle Knoten AST.
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
    this.operator = operator; // z.B., '!'
    this.operand = operand;
  }
}

class BinaryOpNode extends ASTNode {
  constructor(operator, left, right) {
    super();
    this.operator = operator; // z.B., '&', '|', '^'
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

/**
 * Der Lexer zerlegt einen Eingabetext in einzelne Token für die weitere Verarbeitung.
 * Er erkennt Variablen (A-H, a-h), Konstanten (0, 1), Operatoren (&, |, ^, !, #, $, =),
 * sowie Klammern und ignoriert Leerzeichen.
 *
 * @class
 * @param {string} text - Der zu analysierende Eingabetext.
 *
 * @property {string} text - Der Eingabetext.
 * @property {number} pos - Aktuelle Position im Text.
 * @property {string|null} currentChar - Das aktuell betrachtete Zeichen.

 */
class Lexer {
  constructor(text) {
    this.text = text;
    this.pos = 0;
    this.currentChar = this.text[this.pos];
  }

  /**
   * Setzt den Positionszeiger um eins weiter und aktualisiert das aktuelle Zeichen.
   * Falls das Ende des Eingabetextes erreicht ist, wird `currentChar` auf `null` gesetzt.
   */
  advance() {
    this.pos++;
    if (this.pos > this.text.length - 1) {
      this.currentChar = null; // End of input
    } else {
      this.currentChar = this.text[this.pos];
    }
  }

  /**
   * Überspringt alle Leerzeichen im aktuellen Eingabestrom,
   * indem der aktuelle Zeichenzeiger solange weitergeschaltet wird,
   * bis kein Leerzeichen mehr gefunden wird.
   */

  skipWhitespace() {
    while (this.currentChar !== null && /\s/.test(this.currentChar)) {
      this.advance();
    }
  }

  /**
   * Gibt das nächste Token aus dem Eingabe-String zurück.
   * Überspringt Leerzeichen und erkennt Variablen (A-H, a-h), Konstanten (0, 1),
   * Operatoren (&, |, ^, !, #, $, =), sowie Klammern '(' und ')'.
   * Wirft einen Fehler bei ungültigen Zeichen.
   * Gibt ein Token-Objekt mit Typ und Wert zurück oder ein EOF-Token am Ende der Eingabe.
   *
   * @returns {{ type: string, value: any }} Das nächste erkannte Token.
   * @throws {Error} Wenn ein ungültiges Zeichen gefunden wird.
   */

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

      throw new Error(`Ungültiges Zeichen: ${this.currentChar}`);
    }

    return { type: tokenTypes.EOF, value: null };
  }
}



/**
 * Parser für logische Ausdrücke.
 * 
 * Der Parser verarbeitet einen Token-Stream, der von einem Lexer bereitgestellt wird, und erzeugt einen abstrakten Syntaxbaum (AST) für logische Ausdrücke.
 * Unterstützt Variablen, Konstanten, geklammerte Ausdrücke, unäre und binäre Operatoren sowie implizite UND-Verknüpfungen.
 * 
 * @class
 * @param {Lexer} lexer - Der Lexer, der die Token für den Parser bereitstellt.
 */

class Parser {
  constructor(lexer) {
    this.lexer = lexer;
    this.currentToken = this.lexer.getNextToken();
  }


  /**
   * Verbraucht das aktuelle Token, wenn es dem erwarteten Token-Typ entspricht.
   * Wechselt zum nächsten Token vom Lexer.
   *
   * @param {string} tokenType - Der erwartete Typ des aktuellen Tokens.
   * @throws {Error} Falls der aktuelle Token-Typ nicht mit dem erwarteten tokenType übereinstimmt.
   */
  eat(tokenType) {
    if (this.currentToken.type === tokenType) {
      this.currentToken = this.lexer.getNextToken();
    } else {
      throw new Error(`Parsing-Fehler: Erwartet ${tokenType}, erhalten ${this.currentToken.type}`);
    }
  }
  
  /**
   * Parst einen Faktor aus dem aktuellen Token-Stream.
   * Ein Faktor kann eine Variable, eine Konstante, ein geklammerter Ausdruck oder eine unäre Operation (z.B. '!') sein.
   * Verschiebt den Token-Stream entsprechend und erstellt den passenden AST-Knoten.
   *
   * @returns {VariableNode|ConstantNode|UnaryOpNode|ASTNode} Der geparste AST-Knoten, der den Faktor repräsentiert.
   * @throws {Error} Falls das aktuelle Token keinem erwarteten Faktor-Typ entspricht.
   */
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
      throw new Error(`Parsing-Fehler: Unerwartetes Token ${token.type}`);
    }
  }


  /**
   * Analysiert und erstellt einen AST-Knoten für einen Term.
   * Ein Term besteht aus Faktoren, die durch Operatoren wie '&', '^', '#', '=' verbunden sind.
   * Implizite UND-Verknüpfungen werden ebenfalls unterstützt, wenn zwei Faktoren direkt aufeinander folgen.
   *
   * @returns {BinaryOpNode} Der AST-Knoten, der den analysierten Term repräsentiert.
   */
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

  /**
   * Analysiert und parst einen Ausdruck, der aus Termen besteht, die durch die Operatoren '|' oder '$' verbunden sind.
   * Gibt einen abstrakten Syntaxbaum (AST) für den Ausdruck zurück.
   *
   * @returns {Node} Der Wurzelknoten des geparsten Ausdrucks.
   */
  expression() {
    let node = this.term();
    while (this.currentToken.type === tokenTypes.OPERATOR && ['|', '$'].includes(this.currentToken.value)) {
      const token = this.currentToken;
      this.eat(tokenTypes.OPERATOR);
      node = new BinaryOpNode(token.value, node, this.term());
    }
    return node;
  }

  /**
   * Analysiert den aktuellen Ausdruck und gibt den resultierenden AST-Knoten zurück.
   * Wirft einen Fehler, wenn nach dem Parsen noch zusätzliche Zeichen vorhanden sind.
   *
   * @returns {ASTNode} Der Wurzelknoten des geparsten Ausdrucks.
   * @throws {Error} Wenn sich nach dem Ausdruck noch weitere Zeichen befinden.
   */
  parse() {
    // Startpunkt des Parsers. Es wird mit einer Expression begonnen, weil dies die höchste Ebene der Syntax ist.
    const node = this.expression();
    if (this.currentToken.type !== tokenTypes.EOF) {
        throw new Error("Parsing-Fehler: Zusätzliche Zeichen am Ende des Ausdrucks");
    }
    return node;
  }
}


/**
 * Repräsentiert einen abstrakten Syntaxbaum (AST) für boolesche Ausdrücke.
 * 
 * Die Klasse parst einen booleschen Ausdruck, stellt ihn als AST dar und bietet Methoden zur String-, LaTeX- und Baum-Darstellung sowie zur Auswertung.
 * 
 * @class
  * @param {string} expression - Der boolesche Ausdruck, der geparst werden soll.
 */


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
                throw new Error(`Nicht definierte Variable: ${node.name}`);
            }
            return variableValues[node.name];
        }
        if (node instanceof UnaryOpNode) {
            const operandValue = this.#evaluateNode(node.operand, variableValues);
            return operandValue ? 0 : 1; // Negation is the only unary operation in this context
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
        throw new Error('Ungültiger AST-Knoten');
    }

    /**
     * Gibt eine String-Darstellung des AST (Abstract Syntax Tree) zurück.
     * 
     * @returns {string} Die String-Repräsentation des AST.
     */
    toString() {
        return this.#stringifyNode(this.#root, 0, false);
    }

    /**
     * Gibt eine LaTeX-Darstellung des aktuellen AST zurück.
     * 
     * @returns {string} Die LaTeX-Repräsentation des AST.
     */
    toLatex() {
        return this.#stringifyNode(this.#root, 0, true);
    }

    /**
     * Bewertet den AST (Abstract Syntax Tree) mit den angegebenen Variablenwerten.
     *
     * @param {Object} variableValues - Ein Objekt, das Variablennamen auf ihre Werte abbildet. z.B. { A: 1, B: 0, C: 1 }
     * @returns {*} Das Ergebnis der Auswertung des AST.
     */
    evaluate(variableValues) {
        return this.#evaluateNode(this.#root, variableValues);
    }


}
