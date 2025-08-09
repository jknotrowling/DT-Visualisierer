import { renderSymmetryDiagram } from './symmetry.js';
import {renderCurrentFunctionExpression} from './currentFunctionExpression.js';
import {
  setSvgMux,
  MUX_DIAGRAM_STATE,
  DEFAULT_MUX_CONFIG,
  highlightMuxElements,
  generateMuxDiagramStructure,
  calculateMuxLayout,
  renderMuxDiagram,
} from "../logic/mux.js";

import { $, debounce, applyPreset, truthArrayToTruthTable, zeroTruthTable} from "../utils/utils.js";
import { 
  setupTouchFriendlyTruthTable, 
  setupTouchFriendlySymmetryDiagram, 
  setupTouchFriendlyExpressionTerms 
} from "../utils/touchUtils.js";

import { buildTruth } from '../logic/truth.js';

import { minimize, expand, lit, simplifiedBooleanExpansionRecursive } from '../logic/booleanForm.js';
import { logicState, VARIABLE_NAMES,customFunctionState, expansionState, DEFAULT_LAYOUT_CONFIG, layoutState } from '../state.js';
import { getMinimalExpression, parseLogicFunction } from '../logic/parser.js';






function genSpanId() {
  return `expSpan-${expansionState.spanIdCounter++}`;
}
function genGroupId() {
  return `expGroup-${expansionState.groupIdCounter++}`;
}

function disabledButtonsOnEditingCustomFunction() {
  const minusBtnEl = $("minusBtn");
  const plusBtnEl = $("plusBtn");
  console.log("Is edditing",customFunctionState.isEditing)
  if (minusBtnEl && plusBtnEl) {
    const disableMinus = customFunctionState.isEditing || logicState.nVars <= 2;
    const disablePlus = customFunctionState.isEditing || logicState.nVars >= 4;

    console.log("Setting button states", { disableMinus, disablePlus });

    if (disableMinus) {
        minusBtnEl.setAttribute("disabled", "");
    } else {
        minusBtnEl.removeAttribute("disabled");
    }

    if (disablePlus) {
        plusBtnEl.setAttribute("disabled", "");
    } else {
        plusBtnEl.removeAttribute("disabled");
    }
}
  const presetBtns = document.querySelectorAll(".preset-btn");
  presetBtns.forEach((btn) => {
    if (customFunctionState.isEditing) {
      btn.setAttribute("disabled", "");
    } else {
      btn.removeAttribute("disabled");
    }
  });

}

function updatePresetButtonStates() {
  const presetBtns = document.querySelectorAll('.preset-btn');
  presetBtns.forEach(btn => {
    const value = btn.getAttribute('data-value');
    if (value === logicState.preset.toLowerCase()) {
      // Add active styles to the current preset button
      btn.classList.add('active', 'bg-gray-700', 'border-gray-700', 'shadow-md', 'text-white', 'font-bold');
      btn.classList.remove('bg-white', 'border-gray-300', 'shadow-sm', 'text-gray-700', 'font-semibold');
    } else {
      // Remove active styles from all other buttons
      btn.classList.remove('active', 'bg-gray-700', 'border-gray-700', 'shadow-md', 'text-white', 'font-bold');
      btn.classList.add('bg-white', 'border-gray-300', 'shadow-sm', 'text-gray-700', 'font-semibold');
    }
  });
}

export function renderAll() {
  $("varCountLbl").textContent = logicState.nVars;
  
  renderTruth();
  renderKMap();
  renderCurrentFunctionExpression();
  disabledButtonsOnEditingCustomFunction();
  updatePresetButtonStates();
  const truthByDecimalOrder = [];
  for (let i = 0; i < (1 << logicState.nVars); i++) {
    const binaryLSB = i.toString(2).padStart(logicState.nVars, '0').split('').reverse().join('');
    const truthEntry = logicState.truth.find(t => t.bits === binaryLSB);
    truthByDecimalOrder.push(truthEntry ? truthEntry.out : 0);
  }

  renderSymmetryDiagram(
    logicState.nVars,
    truthByDecimalOrder
  );

  renderExpr();
  renderDev();
  setupAllHoverInteractions();





  
  
}

