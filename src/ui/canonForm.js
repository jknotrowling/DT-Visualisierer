import { minimize, expand, lit } from "../logic/bool.js";
import { logicState} from "../state.js";


export function renderExpr() {
  const ones = logicState.truth
    .filter((r) => r.out === 1)
    .map((r) => parseInt(r.bits, 2));
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
                  </div>`; //"<strong>DNF:</strong><br>";
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
                  </div>`; //"<hr><strong>KNF:</strong><br>";
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
                  </div>`; //"<hr><strong>DMF (min):</strong><br>";
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
                  </div>`; //"<hr><strong>KMF (min):</strong><br>";
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



