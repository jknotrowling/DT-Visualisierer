    
import { logicState, DEFAULT_LAYOUT_CONFIG } from "./index.js"; // Import logicState from index.js


    // Store the SVG element reference



export const DEFAULT_MUX_CONFIG = {
  width: 60,
  outputHeight: 20,
  inputHeight: 40,
  varFontSize: 14,
  labelFontSize: 10,
  strokeColor: "#333",
  fillColor: "#f0f0f0",
  labelOffset: 5,
};



export const MUX_DIAGRAM_STATE = {
  currentMuxDrawnElements: {},
  currentExpansionOrderForMuxHighlight: [],
  currentMuxElementsStore: null,
  currentActiveMuxConfig: { ...DEFAULT_MUX_CONFIG },
  muxSvgElement: null,
}

export function setSvgMux() {
   MUX_DIAGRAM_STATE.muxSvgElement = document.querySelector("#muxCard .card-body #muxDiagramSvg");
}

export function highlightMuxElements(activeMintermPaths, isOn, elementsStore, drawnElements, expansionOrder, baseSvgConfig) {
if (!drawnElements || Object.keys(drawnElements).length === 0) {
return;
}

const highlightColor = "#F57C00"; 
const defaultMuxStrokeColor = baseSvgConfig.strokeColor;
const defaultMuxStrokeWidth = '1.5';
const highlightedMuxStrokeWidth = '2.5';
const defaultLineStrokeColor = baseSvgConfig.strokeColor;
const defaultLineStrokeWidth = '1';
const highlightedLineStrokeWidth = '2';
const defaultConstantColor = baseSvgConfig.strokeColor; 
const L_VARS = ['A', 'B', 'C', 'D']; 

elementsStore.muxes.forEach(mux => {
const muxSvgGroup = drawnElements[mux.id];
if (muxSvgGroup && muxSvgGroup.querySelector('polygon')) {
    muxSvgGroup.querySelector('polygon').setAttribute('stroke', defaultMuxStrokeColor);
    muxSvgGroup.querySelector('polygon').setAttribute('stroke-width', defaultMuxStrokeWidth);
}
});
elementsStore.constants.forEach(constant => {
const constSvgText = drawnElements[constant.id];
if (constSvgText) {
    constSvgText.setAttribute('fill', defaultConstantColor);
    constSvgText.setAttribute('font-weight', 'normal');
}
});
elementsStore.connections.forEach(connection => {
const lineId = `line_${connection.fromId}_${connection.fromPin}_${connection.toId}`;
const lineSvg = drawnElements[lineId];
if (lineSvg) {
    lineSvg.setAttribute('stroke', defaultLineStrokeColor);
    lineSvg.setAttribute('stroke-width', defaultLineStrokeWidth);
}
});

if (!isOn || !activeMintermPaths || activeMintermPaths.length === 0) {
return;
}

activeMintermPaths.forEach(mintermPathStr => {
if (mintermPathStr.length !== logicState.nVars) { 
    console.warn(`Minterm path ${mintermPathStr} length does not match nVars ${logicState.nVars}. Skipping.`);
    return; 
}

let currentLogicalElementId = null;
const rootMuxVar = expansionOrder[0];
const rootMux = elementsStore.muxes.find(m => m.depth === 0 && m.varName === rootMuxVar);

if (!rootMux) {
    console.warn(`Root MUX for var ${rootMuxVar} not found. Skipping path ${mintermPathStr}.`);
    return; 
}
currentLogicalElementId = rootMux.id;

for (let depth = 0; depth < expansionOrder.length; depth++) {
    if (!currentLogicalElementId) break;

    const currentLogicalMux = elementsStore.muxes.find(m => m.id === currentLogicalElementId);
    if (!currentLogicalMux) { 
        const constItem = elementsStore.constants.find(c => c.id === currentLogicalElementId);
            if (constItem) { 
            if(depth === expansionOrder.length) { 
                const constSvg = drawnElements[constItem.id];
                if (constSvg) {
                    constSvg.setAttribute('fill', highlightColor);
                    constSvg.setAttribute('font-weight', 'bold');
                }
            }
            }
            break; 
    }
    
    const muxSvgGroup = drawnElements[currentLogicalMux.id];
    if (muxSvgGroup && muxSvgGroup.querySelector('polygon')) {
        muxSvgGroup.querySelector('polygon').setAttribute('stroke', highlightColor);
        muxSvgGroup.querySelector('polygon').setAttribute('stroke-width', highlightedMuxStrokeWidth);
    }

    if (depth === expansionOrder.length - 1) { // Last MUX in this path, leads to a constant
        const varNameForThisDepth = expansionOrder[depth]; 
        const originalVarLIndex = L_VARS.indexOf(varNameForThisDepth);
            if (originalVarLIndex === -1) {
            console.warn(`Variable ${varNameForThisDepth} not found in L_VARS during final step. Path tracing aborted.`);
            break; 
        }
        const pinToFollowToConstant = mintermPathStr[originalVarLIndex];
        
        const finalConn = elementsStore.connections.find(c => c.fromId === currentLogicalMux.id && c.fromPin === pinToFollowToConstant);
        if (finalConn) {
            const finalLineId = `line_${finalConn.fromId}_${finalConn.fromPin}_${finalConn.toId}`;
            const finalLineSvg = drawnElements[finalLineId];
            if (finalLineSvg) {
                finalLineSvg.setAttribute('stroke', highlightColor);
                finalLineSvg.setAttribute('stroke-width', highlightedLineStrokeWidth);
            }
            
            const constSvg = drawnElements[finalConn.toId]; 
            if (constSvg && elementsStore.constants.find(c => c.id === finalConn.toId)) {
                constSvg.setAttribute('fill', highlightColor);
                constSvg.setAttribute('font-weight', 'bold');
            }
        }
        break; 
    }

    // Not the last MUX, follow to next MUX
    const varNameForThisDepth = expansionOrder[depth]; 
    const originalVarLIndex = L_VARS.indexOf(varNameForThisDepth);
    if (originalVarLIndex === -1) {
            console.warn(`Variable ${varNameForThisDepth} not found in L_VARS. Path tracing aborted.`);
            break; 
    }
    const pinToFollow = mintermPathStr[originalVarLIndex];

    const conn = elementsStore.connections.find(c => c.fromId === currentLogicalMux.id && c.fromPin === pinToFollow);
    if (!conn) {
            console.warn(`Connection from MUX ${currentLogicalMux.id} via pin ${pinToFollow} not found. Path tracing aborted.`);
            break;
    }
    
    const lineId = `line_${conn.fromId}_${conn.fromPin}_${conn.toId}`;
    const lineSvg = drawnElements[lineId];
    if (lineSvg) {
        lineSvg.setAttribute('stroke', highlightColor);
        lineSvg.setAttribute('stroke-width', highlightedLineStrokeWidth);
    }
    
    currentLogicalElementId = conn.toId; 
}
});
}