function renderTruth() {
  
  const nVars = logicState.nVars;
  const header = [...VARIABLE_NAMES.slice(0, nVars).reverse(), 'f'];
  const gridCols = nVars + 1;

  const cellWidthClass = "min-w-[2.5rem] px-3";
  // Use Tailwind's grid-cols-4, grid-cols-5, etc. for up to 4 variables
  const gridColsClass = `grid-cols-${gridCols > 6 ? 6 : gridCols}`;
  let h = `<div class="grid ${gridColsClass} gap-2 bg-white rounded-xl p-4 ">
    ${header.map(
      th => `<div class="${cellWidthClass} text-center font-semibold text-gray-700 bg-gray-100 rounded py-2">${th}</div>`
    ).join('')}
    ${logicState.truth.sort(
      (a, b) => parseInt(a.bits.split("").reverse().join(""), 2) - parseInt(b.bits.split("").reverse().join(""), 2)
    ).map(r => {
      const cellBase = `${cellWidthClass} flex items-center justify-center text-center rounded transition cursor-pointer border font-bold`;
      let outClass = "";
      let outText = r.out === null ? "-" : r.out;
      if (r.out === 1) outClass = "bg-green-100 border-green-600 text-green-700"
      else if (r.out === 0) outClass = "";
      else outClass = "bg-yellow-100 border-yellow-600 text-yellow-700";
      return [
        ...[...r.bits].reverse().map(b => `<div class="${cellBase} bg-gray-50 border-gray-200">${b}</div>`),
        `<div class="outCell ${cellBase} ${outClass}" data-bits="${r.bits}">${outText}</div>`
      ].join('');
    }).join('')}
  </div>`;
  const truthWrap = document.querySelector(
    "#truthTableCard .card-body #truthWrap"
  );
  if (truthWrap) truthWrap.innerHTML = h;

  // Setup touch-friendly interactions for truth table cells
  const truthTableClickHandler = (e) => {
    const currentTarget = e.currentTarget;
    if (!currentTarget) return;
    const bits = currentTarget.dataset.bits;
    if (!bits) return;
    const o = logicState.truth.find((t) => t.bits === bits);
    if (!o) return;
    o.out = o.out === 0 ? 1 : o.out === 1 ? null : 0;

    logicState.preset = "custom";
    customFunctionState.customFunction = getMinimalExpression();
    const presetOpEl = $("presetOp");
    if (presetOpEl instanceof HTMLSelectElement) presetOpEl.value = "custom";
    renderAll();
  };

  setupTouchFriendlyTruthTable(handleCellOrTermHover, truthTableClickHandler);
}

function renderKMap() {
  // Setup touch-friendly interactions for symmetry diagram cells
  const symmetryDiagramClickHandler = (e) => {
    const currentTarget = e.currentTarget;

    if (!currentTarget) return;

    const bits = currentTarget.dataset.bits;

    if (!bits) return;

    const currentValueIndex = logicState.truth.findIndex((t) => t.bits === bits);

    if (currentValueIndex === -1) return; // No matching bits found

    const currentValue = logicState.truth[currentValueIndex];

    const nextValue =
      currentValue.out === 0 ? 1 : currentValue.out === 1 ? null : 0;

    logicState.truth[currentValueIndex] = {
      out: nextValue,
      bits: currentValue.bits,
    };

    customFunctionState.customFunction = getMinimalExpression();
    logicState.preset = "custom";
    
    renderAll();
  };

  setupTouchFriendlySymmetryDiagram(handleCellOrTermHover, symmetryDiagramClickHandler);
}


