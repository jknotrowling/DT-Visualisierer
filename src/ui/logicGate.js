import { logicState, customFunctionState, VARIABLE_NAMES } from "../state.js";
import { normalizeExpression, getMinimalExpression } from "../logic/parser.js";
import {$} from "../utils/utils.js";
import { parse } from '../logic/logicGateParser.js';

export const LOGIC_GATE_STATE = {
  drawnElements: {},
  ast: null,
};

/**
 * Renders the logic gate diagram based on the current minimal expression.
 * It parses the expression, builds an abstract syntax tree (AST),
 * and then uses an SVG renderer to draw the logic gates.
 * If the expression is a constant, it displays a message instead.
 * In case of an error, it shows an error message.
 */
export function renderLogicGate() {
  const logicGateCard = document.getElementById("logicGateCard");
  if (!logicGateCard) return;

  const container = document.getElementById("logic-gate-container");
  if (!container) return;
  
  container.innerHTML = "";

  const expression = getMinimalExpression();
  
  if (!expression || expression === "0" || expression === "1") {
    container.innerHTML = `<div class="p-4 text-center text-gray-500">Keine Logikgatter für Konstanten darstellbar.</div>`;
    LOGIC_GATE_STATE.drawnElements = {};
    LOGIC_GATE_STATE.ast = null;
    return;
  }

  const normalizedExpr = normalizeExpression(expression);
  
  try {
    let ast = parse(normalizedExpr);
    LOGIC_GATE_STATE.ast = ast;
    const {svg, drawnElements} = renderSvg(ast);
    LOGIC_GATE_STATE.drawnElements = drawnElements;
    container.appendChild(svg);
  } catch (error) {
    console.error("Error rendering logic gate:", error);
    container.innerHTML = `<div class="p-4 text-center text-red-500">Fehler beim Darstellen des Logikgatters: ${error.message}</div>`;
  }
}



// ----------------- SVG Renderer (Binary AST) -----------------
const GATE_WIDTH = 60;
const GATE_HEIGHT = 40;
const NOT_GATE_SIZE = 40;
const LEVEL_SEPARATION = 100;
const SIBLING_SEPARATION = 20;
const PADDING = 10;

let y_pos = 0;
let max_level = 0;

/**
 * Renders the logic gate diagram as an SVG element from an AST.
 *
 * @param {object} ast The abstract syntax tree of the logic expression.
 * @returns {{svg: SVGElement, drawnElements: object}} An object containing the SVG element and a map of drawn elements.
 */
function renderSvg(ast) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svg.appendChild(g);

    const drawnElements = {};

    y_pos = PADDING;
    max_level = 0;
    
    layout(ast, 0);
    
    const totalWidth = (max_level + 1) * LEVEL_SEPARATION + GATE_WIDTH + PADDING * 2;
    const totalHeight = y_pos + PADDING;

    svg.setAttribute("width", "100%");
    svg.setAttribute("height", totalHeight);
    svg.setAttribute("viewBox", `0 0 ${totalWidth} ${totalHeight}`);
    
    reverseLayout(ast, max_level);

    draw(g, ast, drawnElements);
    
    return {svg, drawnElements};
}

/**
 * Calculates the layout positions (y-coordinate) for each node in the AST.
 *
 * @param {object} node The current node in the AST.
 * @param {number} level The depth level of the current node.
 */
function layout(node, level) {
    if (!node) return;
    
    node.level = level;
    if(level > max_level) max_level = level;

    if (node.type === 'variable') {
        node.y = y_pos;
        y_pos += GATE_HEIGHT + SIBLING_SEPARATION;
        return;
    }
    
    layout(node.left, level + 1);
    if (node.right) {
        layout(node.right, level + 1);
        node.y = (node.left.y + node.right.y) / 2;
    } else { // NOT gate
        node.y = node.left.y;
    }
}

/**
 * Calculates the reverse layout positions (x-coordinate) for each node in the AST.
 *
 * @param {object} node The current node in the AST.
 * @param {number} max_level The maximum depth of the AST.
 */
function reverseLayout(node, max_level) {
    if (!node) return;
    node.x = (max_level - node.level) * LEVEL_SEPARATION + PADDING;
    reverseLayout(node.left, max_level);
    reverseLayout(node.right, max_level);
}


