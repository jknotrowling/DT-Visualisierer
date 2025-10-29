import {
  shannonExpansion,
} from "../logic/bool.js";

import { debounce } from "../utils/utils.js";

import { handleExpansionSpanHover } from "./hover.js";
import { generateExpansionHtmlRecursive } from "./expansion.js";

import { logicState, expansionState, VARIABLE_NAMES, DEFAULT_LAYOUT_CONFIG } from "../state.js";
import { $ } from "../utils/utils.js";



/**
 * Default configuration for drawing a single MUX.
 * @type {{width: number, outputHeight: number, inputHeight: number, varFontSize: number, labelFontSize: number, strokeColor: string, fillColor: string, labelOffset: number}}
 */
export const DEFAULT_MUX_CONFIG = {
  width: 20,
  outputHeight: 65 * (1 / 2),
  inputHeight: 65,
  varFontSize: 14,
  labelFontSize: 10,
  strokeColor: "#333",
  fillColor: "#f0f0f0",
  labelOffset: 5,
};

/**
 * Global state management for the MUX diagram.
 * @type {{currentMuxDrawnElements: object, currentExpansionOrderForMuxHighlight: Array<string>, currentMuxElementsStore: object|null, currentActiveMuxConfig: object, muxSvgElement: SVGElement|null}}
 */
export const MUX_DIAGRAM_STATE = {
  currentMuxDrawnElements: {},
  currentExpansionOrderForMuxHighlight: [],
  currentMuxElementsStore: null,
  currentActiveMuxConfig: { ...DEFAULT_MUX_CONFIG },
  muxSvgElement: null,
};

/**
 * Selects and sets the main SVG element for the MUX diagram from the DOM.
 */
export function setSvgMux() {
  MUX_DIAGRAM_STATE.muxSvgElement = document.querySelector(
    "#muxCard .card-body #muxDiagramSvg"
  );
}

/**
 * Highlights or de-highlights paths in the MUX diagram based on active minterms.
 * @param {Array<string>} activeMintermPaths - An array of minterm path strings (e.g., "010") to highlight.
 * @param {boolean} isOn - Whether to turn the highlight on or off.
 * @param {object} elementsStore - The store of all logical elements (muxes, constants, connections).
 * @param {object} drawnElements - A map of drawn SVG elements, keyed by their logical ID.
 * @param {Array<string>} expansionOrder - The current variable expansion order.
 * @param {object} baseSvgConfig - The base SVG configuration containing default styles.
 */