function renderExpr() {
  const ones = logicState.truth.filter((r) => r.out === 1).map((r) => parseInt(r.bits, 2));
  const zeros = logicState.truth
    .filter((r) => r.out === 0)
    .map((r) => parseInt(r.bits, 2));
  const dcs = logicState.truth
    .filter((r) => r.out === null)
    .map((r) => parseInt(r.bits, 2));

  const dnfR = logicState.truth.filter((r) => r.out === 1);
  const cnfR = logicState.truth.filter((r) => r.out === 0);

  const dmf = minimize(logicState.nVars, ones, dcs);
  const kmf = minimize(logicState.nVars, zeros, dcs);

  let h = `<div class="config-header">
                    <div class="config-dot config-dot-blue"></div>
                    <span class="config-title config-title-blue">DNF</span>
                  </div>` //"<strong>DNF:</strong><br>";
  h += dnfR.length
    ? dnfR
        .map(
          (r) =>
            `<span class="term dnf bg-blue-200" data-bits="${r.bits}">${lit(
              r.bits,
              "dnf"
            )}</span>`
        )
        .join(" v ")
    : "0";

  h += `<hr class="mt-2"><div class="config-header">
                    <div class="config-dot config-dot-red"></div>
                    <span class="config-title config-title-red">KNF</span>
                  </div>`//"<hr><strong>KNF:</strong><br>";
  h += cnfR.length
    ? cnfR
        .map(
          (r) =>
            `<span class="term cnf bg-red-200" data-bits="${r.bits}">(${lit(
              r.bits,
              "cnf"
            )})</span>`
        )
        .join(" & ")
    : "1";

  h += `<hr class="mt-2"><div class="config-header">
                    <div class="config-dot config-dot-green"></div>
                    <span class="config-title config-title-green">DMF</span>
                  </div>`//"<hr><strong>DMF (min):</strong><br>";
  h += dmf.length
    ? dmf
        .map(
          (p) =>
            `<span class="term dmf bg-green-200 " data-cover="${expand(p).join(
              "|"
            )}">${lit(p, "dmf")}</span>`
        )
        .join(" ∨ ")
    : "0";

  h += `<hr class="mt-2"><div class="config-header">
                    <div class="config-dot config-dot-orange"></div>
                    <span class="config-title config-title-orange">KMF</span>
                  </div>`//"<hr><strong>KMF (min):</strong><br>";
  h += kmf.length
    ? kmf
        .map(
          (p) =>
            `<span class="term cmf bg-orange-200 " data-cover="${expand(p).join(
              "|"
            )}">(${lit(p, "kmf")})</span>`
        )
        .join(" & ")
    : "1";

  const exprWrap = document.querySelector(
    "#expressionsCard .card-body #exprWrap"
  );
  if (exprWrap) exprWrap.innerHTML = h;
}


function generateExpansionHtmlRecursive(node, ancestorGroupChain = []) {
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

function renderDev() {
  expansionState.spanIdCounter = 0;
  expansionState.groupIdCounter = 0;
  for (const key in expansionState.spanData) delete expansionState.spanData[key];

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

  const rootExpansionNode = simplifiedBooleanExpansionRecursive(
    "".padStart(logicState.nVars, "0"),
    0,
    customOrderNames
  );

  let singleInstanceHtml = `<pre data-style-type="color">`;
  singleInstanceHtml += generateExpansionHtmlRecursive(rootExpansionNode, []);
  singleInstanceHtml += `</pre>`;

  const devWrap = document.querySelector("#booleanDevCard .card-body #devWrap");
  if (devWrap) devWrap.innerHTML = singleInstanceHtml;

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
      MUX_DIAGRAM_STATE.currentExpansionOrderForMuxHighlight = [...customOrderNames];
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
    if (MUX_DIAGRAM_STATE.muxSvgElement) MUX_DIAGRAM_STATE.muxSvgElement.innerHTML = "";
  }
}

function setupAllHoverInteractions() {
  // Expression terms - only need hover interactions
  setupTouchFriendlyExpressionTerms(handleCellOrTermHover);
}

