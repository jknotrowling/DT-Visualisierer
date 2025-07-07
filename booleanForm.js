import { bin, lbl } from "./utils.js";
import { logicState, VARIABLE_NAMES } from "./index.js";


export function minimize(v_count, mins, dcs = []) {
  const ones = (x) => x.toString(2).replace(/0/g, "").length;
  let g = {},
    pr = new Set();
  [...mins, ...dcs].forEach((m) => {
    const s = bin(m, v_count);
    (g[ones(m)] ??= []).push(s);
  });
  while (true) {
    const nx = {},
      used = new Set();
    let comb = false;
    const ks = Object.keys(g)
      .map(Number)
      .sort((a, b) => a - b);
    for (let i = 0; i < ks.length - 1; i++) {
      (g[ks[i]] || []).forEach((a) =>
        (g[ks[i + 1]] || []).forEach((b) => {
          const diff = [...a].filter((_, k) => a[k] !== b[k]).length;
          if (diff === 1) {
            comb = true;
            const m = a
              .split("")
              .map((ch, k) => (ch === b[k] ? ch : "-"))
              .join("");
            (nx[ones(m.replace(/-/g, ""))] ??= []).push(m);
            used.add(a);
            used.add(b);
          }
        })
      );
    }
    Object.values(g)
      .flat()
      .forEach((s) => {
        if (!used.has(s)) pr.add(s);
      });
    if (!comb) break;
    g = {};
    Object.entries(nx).forEach(([k, a]) => (g[k] = [...new Set(a)]));
  }
  const covers = (p, val) => {
    const bs = bin(val, v_count);
    for (let i = 0; i < v_count; i++)
      if (p[i] !== "-" && p[i] !== bs[i]) return false;
    return true;
  };
  const chart = mins.map((m) => [...pr].filter((p) => covers(p, m)));
  const ess = [],
    cov = new Set();
  chart.forEach((pis, idx) => {
    if (pis.length === 1) {
      const p = pis[0];
      if (!ess.includes(p)) {
        ess.push(p);
        mins.forEach((mVal) => covers(p, mVal) && cov.add(mVal));
      }
    }
  });
  let rest = mins.filter((m) => !cov.has(m)),
    chosen = [...ess];
  while (rest.length) {
    let best = null,
      max = 0;
    pr.forEach((p) => {
      if (chosen.includes(p)) return;
      const c = rest.filter((m) => covers(p, m)).length;
      if (c > max) {
        max = c;
        best = p;
      }
    });
    if (!best) break;
    chosen.push(best);
    rest = rest.filter((m) => !covers(best, m));
  }
  return chosen;
}

export function lit(bits, type) {
  return [...bits]
    .map((b, i) => {
      if (b === "-") return "";
      const neg = type === "dnf" || type === "dmf" ? b === "0" : b === "1";
      return lbl(i, neg);
    })
    .filter(Boolean)
    .join(type === "dnf" || type === "dmf" ? "∧" : "∨");
}

export const expand = (p) => {
  let res = [""];
  [...p].forEach((ch) => {
    res =
      ch === "-"
        ? res.flatMap((s) => [s + "0", s + "1"])
        : res.map((s) => s + ch);
  });
  return res;
};



export function simplifiedBooleanExpansionRecursive(
  bits_template_string,
  depth,
  expansionOrderArray
) {
  if (depth >= logicState.nVars) {
    const finalBitsStr = bits_template_string;
    const row = logicState.truth.find((r) => r.bits === finalBitsStr);
    const val = row ? (row.out === null ? "/" : String(row.out)) : "?";
    return {
      type: "constant",
      value: val,
      minterms: [finalBitsStr],
      path: finalBitsStr,
    };
  }

  const varName = expansionOrderArray[depth];
  const varIndex = VARIABLE_NAMES.indexOf(varName);

  let tempBitsArrayOne = bits_template_string.split("");
  tempBitsArrayOne[varIndex] = "1";
  const pathForOne = tempBitsArrayOne.join("");
  const expNode1 = simplifiedBooleanExpansionRecursive(
    pathForOne,
    depth + 1,
    expansionOrderArray
  );

  let tempBitsArrayZero = bits_template_string.split("");
  tempBitsArrayZero[varIndex] = "0";
  const pathForZero = tempBitsArrayZero.join("");
  const expNode0 = simplifiedBooleanExpansionRecursive(
    pathForZero,
    depth + 1,
    expansionOrderArray
  );

  if (
    expNode1.type === "constant" &&
    expNode0.type === "constant" &&
    expNode1.value === expNode0.value
  ) {
    return {
      type: "constant",
      value: expNode1.value,
      minterms: [
        ...new Set([...expNode1.minterms, ...expNode0.minterms].sort()),
      ],
      path: null,
    };
  }

  if (expNode1.type === "constant" && expNode0.type === "constant") {
    if (
      expNode1.value === "/" &&
      (expNode0.value === "0" || expNode0.value === "1")
    ) {
      return {
        type: "constant",
        value: expNode0.value,
        minterms: [
          ...new Set([...expNode1.minterms, ...expNode0.minterms].sort()),
        ],
        path: null,
      };
    }
    if (
      expNode0.value === "/" &&
      (expNode1.value === "0" || expNode1.value === "1")
    ) {
      return {
        type: "constant",
        value: expNode1.value,
        minterms: [
          ...new Set([...expNode1.minterms, ...expNode0.minterms].sort()),
        ],
        path: null,
      };
    }
  }

  return {
    type: "expression",
    variable: varName,
    varIndex: varIndex,
    positiveBranch: expNode1,
    negativeBranch: expNode0,
    minterms: [...new Set([...expNode1.minterms, ...expNode0.minterms].sort())],
  };
}

