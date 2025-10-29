import { VARIABLE_NAMES } from "../state.js";


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



export function truthArrayToTruthTable(truthArray, nVars) {
  return truthArray.map((out,index) => ({out, bits: index.toString(2).padStart(nVars, "0")}));
}

export function zeroTruthTable(nVars) {
  return Array.from({ length: 2 ** nVars }, (_, index) => ({
    out: 0,
    bits: index.toString(2).padStart(nVars, "0")
  }));
}