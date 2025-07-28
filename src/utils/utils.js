import { VARIABLE_NAMES } from "../index.js";


export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export const $ = (id) => document.getElementById(id);
export const bin = (n, b) => n.toString(2).padStart(b, "0");
export const lbl = (i, neg) => (neg ? `<span class="ov">${VARIABLE_NAMES[i]}</span>` : VARIABLE_NAMES[i]);


export function applyPreset(logicState) {
  if (logicState.preset === "custom") return;
  const preset = logicState.preset.toLowerCase();
  logicState.truth.forEach((r) => {
    const ones = [...r.bits].filter((b) => b === "1").length;
    switch (preset) {
      case "and":
        r.out = ones === logicState.nVars ? 1 : 0;
        break;
      case "or":
        r.out = ones ? 1 : 0;
        break;
      case "xor":
        r.out = ones & 1;
        break;
      case "nand":
        r.out = ones === logicState.nVars ? 0 : 1;
        break;
      case "nor":
        r.out = ones ? 0 : 1;
        break;
      case "xnor":
        r.out = ones & 1 ? 0 : 1;
    }
  });
}


export function truthArrayToTruthTable(truthArray, nVars) {
  return truthArray.map((out,index) => ({out, bits: index.toString(2).padStart(nVars, "0")}));
}