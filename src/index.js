
import { init } from "./ui/ui.js";

import { applyPreset } from "./utils/utils.js";

import { logicState, customFunctionState } from "./state.js";


applyPreset(logicState);







// --- Initial Setup ---
// DOMContentLoaded to ensure all elements are available, especially for querySelector.

document.addEventListener("DOMContentLoaded", () => {
  init();
  
});