/**
 * Recursively draws the nodes and connections of the AST onto the SVG group element.
 *
 * @param {SVGElement} g The SVG group element to draw on.
 * @param {object} node The current node in the AST.
 * @param {object} drawnElements A map to store the drawn SVG elements.
 */
function draw(g, node, drawnElements) {
    if (!node) return;

    createGate(g, node, drawnElements);

    if (node.left) {
        connect(g, node, node.left, node.right ? -1 : 0, drawnElements);
        draw(g, node.left, drawnElements);
    }
    if (node.right) {
        connect(g, node, node.right, 1, drawnElements);
        draw(g, node.right, drawnElements);
    }
}

/**
 * Creates an SVG group element representing a logic gate or a variable.
 *
 * @param {SVGElement} g The parent SVG group element.
 * @param {object} node The AST node to create the gate for.
 * @param {object} drawnElements A map to store the drawn SVG elements.
 */
function createGate(g, node, drawnElements) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.id = node.id;
    
    const isNot = node.op === '!';
    const width = isNot ? NOT_GATE_SIZE : GATE_WIDTH;
    const height = isNot ? NOT_GATE_SIZE : GATE_HEIGHT;

    if (node.type === 'variable') {
        group.setAttribute("transform", `translate(${node.x}, ${node.y - height / 2})`);
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", 0);
        text.setAttribute("y", height / 2);
        text.setAttribute("text-anchor", "start");
        text.setAttribute("dominant-baseline", "central");
        text.setAttribute("font-size", "20");
        text.textContent = node.name;
        group.appendChild(text);
    } else {
        group.setAttribute("transform", `translate(${node.x}, ${node.y - height / 2})`);
        
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("width", width);
        rect.setAttribute("height", height);
        rect.setAttribute("fill", "white");
        rect.setAttribute("stroke", "black");
        rect.setAttribute("stroke-width", "2");
        group.appendChild(rect);
        
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", width / 2);
        text.setAttribute("y", height / 2);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "central");
        text.setAttribute("font-size", "20");
        
        if (isNot) {
            text.textContent = "1";
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", width + 5);
            circle.setAttribute("cy", height / 2);
            circle.setAttribute("r", 5);
            circle.setAttribute("fill", "white");
            circle.setAttribute("stroke", "black");
            circle.setAttribute("stroke-width", "2");
            group.appendChild(circle);
        } else if (node.op === '&') {
            text.textContent = "&";
        } else if (node.op === '|') {
            text.textContent = "≥1";
        }
        group.appendChild(text);
    }
    g.appendChild(group);
    drawnElements[node.id] = group;
}

/**
 * Creates an SVG path element to connect two nodes in the diagram.
 *
 * @param {SVGElement} g The parent SVG group element.
 * @param {object} fromNode The node where the connection starts.
 * @param {object} toNode The node where the connection ends.
 * @param {number} side The side of the fromNode to connect from (-1 for left, 1 for right, 0 for center).
 * @param {object} drawnElements A map to store the drawn SVG elements.
 */
function connect(g, fromNode, toNode, side, drawnElements) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const connectionId = `conn-${fromNode.id}-to-${toNode.id}`;
    path.id = connectionId;

    let toX, toY;
    toY = toNode.y;
    if (toNode.type === 'variable') {
        toX = toNode.x + 15; // Add offset to avoid drawing line over the text
    } else {
        const isNot = toNode.op === '!';
        const width = isNot ? NOT_GATE_SIZE : GATE_WIDTH;
        toX = toNode.x + width;
        if (isNot) {
            toX += 10;
        }
    }

    const fromX = fromNode.x;
    const fromHeight = fromNode.op === '!' ? NOT_GATE_SIZE : GATE_HEIGHT;
    let fromY = fromNode.y;
    if (side === -1) {
        fromY -= fromHeight / 4;
    } else if (side === 1) {
        fromY += fromHeight / 4;
    }
    
    const midX = fromX - 40;
    
    path.setAttribute("d", `M ${fromX},${fromY} H ${midX} V ${toY} H ${toX}`);

    path.setAttribute("stroke", "black");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    g.insertBefore(path, g.firstChild);
    drawnElements[connectionId] = path;
}