function handleCellOrTermHover(hoveredElement, isOn) {
  let mintermsToHighlightInTables = [];
  let singleMintermForExpansionLookup = null;
  let termCoversMintermsForExpansionLookup = [];

  if (hoveredElement.dataset.bits) {
    mintermsToHighlightInTables = [hoveredElement.dataset.bits];
    singleMintermForExpansionLookup = hoveredElement.dataset.bits;

    console.log("Hovering over", hoveredElement);

    document
      .querySelectorAll("#expressionsCard .dmf")
      .forEach((termEl) => {
        const coveredByTerm = termEl.dataset.cover
          ? termEl.dataset.cover.split("|")
          : [];
        if (coveredByTerm.includes(singleMintermForExpansionLookup)) {
          termEl.classList.toggle("hl-dmf-cell", isOn);
        }
      });

    document.querySelectorAll("#expressionsCard .cmf")
      .forEach((termEl) => {
        const coveredByTerm = termEl.dataset.cover
          ? termEl.dataset.cover.split("|")
          : [];
        if (coveredByTerm.includes(singleMintermForExpansionLookup)) {
          termEl.classList.toggle("hl-cmf-cell", isOn);
        }
      });
  } else if (hoveredElement.dataset.cover) {
    mintermsToHighlightInTables = hoveredElement.dataset.cover.split("|");
    termCoversMintermsForExpansionLookup = mintermsToHighlightInTables;
    hoveredElement.classList.toggle("hl-cmf-cell", isOn);
  }

  if (mintermsToHighlightInTables.length > 0) {
    highlightTableCells(mintermsToHighlightInTables, isOn);
  }

  const applyHighlightToExpansionGroup = (targetGroupId, highlightState) => {
    if (!targetGroupId) return;
    for (const id in expansionState.spanData) {
      const data = expansionState.spanData[id];
      if (data.groupChain && data.groupChain.includes(targetGroupId)) {
        const el = document.getElementById(id); // ID is unique
        if (el) {
          el.classList.toggle("hl-color", highlightState);
        }
      }
    }
  };

  if (singleMintermForExpansionLookup) {
    let targetGroupIdFound = null;
    for (const spanId in expansionState.spanData) {
      const data = expansionState.spanData[spanId];
      if (
        data.isLeaf &&
        data.path === singleMintermForExpansionLookup &&
        data.groupChain &&
        data.groupChain.length > 0
      ) {
        targetGroupIdFound = data.groupChain[data.groupChain.length - 1];
        break;
      }
    }
    if (!targetGroupIdFound) {
      for (const spanId in expansionState.spanData) {
        const data = expansionState.spanData[spanId];
        if (
          data.isLeaf &&
          data.path === null &&
          data.minterms &&
          data.minterms.includes(singleMintermForExpansionLookup) &&
          data.groupChain &&
          data.groupChain.length > 0
        ) {
          targetGroupIdFound = data.groupChain[data.groupChain.length - 1];
          break;
        }
      }
    }
    if (targetGroupIdFound) {
      applyHighlightToExpansionGroup(targetGroupIdFound, isOn);
    }
  } else if (termCoversMintermsForExpansionLookup.length > 0) {
    const groupsToHighlight = new Set();
    termCoversMintermsForExpansionLookup.forEach((minterm) => {
      let foundForThisMinterm = false;
      for (const spanId in expansionState.spanData) {
        const data = expansionState.spanData[spanId];
        if (
          data.isLeaf &&
          data.path === minterm &&
          data.groupChain &&
          data.groupChain.length > 0
        ) {
          groupsToHighlight.add(data.groupChain[data.groupChain.length - 1]);
          foundForThisMinterm = true;
          break;
        }
      }
      if (!foundForThisMinterm) {
        for (const spanId in expansionState.spanData) {
          const data = expansionState.spanData[spanId];
          if (
            data.isLeaf &&
            data.path === null &&
            data.minterms &&
            data.minterms.includes(minterm) &&
            data.groupChain &&
            data.groupChain.length > 0
          ) {
            groupsToHighlight.add(data.groupChain[data.groupChain.length - 1]);
            break;
          }
        }
      }
    });
    groupsToHighlight.forEach((groupId) =>
      applyHighlightToExpansionGroup(groupId, isOn)
    );
  }

  let activePathsForMux = [];
  if (
    hoveredElement.dataset.spanId &&
    expansionState.spanData &&
    expansionState.spanData[hoveredElement.dataset.spanId]
  ) {
    const mintermSource =
      expansionState.spanData[hoveredElement.dataset.spanId].minterms;
    if (mintermSource) {
      activePathsForMux = Array.isArray(mintermSource)
        ? mintermSource.filter((p) => typeof p === "string")
        : typeof mintermSource === "string"
        ? [mintermSource]
        : [];
    } else {
      activePathsForMux = [];
    }
  } else if (hoveredElement.dataset.bits) {
    activePathsForMux = [hoveredElement.dataset.bits];
  } else if (hoveredElement.dataset.cover) {
    activePathsForMux = hoveredElement.dataset.cover.split("|");
  }

  if (
    MUX_DIAGRAM_STATE.currentMuxElementsStore &&
    MUX_DIAGRAM_STATE.currentMuxDrawnElements &&
    typeof highlightMuxElements === "function" &&
    MUX_DIAGRAM_STATE.muxSvgElement
  ) {
    highlightMuxElements(
      activePathsForMux,
      isOn,
      MUX_DIAGRAM_STATE.currentMuxElementsStore,
      MUX_DIAGRAM_STATE.currentMuxDrawnElements,
      MUX_DIAGRAM_STATE.currentExpansionOrderForMuxHighlight,
      MUX_DIAGRAM_STATE.currentActiveMuxConfig
    );
  }
}

