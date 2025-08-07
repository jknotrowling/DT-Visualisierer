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

import { $, debounce, applyPreset, truthArrayToTruthTable} from "../utils/utils.js";

import { buildTruth } from '../logic/truth.js';

import { minimize, expand, lit, simplifiedBooleanExpansionRecursive } from '../logic/booleanForm.js';
import { logicState, VARIABLE_NAMES,customFunctionState, expansionState, DEFAULT_LAYOUT_CONFIG, layoutState } from '../state.js';
import { parseLogicFunction } from '../logic/parser.js';





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


export function renderAll() {
  $("varCountLbl").textContent = logicState.nVars;
  
  renderTruth();
  renderKMap();
  renderCurrentFunctionExpression();
  disabledButtonsOnEditingCustomFunction();
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
    ${logicState.truth.map(r => {
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

  document.querySelectorAll("#truthTableCard .outCell").forEach((td) => {
    td.onclick = (e) => {
      const currentTarget = e.currentTarget;
      if (!currentTarget) return;
      const bits = currentTarget.dataset.bits;
      if (!bits) return;
      const o = logicState.truth.find((t) => t.bits === bits);
      if (!o) return;
      o.out = o.out === 0 ? 1 : o.out === 1 ? null : 0;

      logicState.preset = "custom";
      logicState.customFunction = ""
      const presetOpEl = $("presetOp");
      if (presetOpEl instanceof HTMLSelectElement) presetOpEl.value = "custom";
      renderAll();
    };
  });
}

function renderKMap() {
  // Wait for the symmetry diagram to be rendered before attaching event listeners
  setTimeout(() => {
    document
      .querySelectorAll("#symmetry-diagram div[data-bits]")
      .forEach((td) => {
        td.onclick = (e) => {
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

          logicState.customFunction = ""
          logicState.preset = "custom";
          const presetOpEl = $("presetOp");
          if (presetOpEl instanceof HTMLSelectElement)
            presetOpEl.value = "custom";
          renderAll();
        };
      });
  }, 0);
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
            `<span class="term dnfTerm" data-bits="${r.bits}">${lit(
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
            `<span class="term cnfTerm" data-bits="${r.bits}">(${lit(
              r.bits,
              "cnf"
            )})</span>`
        )
        .join(" ∧ ")
    : "1";

  h += `<hr class="mt-2"><div class="config-header">
                    <div class="config-dot config-dot-green"></div>
                    <span class="config-title config-title-green">DMF (min)</span>
                  </div>`//"<hr><strong>DMF (min):</strong><br>";
  h += dmf.length
    ? dmf
        .map(
          (p) =>
            `<span class="term dmfTerm" data-cover="${expand(p).join(
              "|"
            )}">${lit(p, "dmf")}</span>`
        )
        .join(" ∨ ")
    : "0";

  h += `<hr class="mt-2"><div class="config-header">
                    <div class="config-dot config-dot-orange"></div>
                    <span class="config-title config-title-orange">KMF (min)</span>
                  </div>`//"<hr><strong>KMF (min):</strong><br>";
  h += kmf.length
    ? kmf
        .map(
          (p) =>
            `<span class="term kmfTerm" data-cover="${expand(p).join(
              "|"
            )}">(${lit(p, "kmf")})</span>`
        )
        .join(" ∧ ")
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
  document.querySelectorAll("#truthTableCard .outCell").forEach((el) => {
    el.onmouseenter = () => handleCellOrTermHover(el, true);
    el.onmouseleave = () => handleCellOrTermHover(el, false);
  });
  setTimeout(() => {
    document
      .querySelectorAll("#symmetry-diagram div[data-bits]")
      .forEach((el) => {
        console.log("Applying hover handlers to symmetry diagram cells");
        el.onmouseenter = () => handleCellOrTermHover(el, true);
        el.onmouseleave = () => handleCellOrTermHover(el, false);
      });
  });
  document.querySelectorAll("#expressionsCard .term").forEach((el) => {
    el.onmouseenter = () => handleCellOrTermHover(el, true);
    el.onmouseleave = () => handleCellOrTermHover(el, false);
  });
}