export function highlightMuxElements(activeMintermPaths, isOn, elementsStore, drawnElements, expansionOrder, baseSvgConfig) {
    if (!drawnElements || Object.keys(drawnElements).length === 0 || !elementsStore) {
        return;
    }

    const highlightColor = '#F57C00';
    const offColor = '#AAAAAA';
    const defaultColor = baseSvgConfig.strokeColor;
    const defaultStrokeWidth = '1.5';
    const highlightStrokeWidth = '2.5';

    // Helper to reset all elements to their default appearance
    const resetElements = () => {
        // Reset MUX bodies
        elementsStore.muxes.forEach(mux => {
            const muxGroup = drawnElements[mux.id];
            if (!muxGroup) return;
            const polygon = muxGroup.querySelector('polygon');
            const varText = muxGroup.querySelector('.mux-var-text');
            const lineToVar = muxGroup.querySelector('.mux-var-line');
            const inputLabels = muxGroup.querySelectorAll('.mux-input-label');
            const outputLine = muxGroup.querySelector('.mux-output-line');
            const outputF = muxGroup.querySelector('.mux-output-f-text');

            if (polygon) {
                polygon.setAttribute('stroke', defaultColor);
                polygon.setAttribute('stroke-width', defaultStrokeWidth);
            }
            if (varText) varText.setAttribute('fill', defaultColor);
            if (lineToVar) lineToVar.setAttribute('stroke', defaultColor);
            inputLabels.forEach(label => label.setAttribute('fill', defaultColor));
            if (outputLine) outputLine.setAttribute('stroke', defaultColor);
            if (outputF) outputF.setAttribute('fill', defaultColor);
        });

        // Reset constants
        elementsStore.constants.forEach(c => {
            const el = drawnElements[c.id];
            if (el) {
                el.setAttribute('fill', defaultColor);
                el.setAttribute('font-weight', 'normal');
            }
        });

        // Reset connections
        elementsStore.connections.forEach(conn => {
            const lineId = `line_${conn.fromId}_${conn.fromPin}_${conn.toId}`;
            const line = drawnElements[lineId];
            if (line) {
                line.setAttribute('stroke', defaultColor);
                line.setAttribute('stroke-width', '1');
            }
        });
    };

    resetElements();

    if (!isOn || !activeMintermPaths || activeMintermPaths.length === 0) {
        return; // Exit after resetting if highlighting is off
    }

    // --- 3-State Logic Calculation ---
    const controlVarValues = {}; // e.g., { 'A': 1, 'B': 0, 'C': null }
    expansionOrder.forEach(varName => {
        const varIndex = VARIABLE_NAMES.indexOf(varName);
        if (varIndex === -1) {
            controlVarValues[varName] = null;
            return;
        }
        const firstValue = activeMintermPaths[0][varIndex];
        const isConsistent = activeMintermPaths.every(path => path[varIndex] === firstValue);
        controlVarValues[varName] = isConsistent ? parseInt(firstValue, 10) : null;
    });

    const elementOutputValues = {}; // Memoization for element output values

    // Recursive function to calculate the output value of any element (mux or constant)
    const getElementOutput = (elementId) => {
        if (elementOutputValues.hasOwnProperty(elementId)) {
            return elementOutputValues[elementId];
        }

        const constant = elementsStore.constants.find(c => c.id === elementId);
        if (constant) {
            return (elementOutputValues[elementId] = parseInt(constant.value, 10));
        }

        const mux = elementsStore.muxes.find(m => m.id === elementId);
        if (!mux) {
            return (elementOutputValues[elementId] = null); // Should not happen
        }

        const controlValue = controlVarValues[mux.varName];
        let result = null;

        if (controlValue === 1) {
            // Path '1' is chosen
            const conn = elementsStore.connections.find(c => c.fromId === mux.id && c.fromPin === '1');
            result = conn ? getElementOutput(conn.toId) : null;
        } else if (controlValue === 0) {
            // Path '0' is chosen
            const conn = elementsStore.connections.find(c => c.fromId === mux.id && c.fromPin === '0');
            result = conn ? getElementOutput(conn.toId) : null;
        } else {
            // Undetermined control signal
            const conn1 = elementsStore.connections.find(c => c.fromId === mux.id && c.fromPin === '1');
            const conn0 = elementsStore.connections.find(c => c.fromId === mux.id && c.fromPin === '0');
            const output1 = conn1 ? getElementOutput(conn1.toId) : null;
            const output0 = conn0 ? getElementOutput(conn0.toId) : null;

            if (output1 === output0 && output1 !== null) {
                result = output1; // Both paths lead to the same result
            } else {
                result = null; // Paths diverge or are unknown
            }
        }
        return (elementOutputValues[elementId] = result);
    };

    // Calculate the output value for every element, starting from the root MUX
    const rootMux = elementsStore.muxes.find(m => m.depth === 0);
    if (rootMux) {
        getElementOutput(rootMux.id);
    }


    // --- Apply 3-State Styling ---
    const applyStyles = (element, value) => {
        const color = value === 1 ? highlightColor : (value === 0 ? offColor : defaultColor);
        const isUndecided = value === null;

        if (!element) return;
        
        // MUX Group
        if (element.matches('.mux-group')) {
            const polygon = element.querySelector('polygon');
            if (polygon) {
                polygon.setAttribute('stroke', color);
                polygon.setAttribute('stroke-width', isUndecided ? defaultStrokeWidth : highlightStrokeWidth);
            }
            // The variable name and its line are styled based on the *control* signal
            const varName = element.dataset.varName;
            const controlValue = controlVarValues[varName];
            const controlColor = controlValue === 1 ? highlightColor : (controlValue === 0 ? offColor : defaultColor);
            const controlIsUndecided = controlValue === null;

            const varText = element.querySelector('.mux-var-text');
            const lineToVar = element.querySelector('.mux-var-line');
            if (varText) varText.setAttribute('fill', controlColor);
            if (lineToVar) lineToVar.setAttribute('stroke', controlColor);
            
            // Highlight input number labels
            const label1 = element.querySelector('.mux-input-label[data-pin="1"]');
            const label0 = element.querySelector('.mux-input-label[data-pin="0"]');
            if (label1) label1.setAttribute('fill', controlValue === 1 ? highlightColor : (controlValue === null ? defaultColor : offColor));
            if (label0) label0.setAttribute('fill', controlValue === 0 ? highlightColor : (controlValue === null ? defaultColor : offColor));

            // Highlight final output line and 'f' text
            if(element.dataset.depth === "0") {
                const outputLine = element.querySelector('.mux-output-line');
                const outputF = element.querySelector('.mux-output-f-text');
                if (outputLine) outputLine.setAttribute('stroke', color);
                if (outputF) outputF.setAttribute('fill', color);
            }

        } // Connection Line
        else if (element.matches('.connection-line')) {
            element.setAttribute('stroke', color);
            element.setAttribute('stroke-width', isUndecided ? '1' : '2');
        } // Constant Text
        else if (element.matches('.constant-text')) {
            element.setAttribute('fill', color);
            element.setAttribute('font-weight', isUndecided ? 'normal' : 'bold');
        }
    };

    // Apply styles to all elements
    elementsStore.muxes.forEach(mux => {
        const muxGroup = drawnElements[mux.id];
        const outputValue = getElementOutput(mux.id);
        applyStyles(muxGroup, outputValue);
    });

    elementsStore.constants.forEach(c => {
        const constEl = drawnElements[c.id];
        const outputValue = getElementOutput(c.id);
        applyStyles(constEl, outputValue);
    });

    elementsStore.connections.forEach(conn => {
        const lineId = `line_${conn.fromId}_${conn.fromPin}_${conn.toId}`;
        const lineEl = drawnElements[lineId];
        if (!lineEl) return;

        // A connection is always highlighted according to the element to its left (toId),
        // which is its source in the data flow. The MUX body's color is determined
        // by its own output value, which correctly reflects the pass-through logic.
        const value = getElementOutput(conn.toId);
        applyStyles(lineEl, value);
    });
}