function handleExpansionSpanHover(spanElement, isOn, highlightClass) {
  const spanId = spanElement.dataset.spanId;
  if (!spanId || !expansionState.spanData[spanId]) return;

  const data = expansionState.spanData[spanId];
  const mintermsToHl = data.minterms;

  if (!data.groupChain || data.groupChain.length === 0) return;
  const primaryGroupIdForHover = data.groupChain[data.groupChain.length - 1];

  if (mintermsToHl && mintermsToHl.length > 0) {
    highlightTableCells(mintermsToHl, isOn);
  }

  if (primaryGroupIdForHover && highlightClass) {
    for (const id in expansionState.spanData) {
      const iterData = expansionState.spanData[id];
      if (
        iterData.groupChain &&
        iterData.groupChain.includes(primaryGroupIdForHover)
      ) {
        const el = document.getElementById(id); // ID is unique
        if (el) el.classList.toggle(highlightClass, isOn);
      }
    }
  }

  let activePathsForMux = [];
  if (mintermsToHl) {
    activePathsForMux = Array.isArray(mintermsToHl)
      ? mintermsToHl.filter((p) => typeof p === "string")
      : typeof mintermsToHl === "string"
      ? [mintermsToHl]
      : [];
  } else {
    activePathsForMux = [];
  }

  if (
    MUX_DIAGRAM_STATE.currentMuxElementsStore &&
    MUX_DIAGRAM_STATE.currentMuxDrawnElements &&
    typeof highlightMuxElements === "function" &&
    MUX_DIAGRAM_STATE.muxSvgElement
  ) {
    highlightMuxElements(
      activePathsForMux,
      isOn,
      MUX_DIAGRAM_STATE.currentMuxElementsStore,
      MUX_DIAGRAM_STATE.currentMuxDrawnElements,
      MUX_DIAGRAM_STATE.currentExpansionOrderForMuxHighlight,
      MUX_DIAGRAM_STATE.currentActiveMuxConfig
    );
  }
}

function highlightTableCells(arr, on) {
  arr.forEach((b) => {

    const valueAtField = logicState.truth.find((t) => t.bits === b);

    let classSuffix = valueAtField?.out === null ? "dc" : valueAtField?.out === 1 ? "on" : "off";

    // Highlight cells in truth table (inside card-body)
    document
      .querySelectorAll(`#truthWrap [data-bits="${b}"]`)
      .forEach((n) => n.classList.toggle(`hl-cell-${classSuffix}`, on));
    // Highlight cells in symmetry diagram (not inside card-body)
    document
      .querySelectorAll(`#symmetry-diagram [data-bits="${b}"]`)
      .forEach((n) => n.classList.toggle(`hl-cell-${classSuffix}`, on));

     // Highlight DNF Cells
    document
      .querySelectorAll(`#expressionsCard .dnf[data-bits="${b}"]`)
      .forEach((n) => n.classList.toggle(`hl-dnf-cell`, on));
    // Highlight CNF Cells
    document.querySelectorAll(`#expressionsCard .cnf[data-bits="${b}"]`)
      .forEach((n) => n.classList.toggle(`hl-cnf-cell`, on));
    // Highlight DMF Cells
    document.querySelectorAll(`#expressionsCard .dmf[data-cover="${b}"]`)
      .forEach((n) => n.classList.toggle(`hl-dmf-cell`, on));
    // Highlight KMF Cells
    document.querySelectorAll(`#expressionsCard .kmf[data-cover="${b}"]`)
      .forEach((n) => n.classList.toggle(`hl-kmf-cell`, on));
  });
}

function resetGridColsToDefault() {
  const cardGrid = document.querySelector("#card-grid");
  if (!cardGrid) return;


  cardGrid.classList.remove(
    "lg:grid-cols-1",
    "lg:grid-cols-2",
    "lg:grid-cols-3",
    "lg:grid-cols-4",
    "lg:grid-cols-5",
    "lg:grid-cols-6",
    "lg:grid-cols-7",
    "lg:grid-cols-8",
    "lg:grid-cols-9",
  );

  const viewToggleMappings = layoutState.viewToggleMappings;
  const classesToRemove = [
    "lg:row-span-2",
    "lg:row-span-1",
    "lg:col-span-1",
    "lg:col-span-2",
    "lg:col-span-3",
    "lg:col-span-4",
    
  ];
  Object.values(viewToggleMappings).forEach((mapping) => {
    const el = $(mapping.id);
    if (el) {
      classesToRemove.forEach((cls) => el.classList.remove(cls));
    }
  });


  

} 

