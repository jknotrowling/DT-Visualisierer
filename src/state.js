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
  customFunction: "!(A)&!(C|D | B ^ A ^ C)|A",  // entered custum function by user
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