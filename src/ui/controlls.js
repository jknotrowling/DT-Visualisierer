import { logicState, layoutState } from "../state.js";
import { $ } from "../utils/utils.js";
import { customFunctionState } from "../state.js";
import { debounce } from "../utils/utils.js";
import {  renderAll } from "./ui.js";
import { buildTruth} from "../logic/truth.js"
import { applyPreset } from "../logic/truth.js";
import { updateGridCols } from "./layout.js";
import { renderDev } from "./mux.js";



export function disabledButtonsOnEditingCustomFunction() {
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

export function updatePresetButtonStates() {
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

export function setUpNVarsPlusMinusButtonEvents() {
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
          logicState.nVars++;
          if (logicState.preset === "custom") {
          
            logicState.preset = "AND";
            
          } else {
            const oldTruthCopy = logicState.preset === "custom" ? JSON.parse(JSON.stringify(logicState.truth)) : null;
            buildTruth(oldTruthCopy, oldNVars);
          }
          applyPreset(logicState);
          renderAll();
        }
      };
    }
}


export function setUpPresetButtonEvents() {
  const presetBtns = document.querySelectorAll('.preset-btn');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Get selected value
      const value = btn.getAttribute('data-value');
      logicState.preset = value;
      applyPreset(logicState);
      renderAll();
    });
  });
}

export function initializeCollapseToggle() {
  const collapseToggle = $("collapseToggle");
  const displayOptionsContent = $("displayOptionsContent");
  const collapseIcon = $("collapseIcon");

  if (!collapseToggle || !displayOptionsContent || !collapseIcon) {
    console.warn("Collapse elements not found");
    return;
  }

  // Set initial state (expanded by default)
  layoutState.displayOptionsExpanded =
    layoutState.displayOptionsExpanded !== false; // Default to true
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

export function setUpViewToggleCheckboxEvents() {
  const viewToggleMappings = layoutState.viewToggleMappings;

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
          renderDev();
        }

        updateGridCols();

        // adjustMuxCardHeight(); // Adjust height when any view visibility changes
      });
    }
  }
}

export function setUpLandscapeToggleButton() {
    const landscapeToggleBtnEl = $("landscapeToggleBtn");
    const pageEl = document.querySelector(".page"); // Assuming .page is the main container to toggle class on
    const cardGrid = document.querySelector("#card-grid");
    if (landscapeToggleBtnEl && pageEl && cardGrid) {
      landscapeToggleBtnEl.onclick = () => {
        pageEl.classList.toggle("landscape-mode");
  
        layoutState.isLandscape = !layoutState.isLandscape;
  
        updateGridCols();
  
        // After toggling, we might need to trigger a resize/render for elements like MUX
        debouncedMuxRender();
        
      };
    }
  
    // Initialize collapse functionality
    initializeCollapseToggle();
}