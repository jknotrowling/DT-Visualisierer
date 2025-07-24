import {init } from "./ui/ui.js";


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
  preset: "xor"
};







// --- Initial Setup ---
// DOMContentLoaded to ensure all elements are available, especially for querySelector.

document.addEventListener("DOMContentLoaded", init);