function getOtherActiveCards(notThisIds) {
  const viewToggleMappings = layoutState.viewToggleMappings;
    const excludeIds = Array.isArray(notThisIds) ? notThisIds : [notThisIds];
    return Object.values(viewToggleMappings)
      .filter(v => !excludeIds.includes(v.id) && v.active)
      .map(v => $(v.id));
}
  

function updateGridCols() {
  const {
    viewToggleMappings,
    isLandscape
  } = layoutState;

  const cardGrid = document.querySelector("#card-grid");
  if (!cardGrid) return;

  const {
    toggleTruthTable,
    toggleExpressions,
    toggleMux,
    toggleKmap,
    toggleBooleanDev
  } = viewToggleMappings;

  resetGridColsToDefault();

  const isVisible = id => $(id)?.style.display !== "none";

  const activeCards = Object.values(viewToggleMappings)
    .map(val => val.id)
    .filter(id => isVisible(id));

  const activeCount = activeCards.length;

  const isTruthActive = isVisible(toggleTruthTable.id);
  const isExprActive = isVisible(toggleExpressions.id);
  const isMuxActive = isVisible(toggleMux.id);
  const isKmapActive = isVisible(toggleKmap.id);
  const isDevActive = isVisible(toggleBooleanDev.id);

  const truthEl = $(toggleTruthTable.id);
  const exprEl = $(toggleExpressions.id);
  const muxEl = $(toggleMux.id);
  const kmapEl = $(toggleKmap.id);
  const devEl = $(toggleBooleanDev.id);

  const GRID1 = "lg: grid-cols-1"
  const GRID2 = "lg:grid-cols-2";
  const GRID3 = "lg:grid-cols-3";
  const GRID4 = "lg:grid-cols-4";
  const GRID5 = "lg:grid-cols-5";
  const GRID6 = "lg:grid-cols-6";
  const GRID7 = "lg:grid-cols-7";
  const GRID8 = "lg:grid-cols-8";

  const COLS1= "lg:col-span-1";
  const COLS2 = "lg:col-span-2";
  const COLS3 = "lg:col-span-3";
  const COLS4 = "lg:col-span-4";

  const ROWS1 = "lg:row-span-1";
  const ROWS2 = "lg:row-span-2";  
  const ROWS3 = "lg:row-span-3";
  const ROWS4 = "lg:row-span-4";



  switch (activeCount) {
    case 1: {
      cardGrid.classList.add(GRID1);
      break;
    }
    case 2: {
      cardGrid.classList.add(GRID2);
      break;
    }
    case 3: {
      cardGrid.classList.add(GRID3);
      if(!isLandscape) {
        const firstActiveEl = $(activeCards[0]);
        firstActiveEl.classList.add(ROWS2);
        getOtherActiveCards(activeCards[0]).forEach((el) => {
          if (el) el.classList.add(COLS2, ROWS1);
        });
      }
      break;
    }
    case 4: {
      if(!isTruthActive) {
        cardGrid.classList.add(GRID2)
        break;
      }
      if(!isMuxActive)  {
        cardGrid.classList.add(GRID3)
         truthEl.classList.add(ROWS2);
          exprEl.classList.add(ROWS2); 
        break;
      }
      if(!isDevActive) {
        if(isLandscape) {
          cardGrid.classList.add(GRID3)
          truthEl.classList.add(ROWS2);
          exprEl.classList.add(ROWS2); 
          break;
        }

        cardGrid.classList.add(GRID3)
        muxEl.classList.add(COLS3);
        break;
      }
      if(!isExprActive) {
        cardGrid.classList.add(GRID3)
        truthEl.classList.add(ROWS2);
        muxEl.classList.add(COLS2);
        break;
      }
      if(!isKmapActive) {

        if(isLandscape) {
          cardGrid.classList.add(GRID4)
          truthEl.classList.add(ROWS2);
          exprEl.classList.add(ROWS2); 
          muxEl.classList.add(COLS2);
          devEl.classList.add(COLS2);
          break;
        }

        cardGrid.classList.add(GRID2)
        truthEl.classList.add(ROWS2);
        muxEl.classList.add(COLS2);
        break;
      }
    }

    case 5: {
      if(isLandscape) {
        cardGrid.classList.add(GRID8);
        truthEl.classList.add(ROWS2, COLS2);
       getOtherActiveCards(toggleTruthTable.id).forEach(el => el.classList.add(COLS3))
       break;
      }

      cardGrid.classList.add(GRID3);
      
      muxEl.classList.add(COLS2);


      break;
    }
  }
}

      


 


