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
  
};

export const customFunctionState = {
  isEditing: false,
  isValid: true,
  customFunction: "0", 
};

export const layoutState = {
   isLandscape: false,
   displayOptionsExpanded: false,
   viewToggleMappings: {
    toggleTruthTable: {id: "truthTableCard", active: true},
    toggleKmap: {id: "kmapCard", active: true},
    toggleExpressions: {id: "expressionsCard", active: true},
    toggleBooleanDev: {id: "booleanDevCard", active: true},
    toggleMux: {id: "muxCard", active: true},
  }
}

export function loadStateFromLocalStorage() {
  const savedState = localStorage.getItem("dt-visualizer-state");
  if (savedState) {
    try {
      const parsedState = JSON.parse(savedState);
      Object.assign(logicState, parsedState.logicState);
      Object.assign(customFunctionState, parsedState.customFunctionState);
      Object.assign(layoutState, parsedState.layoutState);
    } catch (error) {
      console.error("Fehler beim Laden des Zustands aus dem Local Storage:", error);
    }
  }
}

export function saveStateToLocalStorage() {
  const stateToSave = {
    logicState: logicState,
    customFunctionState: customFunctionState,
    layoutState: layoutState,
  };
  try {
    localStorage.setItem("dt-visualizer-state", JSON.stringify(stateToSave));
  } catch (error) {
    console.error("Fehler beim Speichern des Zustands im Local Storage:", error);
  }
}


