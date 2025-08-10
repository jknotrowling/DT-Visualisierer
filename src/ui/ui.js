import {
  renderSymmetryDiagram,
  setupSymmetryDiagramClickHandler,
} from "./symmetry.js";
import { renderCurrentFunctionExpression } from "./currentFunctionExpression.js";
import {setSvgMux} from "../logic/mux.js";
import { layoutState } from "../state.js";


import {$} from "../utils/utils.js";

import { buildTruth, applyPreset } from "../logic/truth.js";

import { logicState } from "../state.js";

import { updateGridCols } from "./layout.js";

import {
  disabledButtonsOnEditingCustomFunction,
  updatePresetButtonStates,
  setUpNVarsPlusMinusButtonEvents,
  setUpPresetButtonEvents,
  setUpLandscapeToggleButton,
  setUpViewToggleCheckboxEvents,
} from "./controlls.js";

import { renderTruth } from "./truth.js";
import { renderExpr } from "./canonForm.js";
import { renderDev, renderMUX} from "./mux.js";

import { setupAllHoverInteractions } from "./hover.js";

export function renderAll() {
  $("varCountLbl").textContent = logicState.nVars;

 

  renderTruth(); 

  renderCurrentFunctionExpression(); 

  renderSymmetryDiagram();

  renderExpr(); 

  renderDev();

  disabledButtonsOnEditingCustomFunction();
  updatePresetButtonStates();
  setupSymmetryDiagramClickHandler();
  setupAllHoverInteractions();

   

}

export function init() {
  setSvgMux();

  buildTruth();
  applyPreset(logicState);
  updateGridCols();
  setUpNVarsPlusMinusButtonEvents();
  setUpPresetButtonEvents();
  setUpLandscapeToggleButton();
  setUpViewToggleCheckboxEvents();
  renderMUX();

  renderAll();
}