export function init() {
  
  setSvgMux();// Initialize global reference

  buildTruth();
  applyPreset(logicState);
  renderAll();
  updateGridCols(); // Initial grid column setup
  
  

  // --- Event Listeners ---
  const minusBtnEl = $("minusBtn");
  if (minusBtnEl) {
    minusBtnEl.onclick = () => {
      if (logicState.nVars > 2) {
        const oldNVars = logicState.nVars;
        const oldTruthCopy =
          logicState.preset === "custom" ? JSON.parse(JSON.stringify(logicState.truth)) : null;
        logicState.nVars--;
        customFunctionState.customFunction = "0";
        if(logicState.preset === "custom") logicState.preset = "AND";
        buildTruth(oldTruthCopy, oldNVars);
        applyPreset(logicState);
        renderAll();
        
      }
    };
  }

  const plusBtnEl = $("plusBtn");
  if (plusBtnEl) {
    plusBtnEl.onclick = () => {
      if (logicState.nVars < 4) {
        const oldNVars = logicState.nVars;
        customFunctionState.customFunction = "0";
        if(logicState.preset === "custom") logicState.truth = zeroTruthTable(logicState.nVars+1);
        // If customFunction exists, rebuild truth table from it, otherwise use old logic
        if (logicState.preset === "custom" && logicState.customFunction && logicState.customFunction.trim() !== "") {
          logicState.nVars++;
          logicState.preset = "AND";
          
        } else {
          const oldTruthCopy = logicState.preset === "custom" ? JSON.parse(JSON.stringify(logicState.truth)) : null;
          logicState.nVars++;
          buildTruth(oldTruthCopy, oldNVars);
        }
        applyPreset(logicState);
        renderAll();
      }
    };
  }
  
  // Preset button logic
  const presetBtns = document.querySelectorAll('.preset-btn');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove 'active' class from all buttons
      presetBtns.forEach(b => {
        b.classList.remove('active', 'bg-gray-700', 'border-gray-700', 'shadow-md', 'text-white', 'font-bold');
        b.classList.add('bg-white', 'border-gray-300', 'shadow-sm', 'text-gray-700', 'font-semibold');
      });
      // Add 'active' class to clicked button
      btn.classList.add('active', 'bg-gray-700', 'border-gray-700', 'shadow-md', 'text-white', 'font-bold');
      btn.classList.remove('bg-white', 'border-gray-300', 'shadow-sm', 'text-gray-700', 'font-semibold');
      // Get selected value
      const value = btn.getAttribute('data-value');
      // Update logicState and trigger UI update
      logicState.preset = value;
      
     
      if (typeof updateLogicFunction === 'function') {
        updateLogicFunction(value);
      } else if (typeof init === 'function') {
        init(); // fallback: re-init UI
      }
    });
  });
  
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

  const debouncedAdjustMuxHeight = debounce(adjustMuxCardHeight, 250);

  // Resize observer for MUX diagram, debounced for performance
  const muxCardBodyForObserver = document.querySelector("#muxCard .card-body");
  if (muxCardBodyForObserver && MUX_DIAGRAM_STATE.muxSvgElement) {
    const resizeObserver = new ResizeObserver((entries) => {
      debouncedMuxRender();
    });
    resizeObserver.observe(muxCardBodyForObserver);
  }

  // View Toggles
  const viewToggleMappings = layoutState.viewToggleMappings

  const cardGrid = document.getElementById("card-grid");

  for (const checkboxId in viewToggleMappings) {
    const checkbox = $(checkboxId);
    const cardId = viewToggleMappings[checkboxId].id;
    const card = $(cardId);

    if (checkbox && card) {
      checkbox.addEventListener("change", function () {

        layoutState.viewToggleMappings[checkboxId].active = this.checked;
        
        

        if (this.checked) {
          card.style.display = "flex"; // Or its original display value if not flex
        } else {
          card.style.display = "none";
        }
        // Special handling for MUX card resize when it becomes visible again
        if (cardId === "muxCard" && this.checked) {
          debouncedMuxRender();
        }

        updateGridCols();

        // adjustMuxCardHeight(); // Adjust height when any view visibility changes
      });
    }
  }

  function adjustMuxCardHeight() {
    // // // const truthTableCard = $("truthTableCard");
    // // // const muxCard = $("muxCard");
    // // // const muxWrap = $("muxWrap");

    // // // if (truthTableCard && muxCard && muxWrap) {
    // // //   const isTruthTableVisible =
    // // //     window.getComputedStyle(truthTableCard).display !== "none";
    // // //   if (isTruthTableVisible) {
    // // //     const referenceHeight = truthTableCard.offsetHeight;
    // // //     if (referenceHeight > 0) {
    // // //       muxCard.style.height = `${referenceHeight}px`;
    // // //       // debouncedMuxRender() will be called by the landscape toggle or resize observer
    // // //       // if a re-render is needed due to size changes.
    // // //     }
    // // //   } else {
    // // //     muxCard.style.height = ""; 
    // // //   }
    // // // }
  }

  // Event listeners for load and resize are now using the debouncedAdjustMuxHeight 
  // that is defined at a higher scope within init()
  window.addEventListener("load", debouncedAdjustMuxHeight); // Use the correctly scoped version
  window.addEventListener("resize", debouncedAdjustMuxHeight); // Use the correctly scoped version

  const landscapeToggleBtnEl = $("landscapeToggleBtn");
  const pageEl = document.querySelector(".page"); // Assuming .page is the main container to toggle class on
  

  if (landscapeToggleBtnEl && pageEl && cardGrid) {
    landscapeToggleBtnEl.onclick = () => {
      pageEl.classList.toggle("landscape-mode");
      

      

      layoutState.isLandscape = !layoutState.isLandscape;
      
      updateGridCols();
      
      
      // After toggling, we might need to trigger a resize/render for elements like MUX
      debouncedMuxRender(); 
      debouncedAdjustMuxHeight();
    };
  }
  
  // Initialize collapse functionality
  initializeCollapseToggle();
}