/**
 * Creates an SVG group element representing a single multiplexer (MUX).
 * @param {number} cx - The center x-coordinate of the MUX.
 * @param {number} cy - The center y-coordinate of the MUX.
 * @param {string} varName - The name of the control variable for this MUX.
 * @param {object} [config=DEFAULT_MUX_CONFIG] - Configuration for MUX dimensions and styles.
 * @returns {SVGElement} The SVG group element for the MUX.
 */
export function createSvgMuxElement(cx, cy, varName, depth, config = DEFAULT_MUX_CONFIG) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.classList.add('mux-group');
    group.dataset.varName = varName;
    group.dataset.depth = depth;

    const x = cx - config.width / 2;
    const y = cy;

    const p1 = `${x + config.width},${y - config.outputHeight / 2}`; // Top-right
    const p2 = `${x},${y - config.inputHeight / 2}`; // Top-left
    const p3 = `${x},${y + config.inputHeight / 2}`; // Bottom-left
    const p4 = `${x + config.width},${y + config.outputHeight / 2}`; // Bottom-right

    // The final output 'f' is now on the right side of the root MUX
    if (depth === 0) {
        const outputLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        outputLine.classList.add('mux-output-line');
        outputLine.setAttribute("x1", cx + config.width / 2);
        outputLine.setAttribute("y1", cy);
        outputLine.setAttribute("x2", cx + 50);
        outputLine.setAttribute("y2", cy);
        outputLine.setAttribute("stroke", config.strokeColor);
        outputLine.setAttribute("stroke-width", "1");
        group.appendChild(outputLine);

        const outputF = document.createElementNS("http://www.w3.org/2000/svg", "text");
        outputF.classList.add('mux-output-f-text');
        outputF.setAttribute("x", cx + 55);
        outputF.setAttribute("y", cy);
        outputF.setAttribute("font-family", "system-ui, sans-serif");
        outputF.setAttribute("font-size", config.varFontSize);
        outputF.setAttribute("text-anchor", "start");
        outputF.setAttribute("dominant-baseline", "middle");
        outputF.textContent = "f";
        group.appendChild(outputF);
    }

    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", `${p1} ${p2} ${p3} ${p4}`);
    polygon.setAttribute("fill", config.fillColor);
    polygon.setAttribute("stroke", config.strokeColor);
    polygon.setAttribute("stroke-width", "1.5");
    group.appendChild(polygon);

    const varText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    varText.classList.add('mux-var-text');
    varText.setAttribute("x", cx);
    varText.setAttribute("y", cy + 50);
    varText.setAttribute("font-family", "system-ui, sans-serif");
    varText.setAttribute("font-size", config.varFontSize);
    varText.setAttribute("text-anchor", "middle");
    varText.setAttribute("dominant-baseline", "middle");
    varText.textContent = varName;
    group.appendChild(varText);

    // Line from polygon center to variable text
    const lineToVar = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lineToVar.classList.add('mux-var-line');
    lineToVar.setAttribute("x1", cx);
    lineToVar.setAttribute("y1", cy + config.inputHeight / 2 - 5);
    lineToVar.setAttribute("x2", cx);
    lineToVar.setAttribute("y2", cy + 40);
    lineToVar.setAttribute("stroke", config.strokeColor);
    lineToVar.setAttribute("stroke-width", "1");
    group.appendChild(lineToVar);

    // Input labels '1' and '0'
    const label1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label1.classList.add('mux-input-label');
    label1.dataset.pin = "1";
    label1.setAttribute("x", x + config.labelOffset);
    label1.setAttribute("y", y - config.inputHeight / 4);
    label1.setAttribute("font-family", "system-ui, sans-serif");
    label1.setAttribute("font-size", config.labelFontSize);
    label1.setAttribute("text-anchor", "start");
    label1.setAttribute("dominant-baseline", "middle");
    label1.textContent = "1";
    group.appendChild(label1);

    const label0 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label0.classList.add('mux-input-label');
    label0.dataset.pin = "0";
    label0.setAttribute("x", x + config.labelOffset);
    label0.setAttribute("y", y + config.inputHeight / 4);
    label0.setAttribute("font-family", "system-ui, sans-serif");
    label0.setAttribute("font-size", config.labelFontSize);
    label0.setAttribute("text-anchor", "start");
    label0.setAttribute("dominant-baseline", "middle");
    label0.textContent = "0";
    group.appendChild(label0);

    // Connection points data
    group.dataset.connOutX = config.width / 2;
    group.dataset.connOutY = 0;
    group.dataset.connIn1X = -config.width / 2;
    group.dataset.connIn1Y = -config.inputHeight / 4;
    group.dataset.connIn0X = -config.width / 2;
    group.dataset.connIn0Y = config.inputHeight / 4;

    return group;
}

