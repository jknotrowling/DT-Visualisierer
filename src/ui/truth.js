import { VARIABLE_NAMES, logicState } from "../state.js";
import { renderAll } from "./ui.js";
import { setupTouchFriendlyTruthTable } from "./touch.js";
import { getMinimalExpression } from "../logic/parser.js";
import { customFunctionState } from "../state.js";
import { $ } from "../utils/utils.js";
import { handleCellOrTermHover } from "./hover.js";


export function renderTruth() {
  const nVars = logicState.nVars;
  const header = [...VARIABLE_NAMES.slice(0, nVars).reverse(), "f"];
  const gridCols = nVars + 1;

  const cellWidthClass = "min-w-[2.5rem] px-3";
  
  const gridColsClass = `grid-cols-${gridCols}`;
  let h = `<div class="grid ${gridColsClass} gap-2 bg-white rounded-xl p-4 ">
    ${header
      .map(
        (th) =>
          `<div class="${cellWidthClass} text-center font-semibold text-gray-700 bg-gray-100 rounded py-2">${th}</div>`
      )
      .join("")}
    ${logicState.truth
      .sort(
        (a, b) =>
          parseInt(a.bits.split("").reverse().join(""), 2) -
          parseInt(b.bits.split("").reverse().join(""), 2)
      )
      .map((r) => {
        const cellBase = `${cellWidthClass} flex items-center justify-center text-center rounded transition cursor-pointer border font-bold`;
        let outClass = "";
        let outText = r.out === null ? "-" : r.out;
        if (r.out === 1)
          outClass = "bg-green-100 border-green-600 text-green-700";
        else if (r.out === 0) outClass = "";
        else outClass = "bg-yellow-100 border-yellow-600 text-yellow-700";
        return [
          ...[...r.bits]
            .reverse()
            .map(
              (b) =>
                `<div class="${cellBase} bg-gray-50 border-gray-200">${b}</div>`
            ),
          `<div class="outCell ${cellBase} ${outClass}" data-bits="${r.bits}">${outText}</div>`,
        ].join("");
      })
      .join("")}
  </div>`;
  const truthWrap = document.querySelector(
    "#truthTableCard .card-body #truthWrap"
  );
  if (truthWrap) truthWrap.innerHTML = h;

  setupTouchFriendlyTruthTable(handleCellOrTermHover, onTruthTableCellClick);
}


function onTruthTableCellClick(e) {
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
}