// Collapse functionality for display options
function initializeCollapseToggle() {
  const collapseToggle = $("collapseToggle");
  const displayOptionsContent = $("displayOptionsContent");
  const collapseIcon = $("collapseIcon");
  
  if (!collapseToggle || !displayOptionsContent || !collapseIcon) {
    console.warn("Collapse elements not found");
    return;
  }

  // Set initial state (expanded by default)
  layoutState.displayOptionsExpanded = layoutState.displayOptionsExpanded !== false; // Default to true
  updateCollapseState();

  collapseToggle.addEventListener("click", toggleDisplayOptions);
}

function toggleDisplayOptions() {
  layoutState.displayOptionsExpanded = !layoutState.displayOptionsExpanded;
  updateCollapseState();
}

function updateCollapseState() {
  const displayOptionsContent = $("displayOptionsContent");
  const collapseIcon = $("collapseIcon");
  
  if (!displayOptionsContent || !collapseIcon) return;

  if (layoutState.displayOptionsExpanded) {
    // First set display and get the natural height
    displayOptionsContent.style.display = "block";
    displayOptionsContent.style.overflow = "hidden"; // Ensure smooth animation
    displayOptionsContent.style.maxHeight = "none";
    const naturalHeight = displayOptionsContent.scrollHeight;
    
    // Reset for animation
    displayOptionsContent.style.maxHeight = "0";
    displayOptionsContent.style.opacity = "0";
    
    // Force reflow
    displayOptionsContent.offsetHeight;
    
    // Animate to natural height
    displayOptionsContent.style.maxHeight = naturalHeight + "px";
    displayOptionsContent.style.opacity = "1";
    displayOptionsContent.style.paddingTop = "1rem";
    displayOptionsContent.style.paddingBottom = "0";
    collapseIcon.style.transform = "translateY(-50%) rotate(180deg)";
    collapseIcon.setAttribute("aria-expanded", "true");
    
    // After animation completes, remove constraints to allow natural sizing
    setTimeout(() => {
      if (layoutState.displayOptionsExpanded) {
        displayOptionsContent.style.maxHeight = "none";
        displayOptionsContent.style.overflow = "visible";
      }
    }, 300);
  } else {
    // Get current height for smooth collapse
    displayOptionsContent.style.overflow = "hidden"; // Ensure smooth animation
    const currentHeight = displayOptionsContent.scrollHeight;
    displayOptionsContent.style.maxHeight = currentHeight + "px";
    
    // Force reflow
    displayOptionsContent.offsetHeight;
    
    // Animate to collapsed
    displayOptionsContent.style.maxHeight = "0";
    displayOptionsContent.style.opacity = "0";
    displayOptionsContent.style.paddingTop = "0";
    displayOptionsContent.style.paddingBottom = "0";
    collapseIcon.style.transform = "translateY(-50%) rotate(0deg)";
    collapseIcon.setAttribute("aria-expanded", "false");
  }
}