/**
 * Generates a unique ID for a MUX element.
 * @param {object} _idCounter - An object with a `next` property to be incremented.
 * @returns {string} A unique ID string.
 */
export function getNextMuxId(_idCounter) {
  return `el_mux_${_idCounter.next++}`;
}

/**
 * Recursively traverses the Shannon expansion tree to generate a logical structure of the MUX diagram.
 * @param {object} node - The current node in the expansion tree.
 * @param {number} depth - The current depth in the tree.
 * @param {object} _elementsStore - The object to store generated muxes, constants, and connections.
 * @param {object} _idCounter - The counter for generating unique IDs.
 * @param {Array<number>} _yOrderCounters - An array to track the vertical order of elements at each depth.
 * @returns {{id: string, type: string}} Information about the created element (ID and type).
 */
export function generateMuxStructureRecursive(
  node,
  depth,
  _elementsStore,
  _idCounter,
  _yOrderCounters
) {
  const currentId = getNextMuxId(_idCounter);

  if (typeof _yOrderCounters[depth] === "undefined") {
    _yOrderCounters[depth] = 0;
  }
  const yOrder = _yOrderCounters[depth];
  _yOrderCounters[depth]++;

  if (node.type === "constant") {
    _elementsStore.constants.push({
      id: currentId,
      value: node.value,
      depth: depth,
      yOrderAtDepth: yOrder,
      minterms: node.minterms,
      path: node.path,
    });
    return { id: currentId, type: "constant" };
  }

  _elementsStore.muxes.push({
    id: currentId,
    varName: node.variable,
    depth: depth,
    varIndexOriginal: node.varIndex,
    yOrderAtDepth: yOrder,
    minterms: node.minterms,
  });

  const positiveChildInfo = generateMuxStructureRecursive(
    node.positiveBranch,
    depth + 1,
    _elementsStore,
    _idCounter,
    _yOrderCounters
  );
  _elementsStore.connections.push({
    fromId: currentId,
    fromPin: "1",
    toId: positiveChildInfo.id,
    toType: positiveChildInfo.type,
  });

  const negativeChildInfo = generateMuxStructureRecursive(
    node.negativeBranch,
    depth + 1,
    _elementsStore,
    _idCounter,
    _yOrderCounters
  );
  _elementsStore.connections.push({
    fromId: currentId,
    fromPin: "0",
    toId: negativeChildInfo.id,
    toType: negativeChildInfo.type,
  });

  return { id: currentId, type: "mux" };
}

/**
 * Initializes the process of generating the MUX diagram's logical structure from a root expansion node.
 * @param {object} rootNode - The root node of the Shannon expansion tree.
 * @returns {object} The complete logical structure of the diagram (muxes, constants, connections).
 */
export function generateMuxDiagramStructure(rootNode) {
  const elementsStore = { muxes: [], constants: [], connections: [] };
  const idCounter = { next: 0 };
  const yOrderCounters = [];

  generateMuxStructureRecursive(
    rootNode,
    0,
    elementsStore,
    idCounter,
    yOrderCounters
  );
  return elementsStore;
}