/**
 * Highlights elements in the logic gate diagram based on active minterm paths.
 * It evaluates the logic state of each node (gate/variable) and connection
 * based on the provided minterm paths and applies highlighting accordingly.
 *
 * @param {string[]} activeMintermPaths An array of minterm bit strings that are currently active.
 * @param {boolean} isOn True to apply the highlight, false to remove it and reset to default.
 */
export function highlightLogicGateElements(activeMintermPaths, isOn) {
    const { drawnElements, ast } = LOGIC_GATE_STATE;
    const highlightColor = '#F57C00';
    const offColor = '#AAAAAA';
    const defaultColor = 'black';

    if (Object.keys(drawnElements).length === 0 || !ast) {
        return;
    }

    // Reset all elements to default state first
    for (const id in drawnElements) {
        const element = drawnElements[id];
        if (element.tagName === 'g') { // It's a gate or variable
            const shapes = element.querySelectorAll('rect, circle');
            const text = element.querySelector('text');
            shapes.forEach(shape => {
                shape.setAttribute('stroke', defaultColor);
                shape.setAttribute('stroke-width', '2');
            });
            if (text) {
                text.setAttribute('fill', defaultColor);
            }
        } else if (element.tagName === 'path') { // It's a connection
            element.setAttribute('stroke', defaultColor);
            element.setAttribute('stroke-width', '2');
        }
    }

    if (!isOn || !activeMintermPaths || activeMintermPaths.length === 0) {
        return; // Exit after resetting if highlighting is off
    }

    const variableValues = {};
    const vars = VARIABLE_NAMES.slice(0, logicState.nVars);
    
    // Determine fixed and undecided variables
    vars.forEach((varName, index) => {
        const firstValue = activeMintermPaths[0][index];
        const isConsistent = activeMintermPaths.every(path => path[index] === firstValue);
        variableValues[varName] = isConsistent ? parseInt(firstValue, 10) : null;
    });

    const nodeValues = {};

    function evaluate(node) {
        if (node.id in nodeValues) {
            return nodeValues[node.id];
        }

        let value;
        if (node.type === 'variable') {
            value = variableValues[node.name];
        } else if (node.type === 'operator') {
            const leftVal = evaluate(node.left);
            if (node.op === '!') {
                value = leftVal === null ? null : (leftVal === 1 ? 0 : 1);
            } else {
                const rightVal = evaluate(node.right);
                if (node.op === '&') {
                    if (leftVal === 0 || rightVal === 0) value = 0;
                    else if (leftVal === 1 && rightVal === 1) value = 1;
                    else value = null; // undecided
                } else if (node.op === '|') {
                    if (leftVal === 1 || rightVal === 1) value = 1;
                    else if (leftVal === 0 && rightVal === 0) value = 0;
                    else value = null; // undecided
                }
            }
        }
        nodeValues[node.id] = value;
        return value;
    }

    evaluate(ast);

    // Apply highlighting based on the three states
    const applyStyles = (element, value) => {
        const color = value === 1 ? highlightColor : (value === 0 ? offColor : defaultColor);
        const strokeWidth = value === null ? '2' : '3';
        
        if (element.tagName === 'g') {
            const shapes = element.querySelectorAll('rect, circle');
            const text = element.querySelector('text');
            shapes.forEach(shape => {
                shape.setAttribute('stroke', color);
                shape.setAttribute('stroke-width', strokeWidth);
            });
            if (text) {
                text.setAttribute('fill', color);
            }
        } else if (element.tagName === 'path') {
            element.setAttribute('stroke', color);
            element.setAttribute('stroke-width', strokeWidth);
        }
    };

    // Highlight gates and variables
    for (const id in nodeValues) {
        const value = nodeValues[id];
        const element = drawnElements[id];
        if (element) {
            applyStyles(element, value);
        }
    }

    // Highlight connections
    for (const id in drawnElements) {
        if (id.startsWith('conn-')) {
            const match = id.match(/conn-(.*)-to-(.*)/);
            if (match) {
                const toId = match[2]; // ID of the source node
                const sourceValue = nodeValues[toId];
                const path = drawnElements[id];
                if (path) {
                    applyStyles(path, sourceValue);
                }
            }
        }
    }
}
