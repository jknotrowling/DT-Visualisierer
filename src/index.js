
import { init } from "./ui/ui.js";

import { applyPreset } from "./utils/utils.js";


export const VARIABLE_NAMES = ["A", "B", "C", "D"];

export const expansionState = {
    spanData: {},
    spanIdCounter: 0,
    groupIdCounter: 0,
};

export const DEFAULT_LAYOUT_CONFIG = {
  paddingX: 50,
  paddingY: 50,
  spacingX: 80,
  spacingY: 30,
};


export const logicState = {
  nVars: 3,
  truth: [],
  preset: "AND",
  customFunction: "",
};

export const layoutState = {
   isLandscape: false,
   viewToggleMappings: {
    toggleTruthTable: {id: "truthTableCard", active: true},
    toggleKmap: {id: "kmapCard", active: true},
    toggleExpressions: {id: "expressionsCard", active: true},
    toggleBooleanDev: {id: "booleanDevCard", active: true},
    toggleMux: {id: "muxCard", active: true},
  }
}

// Initialisiere truth passend zum Preset

applyPreset(logicState);







// --- Initial Setup ---
// DOMContentLoaded to ensure all elements are available, especially for querySelector.

document.addEventListener("DOMContentLoaded", () => {
  init();
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
});