/**
 * Calculates the x and y coordinates for each element in the MUX diagram.
 * @param {object} elementsStore - The logical structure of the diagram.
 * @param {object} [layoutConfig=DEFAULT_LAYOUT_CONFIG] - Configuration for overall layout (padding, spacing).
 * @param {object} [muxDisplayConfig=DEFAULT_MUX_CONFIG] - Configuration for MUX element display.
 * @returns {object} A map of element coordinates, keyed by element ID.
 */
export function calculateMuxLayout(
  elementsStore,
  layoutConfig = DEFAULT_LAYOUT_CONFIG,
  muxDisplayConfig = DEFAULT_MUX_CONFIG
) {
  const elementCoords = {}; // Stores { x, y, type, element } for each elementId
  const elementsByDepth = {};

  const muxCardBody = document.querySelector("#muxCard .card-body");
  // Usable height between top and bottom paddings
  const svgUsableHeight =
    muxCardBody && muxCardBody.offsetHeight > 100
      ? muxCardBody.offsetHeight - 2 * layoutConfig.paddingY
      : 400 - 2 * layoutConfig.paddingY;
  const elementRenderHeight = muxDisplayConfig.inputHeight;

  const allElements = [
    ...(elementsStore.muxes || []),
    ...(elementsStore.constants || []),
  ];

  let maxDepth = 0;
  allElements.forEach((element) => {
    if (!elementsByDepth[element.depth]) {
      elementsByDepth[element.depth] = [];
    }
    elementsByDepth[element.depth].push(element);
    if (element.depth > maxDepth) {
      maxDepth = element.depth;
    }
  });

  // Calculate positions for MUX columns first (all columns except the last one if it's constants)
  Object.keys(elementsByDepth).forEach((depthKey) => {
    const depth = parseInt(depthKey, 10);
    if (
      depth === maxDepth &&
      elementsByDepth[depthKey].every((el) =>
        elementsStore.constants.find((c) => c.id === el.id)
      )
    ) {
      // Skip explicit layout for the last column if it's all constants; will be handled later
      return;
    }

    const elementsInColumn = elementsByDepth[depth];
    elementsInColumn.sort((a, b) => a.yOrderAtDepth - b.yOrderAtDepth);

    const numElements = elementsInColumn.length;
    if (numElements === 0) return;

    // Centering logic for MUX columns
    const totalContentHeight =
      numElements * elementRenderHeight +
      Math.max(0, numElements - 1) * layoutConfig.spacingY;
    const columnBlockStartY = Math.max(
      0,
      (svgUsableHeight - totalContentHeight) / 2
    );

    elementsInColumn.forEach((element, index) => {
      const x =
        layoutConfig.paddingX +
        (maxDepth - element.depth) *
          (muxDisplayConfig.width + layoutConfig.spacingX);
      const y =
        layoutConfig.paddingY +
        columnBlockStartY +
        index * (elementRenderHeight + layoutConfig.spacingY) +
        elementRenderHeight / 2;
      elementCoords[element.id] = { x, y, type: "mux", element: element }; // Assume MUX here, constants handled separately
    });
  });

  // Now, position constants in the last column based on their connected MUX pins
  if (elementsByDepth[maxDepth] && elementsStore.constants.length > 0) {
    const lastColumnElements = elementsByDepth[maxDepth];
    lastColumnElements.forEach((constantElement) => {
      // Find the connection TO this constant
      const connectionToConstant = elementsStore.connections.find(
        (conn) => conn.toId === constantElement.id
      );
      if (connectionToConstant) {
        const sourceMuxId = connectionToConstant.fromId;
        const sourceMuxCoords = elementCoords[sourceMuxId]; // Get already calculated coords of the source MUX

        if (sourceMuxCoords) {
          const x =
            layoutConfig.paddingX +
            (maxDepth - constantElement.depth) *
              (muxDisplayConfig.width + layoutConfig.spacingX);
          // Calculate y based on the source MUX's pin
          // connIn1Y is for pin '1' (top input), connIn0Y is for pin '0' (bottom input)
          // These are relative to the MUX center (y-coordinate)
          const pinOffsetY =
            connectionToConstant.fromPin === "1"
              ? -muxDisplayConfig.inputHeight / 4
              : muxDisplayConfig.inputHeight / 4;
          const y = sourceMuxCoords.y + pinOffsetY;

          elementCoords[constantElement.id] = {
            x,
            y,
            type: "constant",
            element: constantElement,
          };
        } else {
          // Fallback for safety, though sourceMuxCoords should always exist if structure is valid
          const x =
            layoutConfig.paddingX +
            (maxDepth - constantElement.depth) *
              (muxDisplayConfig.width + layoutConfig.spacingX);
          const y = layoutConfig.paddingY + svgUsableHeight / 2; // Default to center if source MUX not found
          elementCoords[constantElement.id] = {
            x,
            y,
            type: "constant",
            element: constantElement,
          };
          console.warn(
            `Source MUX ${sourceMuxId} for constant ${constantElement.id} not found in elementCoords.`
          );
        }
      } else {
        // Fallback for constants not connected (should not happen in a valid MUX tree)
        const x =
          layoutConfig.paddingX +
          (maxDepth - constantElement.depth) *
            (muxDisplayConfig.width + layoutConfig.spacingX);
        const y = layoutConfig.paddingY + svgUsableHeight / 2; // Default to center
        elementCoords[constantElement.id] = {
          x,
          y,
          type: "constant",
          element: constantElement,
        };
        console.warn(
          `Constant ${constantElement.id} has no incoming connection.`
        );
      }
    });
  }
  return elementCoords;
}