export function createSvgMuxElement(cx, cy, varName, config = DEFAULT_MUX_CONFIG) {
const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
group.dataset.varName = varName;

const x = cx - config.width / 2;
const y = cy;

const p1 = `${x},${y - config.outputHeight / 2}`;
const p2 = `${x + config.width},${y - config.inputHeight / 2}`;
const p3 = `${x + config.width},${y + config.inputHeight / 2}`;
const p4 = `${x},${y + config.outputHeight / 2}`;

const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
polygon.setAttribute('points', `${p1} ${p2} ${p3} ${p4}`);
polygon.setAttribute('fill', config.fillColor);
polygon.setAttribute('stroke', config.strokeColor);
polygon.setAttribute('stroke-width', '1.5');
group.appendChild(polygon);

const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
text.setAttribute('x', cx);
text.setAttribute('y', cy);
text.setAttribute('font-family', 'system-ui, sans-serif');
text.setAttribute('font-size', config.varFontSize);
text.setAttribute('text-anchor', 'middle');
text.setAttribute('dominant-baseline', 'middle');
text.textContent = varName;
group.appendChild(text);

const label1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
label1.setAttribute('x', x + config.width + config.labelOffset);
label1.setAttribute('y', y - config.inputHeight / 4);
label1.setAttribute('font-family', 'system-ui, sans-serif');
label1.setAttribute('font-size', config.labelFontSize);
label1.setAttribute('text-anchor', 'start');
label1.setAttribute('dominant-baseline', 'middle');
label1.textContent = '1';
group.appendChild(label1);

const label0 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
label0.setAttribute('x', x + config.width + config.labelOffset);
label0.setAttribute('y', y + config.inputHeight / 4);
label0.setAttribute('font-family', 'system-ui, sans-serif');
label0.setAttribute('font-size', config.labelFontSize);
label0.setAttribute('text-anchor', 'start');
label0.setAttribute('dominant-baseline', 'middle');
label0.textContent = '0';
group.appendChild(label0);

group.dataset.connOutX = -config.width / 2;
group.dataset.connOutY = 0;
group.dataset.connIn1X = config.width / 2;
group.dataset.connIn1Y = -config.inputHeight / 4;
group.dataset.connIn0X = config.width / 2;
group.dataset.connIn0Y = config.inputHeight / 4;

return group;
}

export function getNextMuxId(_idCounter) { 
return `el_mux_${_idCounter.next++}`; 
}

