import { logicState, VARIABLE_NAMES } from "../index.js";
import { bin } from "../utils/utils.js";

export function buildTruth(oldTruthArray = null, previousNVars = -1) {
  const newNVars = logicState.nVars;

  if (logicState.preset === "custom" && oldTruthArray && previousNVars !== -1) {
    if (newNVars > previousNVars) {
      const newTruth = [];
      const oldTruthMap = new Map();
      oldTruthArray.forEach((entry) => {
        oldTruthMap.set(entry.bits, entry.out);
      });

      for (let i = 0; i < 1 << newNVars; i++) {
        const currentGlobalBitsRev = bin(i, newNVars)
          .split("")
          .reverse()
          .join("");
        const correspondingOldBitsRev = currentGlobalBitsRev.substring(
          0,
          previousNVars
        );

        let outputValue;
        let allNewVarsAreZero = true;
        for (let k = previousNVars; k < newNVars; k++) {
          if (((i >> k) & 1) === 1) {
            allNewVarsAreZero = false;
            break;
          }
        }

        if (allNewVarsAreZero) {
          outputValue = oldTruthMap.has(correspondingOldBitsRev)
            ? oldTruthMap.get(correspondingOldBitsRev)
            : null;
        } else {
          outputValue = null;
        }
        newTruth.push({ bits: currentGlobalBitsRev, out: outputValue });
      }
      logicState.truth = newTruth;
    } else if (newNVars < previousNVars) {
      const newTruth = [];
      const oldTruthMap = new Map();
      oldTruthArray.forEach((entry) => {
        oldTruthMap.set(entry.bits, entry.out);
      });

      for (let i = 0; i < 1 << newNVars; i++) {
        const currentNewBitsRev = bin(i, newNVars).split("").reverse().join("");
        let correspondingOldBitsRev = currentNewBitsRev;
        for (let k = 0; k < previousNVars - newNVars; k++) {
          correspondingOldBitsRev += "0";
        }

        const outputValue = oldTruthMap.has(correspondingOldBitsRev)
          ? oldTruthMap.get(correspondingOldBitsRev)
          : null;
        newTruth.push({ bits: currentNewBitsRev, out: outputValue });
      }
      logicState.truth = newTruth;
    } else {
      if (oldTruthArray.length === 1 << newNVars) {
        logicState.truth = JSON.parse(JSON.stringify(oldTruthArray));
      } else {
        logicState.truth = [];
        for (let j = 0; j < 1 << newNVars; j++) {
          const rev = bin(j, newNVars).split("").reverse().join("");
          logicState.truth.push({ bits: rev, out: 0 });
        }
      }
    }
  } else {
    logicState.truth = [];
    for (let i = 0; i < 1 << newNVars; i++) {
      const rev = bin(i, newNVars).split("").reverse().join("");
      logicState.truth.push({ bits: rev, out: 0 });
    }
  }
}