/**
 * Renders the entire MUX diagram as SVG elements in the DOM.
 * @param {object} elementsStore - The logical structure of the diagram.
 * @param {object} elementCoords - The calculated coordinates for each element.
 * @param {object} [muxConfig=DEFAULT_MUX_CONFIG] - Configuration for MUX element display.
 * @returns {object} A map of the drawn SVG elements, keyed by their logical ID.
 */
export function renderMuxDiagram(
  elementsStore,
  elementCoords,
  muxConfig = DEFAULT_MUX_CONFIG
) {
  // Use the SVG element from the state object
  const muxSvgElement = MUX_DIAGRAM_STATE.muxSvgElement;
  if (!muxSvgElement) {
    console.error(`SVG element for MUX diagram not found.`);
    return {};
  }
  muxSvgElement.innerHTML = "";

  const drawnElements = {};

  // Ensure muxSvgElement has a minimum height if its parent card-body is very small
  // This is more of a safeguard for viewBox calculation.
  const muxCardBody = document.querySelector("#muxCard .card-body");
  if (muxCardBody && muxCardBody.offsetHeight < 150) {
    muxSvgElement.style.minHeight = "150px";
  } else if (muxSvgElement.style.minHeight) {
    muxSvgElement.style.minHeight = ""; // Reset if card body is larger
  }

  elementsStore.muxes.forEach((muxData) => {
    const coords = elementCoords[muxData.id];
    if (!coords) return;
    const muxGroup = createSvgMuxElement(
      coords.x,
      coords.y,
      muxData.varName,
      muxData.depth,
      muxConfig
    );
    muxGroup.id = muxData.id;
    muxSvgElement.appendChild(muxGroup);
    drawnElements[muxData.id] = muxGroup;
  });

  elementsStore.constants.forEach((constantData) => {
    const coords = elementCoords[constantData.id];
    if (!coords) return;
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("id", constantData.id);
    text.classList.add('constant-text'); // Add class for highlighting
    text.setAttribute("x", coords.x);
    text.setAttribute("y", coords.y);
    text.setAttribute("font-family", "system-ui, sans-serif");
    text.setAttribute("font-size", muxConfig.varFontSize);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.textContent = constantData.value;
    muxSvgElement.appendChild(text);
    drawnElements[constantData.id] = text;
  });

  elementsStore.connections.forEach((connData) => {
    const fromCoords = elementCoords[connData.fromId];
    const toCoords = elementCoords[connData.toId];
    const fromElementGroup = drawnElements[connData.fromId];

    if (!fromCoords || !toCoords || !fromElementGroup) return;

    let startX, startY, endX, endY;
    startX =
      fromCoords.x +
      parseFloat(
        fromElementGroup.dataset[
          connData.fromPin === "1" ? "connIn1X" : "connIn0X"
        ]
      );
    startY =
      fromCoords.y +
      parseFloat(
        fromElementGroup.dataset[
          connData.fromPin === "1" ? "connIn1Y" : "connIn0Y"
        ]
      );

    if (connData.toType === "mux") {
      const toElementGroup = drawnElements[connData.toId];
      if (!toElementGroup) return;
      endX = toCoords.x + parseFloat(toElementGroup.dataset.connOutX);
      endY = toCoords.y + parseFloat(toElementGroup.dataset.connOutY);
    } else {
      // Constant is a terminal. Line comes from the right. Stop the line just before the text center to avoid overlap.
      endX = toCoords.x + 5;
      endY = toCoords.y;
    }

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.classList.add('connection-line'); // Add class for highlighting
    line.setAttribute("x1", startX);
    line.setAttribute("y1", startY);
    line.setAttribute("x2", endX);
    line.setAttribute("y2", endY);
    line.setAttribute("stroke", muxConfig.strokeColor);
    line.setAttribute("stroke-width", "1");

    const lineId = `line_${connData.fromId}_${connData.fromPin}_${connData.toId}`;
    line.setAttribute("id", lineId);
    drawnElements[lineId] = line;
    muxSvgElement.appendChild(line);
  });

  try {
    const bbox = muxSvgElement.getBBox();
    if (bbox.width > 0 && bbox.height > 0) {
      const padding = 20; // ViewBox padding
      // Set viewBox to encompass the bounding box with padding
      muxSvgElement.setAttribute(
        "viewBox",
        `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + 2 * padding} ${
          bbox.height + 2 * padding
        }`
      );
      // Remove explicit width attribute to let SVG scale, height is set in HTML/CSS.
      muxSvgElement.removeAttribute("width");
    } else {
      // Fallback if bbox is not valid, ensure SVG is at least somewhat visible
      // This might happen if there are no elements, or SVG not in DOM correctly during calc
      const cardBody = muxSvgElement.closest(".card-body");
      const fallbackWidth = cardBody ? cardBody.offsetWidth : 300;
      // Keep height from HTML attribute if bbox fails
      muxSvgElement.setAttribute("viewBox", `0 0 ${fallbackWidth} 400`);
      if (fallbackWidth !== 300) muxSvgElement.removeAttribute("width");
    }
  } catch (e) {
    console.warn(
      "Could not calculate SVG BBox for viewBox adjustment. Using fallback.",
      e
    );
    const cardBody = muxSvgElement.closest(".card-body");
    const fallbackWidth = cardBody ? cardBody.offsetWidth : 300;
    muxSvgElement.setAttribute("viewBox", `0 0 ${fallbackWidth} 400`);
    if (fallbackWidth !== 300) muxSvgElement.removeAttribute("width");
  }
  return drawnElements;
}