export function generateMuxStructureRecursive(node, depth, _elementsStore, _idCounter, _yOrderCounters) {
const currentId = getNextMuxId(_idCounter);

if (typeof _yOrderCounters[depth] === 'undefined') {
    _yOrderCounters[depth] = 0;
}
const yOrder = _yOrderCounters[depth];
_yOrderCounters[depth]++;

if (node.type === 'constant') {
    _elementsStore.constants.push({ 
        id: currentId, 
        value: node.value, 
        depth: depth, 
        yOrderAtDepth: yOrder,
        minterms: node.minterms,
        path: node.path
    });
    return { id: currentId, type: 'constant' };
}

_elementsStore.muxes.push({ 
    id: currentId, 
    varName: node.variable, 
    depth: depth, 
    varIndexOriginal: node.varIndex, 
    yOrderAtDepth: yOrder,
    minterms: node.minterms
});

const positiveChildInfo = generateMuxStructureRecursive(node.positiveBranch, depth + 1, _elementsStore, _idCounter, _yOrderCounters);
_elementsStore.connections.push({ 
    fromId: currentId, 
    fromPin: '1',
    toId: positiveChildInfo.id, 
    toType: positiveChildInfo.type 
});

const negativeChildInfo = generateMuxStructureRecursive(node.negativeBranch, depth + 1, _elementsStore, _idCounter, _yOrderCounters);
_elementsStore.connections.push({ 
    fromId: currentId, 
    fromPin: '0',
    toId: negativeChildInfo.id, 
    toType: negativeChildInfo.type 
});

return { id: currentId, type: 'mux' };
}

export function generateMuxDiagramStructure(rootNode) {
const elementsStore = { muxes: [], constants: [], connections: [] };
const idCounter = { next: 0 };
const yOrderCounters = [];

generateMuxStructureRecursive(rootNode, 0, elementsStore, idCounter, yOrderCounters);
return elementsStore;
}

export function calculateMuxLayout(elementsStore, layoutConfig = DEFAULT_LAYOUT_CONFIG, muxDisplayConfig = DEFAULT_MUX_CONFIG) {
    const elementCoords = {};
    const elementsByDepth = {};

    const muxCardBody = document.querySelector('#muxCard .card-body');
    const svgActualHeight = muxCardBody && muxCardBody.offsetHeight > 100 ? muxCardBody.offsetHeight - (2 * layoutConfig.paddingY) : 400 - (2*layoutConfig.paddingY); // effective height after padding
    const elementRenderHeight = muxDisplayConfig.inputHeight;

    const allElements = [
        ...(elementsStore.muxes || []),
        ...(elementsStore.constants || [])
    ];

    let maxDepth = 0;
    allElements.forEach(element => {
        if (!elementsByDepth[element.depth]) {
            elementsByDepth[element.depth] = [];
        }
        elementsByDepth[element.depth].push(element);
        if (element.depth > maxDepth) {
            maxDepth = element.depth;
        }
    });

    Object.keys(elementsByDepth).forEach(depthKey => {
        const depth = parseInt(depthKey, 10);
        const elementsInColumn = elementsByDepth[depth];
        elementsInColumn.sort((a, b) => a.yOrderAtDepth - b.yOrderAtDepth);

        const numElements = elementsInColumn.length;
        if (numElements === 0) return;

        const isLastColumn = (depth === maxDepth);

        if (isLastColumn) {
            // Special handling for the last column (typically constants)
            // Distribute elements across the full available height, respecting paddingY.
            const usableHeight = svgActualHeight; // svgActualHeight is already adjusted for padding top & bottom
            
            elementsInColumn.forEach((element, index) => {
                const x = layoutConfig.paddingX + element.depth * (muxDisplayConfig.width + layoutConfig.spacingX);
                let y;
                if (numElements === 1) {
                    y = layoutConfig.paddingY + usableHeight / 2;
                } else {
                    // Distribute elements evenly from paddingY to svgActualHeight - paddingY
                    // The first element is at paddingY + elementRenderHeight / 2
                    // The last element is at (svgActualHeight + layoutConfig.paddingY) - elementRenderHeight / 2
                    // No, the usableHeight is already padded. So, first element at elementRenderHeight/2 from top of usable area.
                    // Last element is usableHeight - elementRenderHeight/2 from top of usable area.
                     y = layoutConfig.paddingY + (index * (usableHeight - elementRenderHeight) / (numElements - 1)) + (elementRenderHeight / 2);
                }
                elementCoords[element.id] = { x, y, type: element.varName ? 'mux' : 'constant', element: element };
            });
        } else {
            // Original logic for other columns: center the block of elements
            const totalContentHeight = (numElements * elementRenderHeight) + (Math.max(0, numElements - 1) * layoutConfig.spacingY);
            // columnBlockStartY is the start of the content block, from the top of the padded area
            const columnBlockStartY = Math.max(0, (svgActualHeight - totalContentHeight) / 2); 
            
            elementsInColumn.forEach((element, index) => {
                const x = layoutConfig.paddingX + element.depth * (muxDisplayConfig.width + layoutConfig.spacingX);
                // y is relative to the overall SVG, so add back paddingY
                const y = layoutConfig.paddingY + columnBlockStartY + (index * (elementRenderHeight + layoutConfig.spacingY)) + (elementRenderHeight / 2);
                elementCoords[element.id] = { x, y, type: element.varName ? 'mux' : 'constant', element: element };
            });
        }
    });
    return elementCoords;
}

export function renderMuxDiagram(elementsStore, elementCoords, muxConfig = DEFAULT_MUX_CONFIG) {
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
      endX = toCoords.x - 5;
      endY = toCoords.y;
    }

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
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

