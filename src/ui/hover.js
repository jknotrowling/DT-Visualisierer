import { $ } from "../utils/utils.js";
import { logicState, VARIABLE_NAMES, expansionState } from "../state.js";
import { setupTouchFriendlyTruthTable } from "./touch.js";
import { getMinimalExpression } from "../logic/parser.js";
import { customFunctionState } from "../state.js";
import { renderAll } from "./ui.js";
import { setupTouchFriendlyExpressionTerms } from "./touch.js";
import { highlightMuxElements, MUX_DIAGRAM_STATE, DEFAULT_MUX_CONFIG } from "../logic/mux.js";






export function setupAllHoverInteractions() {
  
  setupTouchFriendlyExpressionTerms(handleCellOrTermHover);
}

export function handleCellOrTermHover(hoveredElement, isOn) {
  let mintermsToHighlightInTables = [];
  let singleMintermForExpansionLookup = null;
  let termCoversMintermsForExpansionLookup = [];

  if (hoveredElement.dataset.bits) {
    mintermsToHighlightInTables = [hoveredElement.dataset.bits];
    singleMintermForExpansionLookup = hoveredElement.dataset.bits;

    console.log("Hovering over", hoveredElement);

    document.querySelectorAll("#expressionsCard .dmf").forEach((termEl) => {
      const coveredByTerm = termEl.dataset.cover
        ? termEl.dataset.cover.split("|")
        : [];
      if (coveredByTerm.includes(singleMintermForExpansionLookup)) {
        termEl.classList.toggle("hl-dmf-cell", isOn);
      }
    });

    document.querySelectorAll("#expressionsCard .cmf").forEach((termEl) => {
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

export function handleExpansionSpanHover(spanElement, isOn, highlightClass) {
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

export function highlightTableCells(arr, on) {
  arr.forEach((b) => {
    const valueAtField = logicState.truth.find((t) => t.bits === b);

    let classSuffix =
      valueAtField?.out === null
        ? "dc"
        : valueAtField?.out === 1
        ? "on"
        : "off";

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
    document
      .querySelectorAll(`#expressionsCard .cnf[data-bits="${b}"]`)
      .forEach((n) => n.classList.toggle(`hl-cnf-cell`, on));
    // Highlight DMF Cells
    document
      .querySelectorAll(`#expressionsCard .dmf[data-cover="${b}"]`)
      .forEach((n) => n.classList.toggle(`hl-dmf-cell`, on));
    // Highlight KMF Cells
    document
      .querySelectorAll(`#expressionsCard .kmf[data-cover="${b}"]`)
      .forEach((n) => n.classList.toggle(`hl-kmf-cell`, on));
  });
}