/**
 * Main rendering function for the developer/debug view, including the Shannon expansion and MUX diagram.
 * It reads the desired expansion order, generates the expansion tree, renders the HTML representation,
 * and then generates and renders the corresponding MUX diagram.
 */
export function renderDev() {
  // based on expansionOrderInputEl


  expansionState.spanIdCounter = 0;
  expansionState.groupIdCounter = 0;
  for (const key in expansionState.spanData)
    delete expansionState.spanData[key];

  const orderInputEl = $("expansionOrderInput");
  let customOrderNames = [];
  const defaultOrderUpper = VARIABLE_NAMES.slice(0, logicState.nVars);
  const defaultOrderLowerStr = defaultOrderUpper.join("").toLowerCase();

  if (orderInputEl) {
    const inputValue = orderInputEl.value.trim();
    if (inputValue !== "") {
      const inputPartsUpper = inputValue.toUpperCase().split("");
      if (
        inputPartsUpper.length === logicState.nVars &&
        inputPartsUpper.every((part) => defaultOrderUpper.includes(part)) &&
        new Set(inputPartsUpper).size === inputPartsUpper.length
      ) {
        customOrderNames = inputPartsUpper;
      } else {
        customOrderNames = defaultOrderUpper;
        orderInputEl.value = defaultOrderLowerStr;
        console.warn(
          "Invalid expansion order input. Using default order:",
          defaultOrderUpper.join(", ")
        );
      }
    } else {
      customOrderNames = defaultOrderUpper;
      if (orderInputEl.value !== defaultOrderLowerStr) {
        orderInputEl.value = defaultOrderLowerStr;
      }
    }
  } else {
    customOrderNames = defaultOrderUpper;
  }

  console.log(customOrderNames)
  const rootExpansionNode = shannonExpansion(
    "".padStart(logicState.nVars, "0"),
    0,
    customOrderNames
  );

  let singleInstanceHtml = `<pre data-style-type="color">`;
  singleInstanceHtml += generateExpansionHtmlRecursive(rootExpansionNode, []);
  singleInstanceHtml += `</pre>`;

  const devWrap = document.querySelector("#booleanDevCard .card-body #devWrap");
  if (devWrap) devWrap.innerHTML = singleInstanceHtml;

  // Clean up old event listeners before adding new ones
  document.querySelectorAll("[data-span-id]").forEach((el) => {
    el.onmouseenter = null;
    el.onmouseleave = null;
  });

  for (const spanId in expansionState.spanData) {
    const spanElement = document.getElementById(spanId); // getElementById is fine as IDs are unique
    if (spanElement) {
      const highlightClass = "hl-color";
      spanElement.onmouseenter = () =>
        handleExpansionSpanHover(spanElement, true, highlightClass);
      spanElement.onmouseleave = () =>
        handleExpansionSpanHover(spanElement, false, highlightClass);
    }
  }

  //muxSvgElement = document.querySelector("#muxCard .card-body #muxDiagramSvg"); // Initialize global reference
  setSvgMux();

  let activeMuxConfig = JSON.parse(JSON.stringify(DEFAULT_MUX_CONFIG));
  let activeLayoutConfig = JSON.parse(JSON.stringify(DEFAULT_LAYOUT_CONFIG));

  // if (logicState.nVars === 4) {
  //   activeMuxConfig.inputHeight = 30;
  //   activeMuxConfig.outputHeight = 15;
  //   activeMuxConfig.width = 55;
  //   activeMuxConfig.varFontSize = 12;
  //   activeMuxConfig.labelFontSize = 9;
  //   activeLayoutConfig.spacingY = 20;
  //   activeLayoutConfig.spacingX = 65;
  // }
  MUX_DIAGRAM_STATE.currentActiveMuxConfig = activeMuxConfig;

  if (rootExpansionNode && MUX_DIAGRAM_STATE.muxSvgElement) {
    try {
      const elementsStore = generateMuxDiagramStructure(rootExpansionNode);
      MUX_DIAGRAM_STATE.currentMuxElementsStore = elementsStore;

      const elementCoords = calculateMuxLayout(
        elementsStore,
        activeLayoutConfig,
        activeMuxConfig
      );
      MUX_DIAGRAM_STATE.currentMuxDrawnElements = renderMuxDiagram(
        elementsStore,
        elementCoords,
        activeMuxConfig
      );
      MUX_DIAGRAM_STATE.currentExpansionOrderForMuxHighlight = [
        ...customOrderNames,
      ];
    } catch (error) {
      console.error("Error rendering MUX diagram:", error);
      MUX_DIAGRAM_STATE.currentMuxDrawnElements = {};
      MUX_DIAGRAM_STATE.currentExpansionOrderForMuxHighlight = [];
      MUX_DIAGRAM_STATE.currentMuxElementsStore = null;
      if (MUX_DIAGRAM_STATE.muxSvgElement)
        MUX_DIAGRAM_STATE.muxSvgElement.innerHTML =
          '<text x="10" y="20" fill="red">Error generating MUX diagram.</text>';
    }
  } else {
    MUX_DIAGRAM_STATE.currentMuxDrawnElements = {};
    MUX_DIAGRAM_STATE.currentExpansionOrderForMuxHighlight = [];
    MUX_DIAGRAM_STATE.currentMuxElementsStore = null;
    if (MUX_DIAGRAM_STATE.muxSvgElement)
      MUX_DIAGRAM_STATE.muxSvgElement.innerHTML = "";
  }
}