function handleCellOrTermHover(hoveredElement, isOn) {
  let mintermsToHighlightInTables = [];
  let singleMintermForExpansionLookup = null;
  let termCoversMintermsForExpansionLookup = [];

  if (hoveredElement.dataset.bits) {
    mintermsToHighlightInTables = [hoveredElement.dataset.bits];
    singleMintermForExpansionLookup = hoveredElement.dataset.bits;

    document
      .querySelectorAll("#expressionsCard .dmfTerm[data-cover]")
      .forEach((termEl) => {
        const coveredByTerm = termEl.dataset.cover
          ? termEl.dataset.cover.split("|")
          : [];
        if (coveredByTerm.includes(singleMintermForExpansionLookup)) {
          termEl.classList.toggle("hl-color", isOn);
        }
      });
    document
      .querySelectorAll("#expressionsCard .kmfTerm[data-cover]")
      .forEach((termEl) => {
        const coveredByTerm = termEl.dataset.cover
          ? termEl.dataset.cover.split("|")
          : [];
        if (coveredByTerm.includes(singleMintermForExpansionLookup)) {
          termEl.classList.toggle("hl-color", isOn);
        }
      });
  } else if (hoveredElement.dataset.cover) {
    mintermsToHighlightInTables = hoveredElement.dataset.cover.split("|");
    termCoversMintermsForExpansionLookup = mintermsToHighlightInTables;
    hoveredElement.classList.toggle("hl-color", isOn);
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
    // Highlight cells in truth table (inside card-body)
    document
      .querySelectorAll(`.card-body [data-bits="${b}"]`)
      .forEach((n) => n.classList.toggle("hl-cell", on));
    // Highlight cells in symmetry diagram (not inside card-body)
    document
      .querySelectorAll(`#symmetry-diagram [data-bits="${b}"]`)
      .forEach((n) => n.classList.toggle("symmetry-hl-cell", on));
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
  
  const viewToggleMappings = layoutState.viewToggleMappings;
    const cardGrid = document.querySelector("#card-grid");
    // resetLayoutClasses(); // Reset layout classes before applying new ones
    const currentActiveCardCount = Object.values(viewToggleMappings).map(val => val.id)
      .filter(id => $(id) && $(id).style.display !== "none").length;
    const {isLandscape} = layoutState;
  

    const isTruthActive = $(viewToggleMappings.toggleTruthTable.id)?.style.display !== "none";
    const isExprActive = $(viewToggleMappings.toggleExpressions.id)?.style.display !== "none";
    const isMuxActive = $(viewToggleMappings.toggleMux.id)?.style.display !== "none";
    const isSymmetryActive = $(viewToggleMappings.toggleKmap.id)?.style.display !== "none";
    
    console.log(layoutState);
    
    
    if(!cardGrid) return;
    resetGridColsToDefault(); // Reset to default before applying new classes
    
    $(viewToggleMappings.toggleMux.id).classList.add("lg:col-span-2");

    switch (currentActiveCardCount) {
        case 1:{
          cardGrid.classList.add("lg:grid-cols-1");
          break;
        }
        case 2:{
          cardGrid.classList.add("lg:grid-cols-2");
          $(viewToggleMappings.toggleTruthTable.id).classList.add("lg:row-span-2", "lg:col-span-1");
          break;
        }
        case 3: {
          
          cardGrid.classList.add("lg:grid-cols-3");
          break;
        }
        case 4:{
          $(viewToggleMappings.toggleTruthTable.id).classList.add("lg:row-span-2");
          if(!isMuxActive) {
            $(viewToggleMappings.toggleExpressions.id).classList.add("lg:row-span-2");
          } 
          
          cardGrid.classList.add("lg:grid-cols-3");
          
          if(isLandscape) {
            $(viewToggleMappings.toggleExpressions.id).classList.add("lg:row-span-2");
            // mux col span 3
            $(viewToggleMappings.toggleMux.id).classList.add("lg:col-span-3");
            // symmetry row span 2
            $(viewToggleMappings.toggleKmap.id).classList.add("lg:row-span-2");
            
          }

          break;
        }
        case 5: {
          console.log("5 active cards, applying landscape layout");
          console.log(isLandscape);
          
          if (isLandscape) {
            
            cardGrid.classList.add("lg:grid-cols-8");
            $(viewToggleMappings.toggleTruthTable.id).classList.add("lg:row-span-2", "lg:col-span-2");
            getOtherActiveCards([viewToggleMappings.toggleTruthTable.id]).forEach(card => {
              card.classList.add("lg:col-span-3");
            });
            break;
          }
          
          cardGrid.classList.add("lg:grid-cols-3");
          
          
          break;
        }
    }
    if(isLandscape && currentActiveCardCount > 3) {
      $(viewToggleMappings.toggleTruthTable.id).classList.add("lg:row-span-2");
    }
  

  }

export function init() {
  //muxSvgElement = document.querySelector("#muxCard .card-body #muxDiagramSvg"); // Initialize global reference early
  setSvgMux();

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
        // If customFunction exists, rebuild truth table from it, otherwise use old logic
        if (logicState.preset === "custom" && logicState.customFunction && logicState.customFunction.trim() !== "") {
          logicState.nVars++;
          try {
            const { variables, truthArray } = parseLogicFunction(logicState.customFunction, logicState.nVars);
            logicState.truth = truthArrayToTruthTable(truthArray, logicState.nVars);
          } catch (error) {
            console.error("Error parsing custom function:", error);
            // fallback: build empty truth table
            buildTruth(null, oldNVars);
          }
          applyPreset(logicState);
          renderAll();
        } else {
          const oldTruthCopy = logicState.preset === "custom" ? JSON.parse(JSON.stringify(logicState.truth)) : null;
          logicState.nVars++;
          buildTruth(oldTruthCopy, oldNVars);
          applyPreset(logicState);
          renderAll();
        }
      }
    };
  }
  
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
  
}

