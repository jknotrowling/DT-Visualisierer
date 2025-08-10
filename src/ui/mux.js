import {
  shannonExpansion,
} from "../logic/bool.js";

import { handleExpansionSpanHover } from "./hover.js";
import {
  generateMuxDiagramStructure,
  calculateMuxLayout,
  renderMuxDiagram,
  MUX_DIAGRAM_STATE,
  setSvgMux,
} from "../logic/mux.js";
import { logicState, expansionState, VARIABLE_NAMES, DEFAULT_LAYOUT_CONFIG } from "../state.js";
import { $ } from "../utils/utils.js";
import { DEFAULT_MUX_CONFIG } from "../logic/mux.js";


function genSpanId() {
  return `expSpan-${expansionState.spanIdCounter++}`;
}
function genGroupId() {
  return `expGroup-${expansionState.groupIdCounter++}`;
}
export function generateExpansionHtmlRecursive(node, ancestorGroupChain = []) {
  let htmlOutput = "";
  const styleType = "color";

  if (node.type === "constant") {
    const id = genSpanId();
    let currentGroupChain = ancestorGroupChain;
    if (ancestorGroupChain.length === 0) {
      currentGroupChain = [genGroupId()];
    }
    expansionState.spanData[id] = {
      minterms: node.minterms,
      textContent: node.value,
      isLeaf: true,
      path: node.path,
      groupChain: currentGroupChain,
      styleType: styleType,
    };
    htmlOutput = `<span id="${id}" data-span-id="${id}">${node.value}</span>`;
  } else if (node.type === "expression") {
    const { variable, positiveBranch, negativeBranch } = node;

    const positiveBranchGroupId = genGroupId();
    const currentPositiveGroupChain = [
      ...ancestorGroupChain,
      positiveBranchGroupId,
    ];

    const varPosId = genSpanId();
    expansionState.spanData[varPosId] = {
      minterms: positiveBranch.minterms,
      textContent: variable,
      isVar: true,
      varName: variable,
      groupChain: currentPositiveGroupChain,
      styleType: styleType,
    };
    htmlOutput += `<span id="${varPosId}" data-span-id="${varPosId}">${variable}</span>`;

    const openParenPosId = genSpanId();
    expansionState.spanData[openParenPosId] = {
      minterms: positiveBranch.minterms,
      textContent: "(",
      isParen: true,
      groupChain: currentPositiveGroupChain,
      styleType: styleType,
    };
    htmlOutput += `<span id="${openParenPosId}" data-span-id="${openParenPosId}">(</span>`;

    htmlOutput += generateExpansionHtmlRecursive(
      positiveBranch,
      currentPositiveGroupChain
    );

    const closeParenPosId = genSpanId();
    expansionState.spanData[closeParenPosId] = {
      minterms: positiveBranch.minterms,
      textContent: ")",
      isParen: true,
      groupChain: currentPositiveGroupChain,
      styleType: styleType,
    };
    htmlOutput += `<span id="${closeParenPosId}" data-span-id="${closeParenPosId}">)</span>`;

    const negativeBranchGroupId = genGroupId();
    const currentNegativeGroupChain = [
      ...ancestorGroupChain,
      negativeBranchGroupId,
    ];

    const varNegId = genSpanId();
    expansionState.spanData[varNegId] = {
      minterms: negativeBranch.minterms,
      textContent: `${variable}'`,
      isVar: true,
      varName: variable,
      isNegated: true,
      groupChain: currentNegativeGroupChain,
      styleType: styleType,
    };
    htmlOutput += `<span id="${varNegId}" data-span-id="${varNegId}" class="ov">${variable}</span>`;

    const openParenNegId = genSpanId();
    expansionState.spanData[openParenNegId] = {
      minterms: negativeBranch.minterms,
      textContent: "(",
      isParen: true,
      groupChain: currentNegativeGroupChain,
      styleType: styleType,
    };
    htmlOutput += `<span id="${openParenNegId}" data-span-id="${openParenNegId}">(</span>`;

    htmlOutput += generateExpansionHtmlRecursive(
      negativeBranch,
      currentNegativeGroupChain
    );

    const closeParenNegId = genSpanId();
    expansionState.spanData[closeParenNegId] = {
      minterms: negativeBranch.minterms,
      textContent: ")",
      isParen: true,
      groupChain: currentNegativeGroupChain,
      styleType: styleType,
    };
    htmlOutput += `<span id="${closeParenNegId}" data-span-id="${closeParenNegId}">)</span>`;
  }
  return htmlOutput;
}




export function renderDev() {
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

  if (logicState.nVars === 4) {
    activeMuxConfig.inputHeight = 30;
    activeMuxConfig.outputHeight = 15;
    activeMuxConfig.width = 55;
    activeMuxConfig.varFontSize = 12;
    activeMuxConfig.labelFontSize = 9;
    activeLayoutConfig.spacingY = 20;
    activeLayoutConfig.spacingX = 65;
  }
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

export function renderMUX() {
    const expansionOrderInputEl = $("expansionOrderInput");
  if (expansionOrderInputEl) {
    expansionOrderInputEl.onchange = () => {
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