/**
 * Sets up event listeners and observers for the MUX diagram to handle user interactions and resizing.
 * This function is the entry point for making the MUX diagram interactive.
 */
export function renderMUX() {
    const expansionOrderInputEl = $("expansionOrderInput");
    console.log("Rendering MUX diagram with current state...", !!expansionOrderInputEl);
  if (expansionOrderInputEl) {
    expansionOrderInputEl.onchange = () => {
      expansionState.order = expansionOrderInputEl.value.trim().toLowerCase();
      console.log("Expansion order input changed, re-rendering MUX diagram...");
      renderDev(); // This will also re-render MUX

    };
  }

  // --- Debounced MUX rendering and height adjustment ---
  // Define these early in init() so they are in scope for all subsequent uses.
  const debouncedMuxRender = debounce(() => {
    if (MUX_DIAGRAM_STATE.currentMuxElementsStore) {
      console.log("Debounced MUX render triggered (e.g., by resize or toggle)");
      renderDev(); // renderDev will handle the MUX diagram update
    }
  }, 250);

  // Resize observer for MUX diagram, debounced for performance
  const muxCardBodyForObserver = document.querySelector("#muxCard .card-body");
  if (muxCardBodyForObserver && MUX_DIAGRAM_STATE.muxSvgElement) {
    const resizeObserver = new ResizeObserver((entries) => {
      debouncedMuxRender();
    });
    resizeObserver.observe(muxCardBodyForObserver);
  }
}